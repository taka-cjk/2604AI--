import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  PRIVACY_POLICY_VERSION,
  validateAffiliations,
  validateAgeGroup,
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

  const [
    { data: profile, error: profileError },
    { data: onboarding, error: onboardingError },
    { data: affiliations, error: affiliationsError },
  ] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, wants")
        .eq("id", user.id)
        .single(),
      supabase
        .from("user_onboarding")
        .select(
          "age_group, onboarding_current_step, onboarding_completed_at, privacy_policy_accepted_at, privacy_policy_version",
        )
        .eq("profile_id", user.id)
        .single(),
      supabase
        .from("profile_affiliations")
        .select("id, affiliation_type, affiliation_name, position")
        .eq("profile_id", user.id)
        .order("position"),
    ])

  if (profileError || onboardingError || !profile || !onboarding) {
    return errorResponse("Onboarding state not found.", 404)
  }
  if (affiliationsError) return errorResponse("Could not load affiliations.", 500)

  return NextResponse.json({
    profile: { ...profile, ...onboarding },
    affiliations: affiliations ?? [],
  })
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

  const { data: onboarding, error: onboardingError } = await supabase
    .from("user_onboarding")
    .select("onboarding_current_step, onboarding_completed_at")
    .eq("profile_id", user.id)
    .single()

  if (onboardingError || !onboarding) return errorResponse("Onboarding state not found.", 404)
  if (onboarding.onboarding_completed_at) {
    return errorResponse("Onboarding is already complete.", 409)
  }

  const requestedStep = stepNumbers[body.step]
  if (onboarding.onboarding_current_step < requestedStep) {
    return errorResponse("Complete the previous onboarding step first.", 409)
  }

  if (body.step === "name") {
    const result = validateName(body.name)
    if (!result.success) return errorResponse(result.error)

    const { data: onboardingStep, error } = await supabase.rpc("save_my_onboarding_name", {
      p_name: result.value,
    })

    if (error) return errorResponse("Could not save your name.", 500)
    return NextResponse.json({ onboardingStep, completedAt: null })
  }

  if (body.step === "age_group") {
    const result = validateAgeGroup(body.ageGroup)
    if (!result.success) return errorResponse(result.error)

    const { data: onboardingStep, error } = await supabase.rpc("save_my_onboarding_age_group", {
      p_age_group: result.value,
    })

    if (error) return errorResponse("Could not save your age group.", 500)
    return NextResponse.json({ onboardingStep, completedAt: null })
  }

  if (body.step === "affiliations") {
    const result = validateAffiliations(body.affiliations)
    if (!result.success) return errorResponse(result.error)

    const { data: onboardingStep, error: affiliationError } = await supabase.rpc(
      "replace_my_onboarding_affiliations",
      { p_affiliations: result.value },
    )
    if (affiliationError) return errorResponse("Could not save your affiliations.", 500)
    return NextResponse.json({ onboardingStep, completedAt: null })
  }

  if (body.step === "interests") {
    const result = validateInterests(body.interests)
    if (!result.success) return errorResponse(result.error)

    const { data: onboardingStep, error } = await supabase.rpc("save_my_onboarding_interests", {
      p_interests: result.value,
    })

    if (error) return errorResponse("Could not save your interests.", 500)
    return NextResponse.json({ onboardingStep, completedAt: null })
  }

  if (body.step === "privacy") {
    const acceptance = validatePrivacyAcceptance(body.accepted)
    if (!acceptance.success) return errorResponse(acceptance.error)

    const { data: completedAt, error } = await supabase.rpc("complete_my_onboarding", {
      p_accepted: acceptance.value,
      p_privacy_policy_version: PRIVACY_POLICY_VERSION,
    })

    if (error) return errorResponse("Complete every onboarding step before continuing.", 409)

    return NextResponse.json({
      onboardingStep: 6,
      completedAt,
    })
  }

  return errorResponse("Invalid onboarding step.")
}
