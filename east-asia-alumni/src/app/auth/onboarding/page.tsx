import { redirect } from "next/navigation"
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow"
import { createClient } from "@/lib/supabase/server"
import type { AffiliationType, AgeGroup } from "@/lib/onboarding"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const [{ data: profile }, { data: onboarding }, { data: affiliations }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, wants")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_onboarding")
      .select("age_group, onboarding_current_step, onboarding_completed_at")
      .eq("profile_id", user.id)
      .single(),
    supabase
      .from("profile_affiliations")
      .select("affiliation_type, affiliation_name")
      .eq("profile_id", user.id)
      .order("position"),
  ])

  if (!profile || !onboarding) redirect("/auth/login")
  if (onboarding.onboarding_completed_at) redirect("/feed")

  return (
    <OnboardingFlow
      initialName={profile.full_name}
      initialAgeGroup={(onboarding.age_group as AgeGroup | null) ?? ""}
      initialAffiliations={(affiliations ?? []).map((affiliation) => ({
        type: affiliation.affiliation_type as AffiliationType,
        name: affiliation.affiliation_name ?? "",
      }))}
      initialInterests={profile.wants ?? []}
      initialStep={Math.min(Math.max(onboarding.onboarding_current_step, 1), 5)}
    />
  )
}
