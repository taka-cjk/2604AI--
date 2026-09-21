import assert from "node:assert/strict"
import test from "node:test"
import {
  canonicalizeUniversityName,
  findUniversityByInput,
  searchUniversities,
} from "../src/data/universities.ts"
import {
  getAuthRedirect,
  validateAffiliations,
  validateAgeGroup,
  validateCompletionState,
  validateInterests,
  validateName,
  validatePrivacyAcceptance,
} from "../src/lib/onboarding.ts"

test("trims and validates the display name", () => {
  assert.deepEqual(validateName("  Taro Yamada  "), { success: true, value: "Taro Yamada" })
  assert.equal(validateName("   ").success, false)
  assert.equal(validateName("a".repeat(101)).success, false)
})

test("accepts only stable age-group values", () => {
  assert.deepEqual(validateAgeGroup("23_29"), { success: true, value: "23_29" })
  assert.equal(validateAgeGroup("23 to 29").success, false)
})

test("normalizes multiple affiliations and requires names when appropriate", () => {
  assert.deepEqual(
    validateAffiliations([
      { type: "university", name: "  Keio University " },
      { type: "company", name: " Example Inc. " },
    ]),
    {
      success: true,
      value: [
        { type: "university", name: "Keio University" },
        { type: "company", name: "Example Inc." },
      ],
    },
  )
  assert.equal(validateAffiliations([{ type: "company", name: "" }]).success, false)
  assert.equal(
    validateAffiliations([
      { type: "company", name: "Example" },
      { type: "company", name: "example" },
    ]).success,
    false,
  )
  assert.equal(
    validateAffiliations([
      { type: "none", name: null },
      { type: "other", name: "Community" },
    ]).success,
    false,
  )
})

test("canonicalizes university spelling variants to one saved name", () => {
  for (const variant of [
    "keio",
    "Keio University",
    "Keio Graduate School",
    "慶応",
    "慶應",
    "慶応大学",
    "慶應義塾大学",
    "慶應義塾大学大学院",
  ]) {
    assert.equal(canonicalizeUniversityName(variant), "Keio University")
  }
  assert.equal(findUniversityByInput("早稲田")?.name, "Waseda University")
  assert.equal(searchUniversities("慶応")[0]?.name, "Keio University")
})

test("keeps university and graduate school as separate affiliations", () => {
  assert.deepEqual(
    validateAffiliations([
      { type: "university", name: "慶応" },
      { type: "graduate_school", name: "keio" },
    ]),
    {
      success: true,
      value: [
        { type: "university", name: "Keio University" },
        { type: "graduate_school", name: "Keio University" },
      ],
    },
  )
  assert.equal(
    validateAffiliations([
      { type: "university", name: "慶応" },
      { type: "university", name: "Keio University" },
    ]).success,
    false,
  )
})

test("accepts multiple known interests and rejects unknown or duplicate values", () => {
  assert.deepEqual(validateInterests(["career", "study"]), {
    success: true,
    value: ["career", "study"],
  })
  assert.equal(validateInterests(["career", "career"]).success, false)
  assert.equal(validateInterests(["not-a-real-interest"]).success, false)
})

test("requires explicit privacy acceptance", () => {
  assert.equal(validatePrivacyAcceptance(false).success, false)
  assert.deepEqual(validatePrivacyAcceptance(true), { success: true, value: true })
})

test("allows completion only after all persisted steps are valid", () => {
  const completeState = {
    full_name: "Taro Yamada",
    age_group: "23_29",
    wants: ["career", "study"],
    onboarding_current_step: 5,
    onboarding_completed_at: null,
  }
  const affiliations = [{ type: "company", name: "Example Inc." }]

  assert.equal(validateCompletionState(completeState, affiliations).success, true)
  assert.equal(
    validateCompletionState({ ...completeState, onboarding_current_step: 4 }, affiliations).success,
    false,
  )
  assert.equal(validateCompletionState({ ...completeState, age_group: null }, affiliations).success, false)
  assert.equal(validateCompletionState(completeState, []).success, false)
})

test("redirects unauthenticated users without changing public auth behavior", () => {
  assert.equal(
    getAuthRedirect({ pathname: "/feed", isAuthenticated: false, onboardingCompleted: false }),
    "/auth/login",
  )
  assert.equal(
    getAuthRedirect({
      pathname: "/auth/onboarding",
      isAuthenticated: false,
      onboardingCompleted: false,
    }),
    "/auth/login",
  )
  assert.equal(
    getAuthRedirect({ pathname: "/auth/login", isAuthenticated: false, onboardingCompleted: false }),
    null,
  )
})

test("keeps incomplete users in onboarding and allows completed users into the app", () => {
  assert.equal(
    getAuthRedirect({ pathname: "/feed", isAuthenticated: true, onboardingCompleted: false }),
    "/auth/onboarding",
  )
  assert.equal(
    getAuthRedirect({ pathname: "/feed", isAuthenticated: true, onboardingCompleted: true }),
    null,
  )
  assert.equal(
    getAuthRedirect({
      pathname: "/auth/onboarding",
      isAuthenticated: true,
      onboardingCompleted: true,
    }),
    "/feed",
  )
  assert.equal(
    getAuthRedirect({ pathname: "/auth/login", isAuthenticated: true, onboardingCompleted: false }),
    "/auth/onboarding",
  )
  assert.equal(
    getAuthRedirect({ pathname: "/auth/login", isAuthenticated: true, onboardingCompleted: true }),
    "/feed",
  )
})
