import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  ONBOARDING_COMPLETE_STEP,
  PRIVACY_POLICY_VERSION,
  validateAffiliations,
  validateAgeGroup,
  validateCompletionState,
  validateInterests,
  validateName,
  validatePrivacyAcceptance,
} from "@/lib/onboarding"

type StepName = "name" | "age_group" | "affiliations" | "interests" | "privacy"

const stepNumbers: Record<StepName, number> = {
  name: 1,
  age_group: 2,
  affiliations: 3,
  interests: 4,
  privacy: 5,
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function isStepName(value: unknown): value is StepName {
  return typeof value === "string" && value in stepNumbers
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse("Authentication required.", 401)

  const [{ data: profile, error: profileError }, { data: affiliations, error: affiliationsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "full_name, age_group, wants, onboarding_current_step, onboarding_completed_at, privacy_policy_accepted_at, privacy_policy_version",
        )
        .eq("id", user.id)
        .single(),
      supabase
        .from("profile_affiliations")
        .select("id, affiliation_type, affiliation_name, position")
        .eq("profile_id", user.id)
        .order("position"),
    ])

  if (profileError || !profile) return errorResponse("Profile not found.", 404)
  if (affiliationsError) return errorResponse("Could not load affiliations.", 500)

  return NextResponse.json({ profile, affiliations: affiliations ?? [] })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse("Authentication required.", 401)

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return errorResponse("Invalid JSON body.")
  }

  if (!isStepName(body.step)) return errorResponse("Invalid onboarding step.")

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, age_group, wants, onboarding_current_step, onboarding_completed_at")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) return errorResponse("Profile not found.", 404)
  if (profile.onboarding_completed_at) {
    return errorResponse("Onboarding is already complete.", 409)
  }

  const requestedStep = stepNumbers[body.step]
  if (profile.onboarding_current_step < requestedStep) {
    return errorResponse("Complete the previous onboarding step first.", 409)
  }

  const nextStep = Math.max(profile.onboarding_current_step, requestedStep + 1)

  if (body.step === "name") {
    const result = validateName(body.name)
    if (!result.success) return errorResponse(result.error)

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: result.value, onboarding_current_step: nextStep })
      .eq("id", user.id)

    if (error) return errorResponse("Could not save your name.", 500)
  }

  if (body.step === "age_group") {
    const result = validateAgeGroup(body.ageGroup)
    if (!result.success) return errorResponse(result.error)

    const { error } = await supabase
      .from("profiles")
      .update({ age_group: result.value, onboarding_current_step: nextStep })
      .eq("id", user.id)

    if (error) return errorResponse("Could not save your age group.", 500)
  }

  if (body.step === "affiliations") {
    const result = validateAffiliations(body.affiliations)
    if (!result.success) return errorResponse(result.error)

    const { error: affiliationError } = await supabase.rpc(
      "replace_my_onboarding_affiliations",
      { p_affiliations: result.value },
    )
    if (affiliationError) return errorResponse("Could not save your affiliations.", 500)

    const { error: stepError } = await supabase
      .from("profiles")
      .update({ onboarding_current_step: nextStep })
      .eq("id", user.id)
    if (stepError) return errorResponse("Affiliations were saved, but progress could not be updated.", 500)
  }

  if (body.step === "interests") {
    const result = validateInterests(body.interests)
    if (!result.success) return errorResponse(result.error)

    const { error } = await supabase
      .from("profiles")
      .update({ wants: result.value, onboarding_current_step: nextStep })
      .eq("id", user.id)

    if (error) return errorResponse("Could not save your interests.", 500)
  }

  if (body.step === "privacy") {
    const acceptance = validatePrivacyAcceptance(body.accepted)
    if (!acceptance.success) return errorResponse(acceptance.error)

    const { data: affiliations, error: affiliationsError } = await supabase
      .from("profile_affiliations")
      .select("affiliation_type, affiliation_name")
      .eq("profile_id", user.id)
      .order("position")

    if (affiliationsError) return errorResponse("Could not verify your affiliations.", 500)

    const completion = validateCompletionState(
      profile,
      (affiliations ?? []).map((affiliation) => ({
        type: affiliation.affiliation_type,
        name: affiliation.affiliation_name,
      })),
    )
    if (!completion.success) return errorResponse(completion.error, 409)

    const acceptedAt = new Date().toISOString()
    const { error } = await supabase
      .from("profiles")
      .update({
        privacy_policy_accepted_at: acceptedAt,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
        onboarding_completed_at: acceptedAt,
        onboarding_current_step: ONBOARDING_COMPLETE_STEP,
      })
      .eq("id", user.id)

    if (error) return errorResponse("Could not complete onboarding.", 500)

    return NextResponse.json({
      onboardingStep: ONBOARDING_COMPLETE_STEP,
      completedAt: acceptedAt,
    })
  }

  return NextResponse.json({ onboardingStep: nextStep, completedAt: null })
}
