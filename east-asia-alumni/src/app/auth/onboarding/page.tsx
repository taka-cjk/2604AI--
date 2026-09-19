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

  const [{ data: profile }, { data: affiliations }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, age_group, wants, onboarding_current_step, onboarding_completed_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profile_affiliations")
      .select("affiliation_type, affiliation_name")
      .eq("profile_id", user.id)
      .order("position"),
  ])

  if (!profile) redirect("/auth/login")
  if (profile.onboarding_completed_at) redirect("/feed")

  return (
    <OnboardingFlow
      initialName={profile.full_name}
      initialAgeGroup={(profile.age_group as AgeGroup | null) ?? ""}
      initialAffiliations={(affiliations ?? []).map((affiliation) => ({
        type: affiliation.affiliation_type as AffiliationType,
        name: affiliation.affiliation_name ?? "",
      }))}
      initialInterests={profile.wants ?? []}
      initialStep={Math.min(Math.max(profile.onboarding_current_step, 1), 5)}
    />
  )
}
