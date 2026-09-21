import { WANTS_OPTIONS } from "../data/wants.ts"
import { canonicalizeUniversityName } from "../data/universities.ts"

export const ONBOARDING_TOTAL_STEPS = 5
export const ONBOARDING_COMPLETE_STEP = 6
export const PRIVACY_POLICY_VERSION = "2026-09-19"
export const MAX_NAME_LENGTH = 100
export const MAX_AFFILIATION_NAME_LENGTH = 120
export const MAX_AFFILIATIONS = 10

export const AGE_GROUP_OPTIONS = [
  { value: "under_18", label: "Under 18" },
  { value: "18_22", label: "18–22" },
  { value: "23_29", label: "23–29" },
  { value: "30_39", label: "30–39" },
  { value: "40_plus", label: "40 or older" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const

export const AFFILIATION_TYPE_OPTIONS = [
  { value: "university", label: "University" },
  { value: "graduate_school", label: "Graduate school" },
  { value: "company", label: "Company" },
  { value: "other", label: "Other organization" },
  { value: "none", label: "No affiliation" },
] as const

export type AgeGroup = (typeof AGE_GROUP_OPTIONS)[number]["value"]
export type AffiliationType = (typeof AFFILIATION_TYPE_OPTIONS)[number]["value"]

export type AffiliationInput = {
  type: AffiliationType
  name: string | null
}

export type OnboardingProfileState = {
  full_name: string
  age_group: string | null
  wants: string[] | null
  onboarding_current_step: number
  onboarding_completed_at: string | null
}

export type RouteDecisionInput = {
  pathname: string
  isAuthenticated: boolean
  onboardingCompleted: boolean
}

export type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; error: string }

const ageGroups = new Set<string>(AGE_GROUP_OPTIONS.map((option) => option.value))
const affiliationTypes = new Set<string>(AFFILIATION_TYPE_OPTIONS.map((option) => option.value))
const academicAffiliationTypes = new Set<AffiliationType>(["university", "graduate_school"])
const interestValues = new Set<string>(WANTS_OPTIONS.map((option) => option.value))

export function validateName(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") {
    return { success: false, error: "Name is required." }
  }

  const name = value.trim()
  if (!name) return { success: false, error: "Name is required." }
  if (name.length > MAX_NAME_LENGTH) {
    return { success: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` }
  }

  return { success: true, value: name }
}

export function validateAgeGroup(value: unknown): ValidationResult<AgeGroup> {
  if (typeof value !== "string" || !ageGroups.has(value)) {
    return { success: false, error: "Select a valid age group." }
  }

  return { success: true, value: value as AgeGroup }
}

export function validateAffiliations(value: unknown): ValidationResult<AffiliationInput[]> {
  if (!Array.isArray(value) || value.length < 1) {
    return { success: false, error: "Select at least one affiliation option." }
  }
  if (value.length > MAX_AFFILIATIONS) {
    return { success: false, error: `You can add up to ${MAX_AFFILIATIONS} affiliations.` }
  }

  const normalized: AffiliationInput[] = []
  const seen = new Set<string>()

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return { success: false, error: "Invalid affiliation." }
    }

    const raw = item as { type?: unknown; name?: unknown }
    if (typeof raw.type !== "string" || !affiliationTypes.has(raw.type)) {
      return { success: false, error: "Select a valid affiliation type." }
    }

    const type = raw.type as AffiliationType
    const name = typeof raw.name === "string" ? raw.name.trim() : ""

    if (type === "none") {
      if (name) return { success: false, error: "No name is needed for no affiliation." }
      normalized.push({ type, name: null })
      continue
    }

    if (!name) return { success: false, error: "Enter the affiliation name." }
    if (name.length > MAX_AFFILIATION_NAME_LENGTH) {
      return {
        success: false,
        error: `Affiliation names must be ${MAX_AFFILIATION_NAME_LENGTH} characters or fewer.`,
      }
    }

    const normalizedName = academicAffiliationTypes.has(type)
      ? canonicalizeUniversityName(name)
      : name
    const key = `${type}:${normalizedName.toLocaleLowerCase()}`
    if (seen.has(key)) {
      return { success: false, error: "Duplicate affiliations are not allowed." }
    }
    seen.add(key)
    normalized.push({ type, name: normalizedName })
  }

  if (normalized.some((item) => item.type === "none") && normalized.length > 1) {
    return { success: false, error: "No affiliation cannot be combined with another option." }
  }

  return { success: true, value: normalized }
}

export function validateInterests(value: unknown): ValidationResult<string[]> {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return { success: false, error: "Interests must be a list." }
  }

  const interests = value as string[]
  if (new Set(interests).size !== interests.length) {
    return { success: false, error: "Duplicate interests are not allowed." }
  }
  if (interests.some((interest) => !interestValues.has(interest))) {
    return { success: false, error: "One or more interests are invalid." }
  }

  return { success: true, value: interests }
}

export function validatePrivacyAcceptance(value: unknown): ValidationResult<true> {
  if (value !== true) {
    return { success: false, error: "You must accept the Privacy Policy to continue." }
  }
  return { success: true, value: true }
}

export function validateCompletionState(
  profile: OnboardingProfileState,
  affiliations: unknown,
): ValidationResult<true> {
  const name = validateName(profile.full_name)
  if (!name.success) return { success: false, error: "Complete the name step first." }

  const ageGroup = validateAgeGroup(profile.age_group)
  if (!ageGroup.success) return { success: false, error: "Complete the age group step first." }

  const affiliationResult = validateAffiliations(affiliations)
  if (!affiliationResult.success) {
    return { success: false, error: "Complete the affiliation step first." }
  }

  const interests = validateInterests(profile.wants ?? [])
  if (!interests.success || profile.onboarding_current_step < ONBOARDING_TOTAL_STEPS) {
    return { success: false, error: "Complete the interests step first." }
  }

  return { success: true, value: true }
}

export function getAuthRedirect({
  pathname,
  isAuthenticated,
  onboardingCompleted,
}: RouteDecisionInput): string | null {
  const protectedPrefixes = [
    "/feed",
    "/discover",
    "/profile",
    "/events",
    "/messages",
    "/notifications",
  ]
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
  const isOnboarding = pathname.startsWith("/auth/onboarding")
  const isAuthPage = pathname.startsWith("/auth")
  const authExemptPrefixes = [
    "/auth/onboarding",
    "/auth/reset-password",
    "/auth/callback",
    "/auth/confirm",
  ]

  if (!isAuthenticated && (isProtected || isOnboarding)) return "/auth/login"
  if (!isAuthenticated) return null

  if (!onboardingCompleted && isProtected) return "/auth/onboarding"
  if (onboardingCompleted && isOnboarding) return "/feed"

  const isExemptAuthPage = authExemptPrefixes.some((prefix) => pathname.startsWith(prefix))
  if (isAuthPage && !isExemptAuthPage) {
    return onboardingCompleted ? "/feed" : "/auth/onboarding"
  }

  return null
}
