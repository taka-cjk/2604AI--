import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

function loadLocalEnv() {
  const contents = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    const value = match[2].trim().replace(/^(['"])(.*)\1$/, "$2")
    process.env[match[1]] = value
  }
}

loadLocalEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const accessToken = process.env.SUPABASE_ACCESS_TOKEN
const baseUrl = process.env.ONBOARDING_TEST_BASE_URL ?? "http://127.0.0.1:3100"

assert(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL is required")
assert(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
assert(accessToken, "SUPABASE_ACCESS_TOKEN is required")

const projectRef = new URL(supabaseUrl).hostname.split(".")[0]

async function getServiceRoleKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/api-keys?reveal=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  assert.equal(response.ok, true, `Could not load project API keys (${response.status})`)
  const keys = await response.json()
  const serviceRole = keys.find((key) => key.name === "service_role")
  assert(serviceRole?.api_key, "service_role key was not available")
  return serviceRole.api_key
}

async function createAuthenticatedClient(email, password) {
  const cookieJar = new Map()
  const client = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return [...cookieJar.entries()].map(([name, value]) => ({ name, value }))
      },
      setAll(cookies) {
        for (const cookie of cookies) cookieJar.set(cookie.name, cookie.value)
      },
    },
  })

  const { error } = await client.auth.signInWithPassword({ email, password })
  assert.equal(error, null, `Could not sign in integration user: ${error?.message}`)

  return {
    client,
    cookieHeader() {
      return [...cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join("; ")
    },
  }
}

async function onboardingRequest(authenticatedClient, method, body) {
  const response = await fetch(`${baseUrl}/api/onboarding`, {
    method,
    headers: {
      Cookie: authenticatedClient.cookieHeader(),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { response, json: await response.json() }
}

const serviceRoleKey = await getServiceRoleKey()
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const anonymous = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const nonce = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
const password = `Integration-${crypto.randomUUID()}-A1!`
const users = [
  { email: `onboarding-a-${nonce}@example.com`, name: "Integration User A", id: null },
  { email: `onboarding-b-${nonce}@example.com`, name: "Integration User B", id: null },
]

let assertions = 0
function verified(condition, message) {
  assert(condition, message)
  assertions += 1
}

try {
  for (const user of users) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: user.name },
    })
    assert.equal(error, null, `Could not create integration user: ${error?.message}`)
    assert(data.user)
    user.id = data.user.id
  }

  const userA = await createAuthenticatedClient(users[0].email, password)
  const userB = await createAuthenticatedClient(users[1].email, password)

  const initial = await onboardingRequest(userA, "GET")
  verified(initial.response.status === 200, "New user should load onboarding state")
  verified(initial.json.profile.onboarding_current_step === 1, "New user should begin at step 1")
  verified(initial.json.profile.onboarding_completed_at === null, "New user should be incomplete")

  const { error: anonymousOnboardingError } = await anonymous
    .from("user_onboarding")
    .select("profile_id")
    .eq("profile_id", users[0].id)
  verified(Boolean(anonymousOnboardingError), "Anonymous users must not read onboarding state")

  const nameResult = await onboardingRequest(userA, "PATCH", {
    step: "name",
    name: "  Updated Integration User A  ",
    user_id: users[1].id,
  })
  verified(nameResult.response.status === 200, "Name step should save")

  const { data: names } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", [users[0].id, users[1].id])
  const nameById = new Map(names.map((profile) => [profile.id, profile.full_name]))
  verified(nameById.get(users[0].id) === "Updated Integration User A", "Name should be trimmed")
  verified(nameById.get(users[1].id) === users[1].name, "Body user_id must be ignored")

  const ageResult = await onboardingRequest(userA, "PATCH", {
    step: "age_group",
    ageGroup: "23_29",
  })
  verified(ageResult.response.status === 200, "Age-group step should save")

  const { data: hiddenOnboarding } = await userB.client
    .from("user_onboarding")
    .select("profile_id")
    .eq("profile_id", users[0].id)
  verified(hiddenOnboarding?.length === 0, "Another user's onboarding state must be hidden by RLS")

  const { error: directCompletionError } = await userA.client
    .from("user_onboarding")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("profile_id", users[0].id)
  verified(Boolean(directCompletionError), "Direct onboarding-state updates must be denied")

  const affiliationResult = await onboardingRequest(userA, "PATCH", {
    step: "affiliations",
    affiliations: [
      { type: "university", name: "慶応" },
      { type: "graduate_school", name: "keio" },
      { type: "company", name: "Example Inc." },
    ],
  })
  verified(affiliationResult.response.status === 200, "Multiple affiliations should save")

  const { data: ownAffiliations } = await userA.client
    .from("profile_affiliations")
    .select("profile_id, affiliation_type, affiliation_name")
  verified(ownAffiliations?.length === 3, "User should read all own affiliations")
  verified(
    ownAffiliations?.filter(
      (row) =>
        ["university", "graduate_school"].includes(row.affiliation_type) &&
        row.affiliation_name === "Keio University",
    ).length === 2,
    "University variants should be stored under one canonical name",
  )

  const { data: hiddenAffiliations } = await userB.client
    .from("profile_affiliations")
    .select("profile_id")
    .eq("profile_id", users[0].id)
  verified(hiddenAffiliations?.length === 0, "Another user's affiliations must be hidden by RLS")

  const { error: directAffiliationError } = await userA.client
    .from("profile_affiliations")
    .insert({
      profile_id: users[0].id,
      affiliation_type: "company",
      affiliation_name: "Bypass Inc.",
      position: 9,
    })
  verified(Boolean(directAffiliationError), "Direct affiliation writes must be denied")

  const { data: forbiddenUpdate, error: forbiddenUpdateError } = await userB.client
    .from("profiles")
    .update({ full_name: "Unauthorized change" })
    .eq("id", users[0].id)
    .select("id")
  verified(forbiddenUpdateError === null, "RLS update should fail closed without leaking an error")
  verified(forbiddenUpdate?.length === 0, "Another user's profile update must affect zero rows")

  const userBName = await onboardingRequest(userB, "PATCH", {
    step: "name",
    name: users[1].name,
  })
  verified(userBName.response.status === 200, "Second user should save their own name")
  const userBAge = await onboardingRequest(userB, "PATCH", {
    step: "age_group",
    ageGroup: "prefer_not_to_say",
  })
  verified(userBAge.response.status === 200, "Second user should save their own age group")

  const { error: ownRpcError } = await userB.client.rpc("replace_my_onboarding_affiliations", {
    p_affiliations: [{ type: "none", name: null }],
  })
  verified(ownRpcError === null, "Affiliation RPC should operate for the authenticated user")
  const { data: allTestAffiliations } = await admin
    .from("profile_affiliations")
    .select("profile_id, affiliation_type")
    .in("profile_id", [users[0].id, users[1].id])
  verified(
    allTestAffiliations.filter((row) => row.profile_id === users[0].id).length === 3,
    "RPC must not replace another user's affiliations",
  )
  verified(
    allTestAffiliations.filter((row) => row.profile_id === users[1].id).length === 1,
    "RPC should derive its target from auth.uid()",
  )

  const interestsResult = await onboardingRequest(userA, "PATCH", {
    step: "interests",
    interests: ["career", "study"],
  })
  verified(interestsResult.response.status === 200, "Multiple interests should save")

  const [{ data: beforePrivacy }, { data: interestsBeforePrivacy }] = await Promise.all([
    admin
      .from("user_onboarding")
      .select("onboarding_current_step, onboarding_completed_at")
      .eq("profile_id", users[0].id)
      .single(),
    admin.from("profiles").select("wants").eq("id", users[0].id).single(),
  ])
  verified(
    interestsBeforePrivacy.wants.join(",") === "career,study",
    "Interests should be persisted on the profile",
  )
  verified(beforePrivacy.onboarding_current_step === 5, "Interest step should advance to privacy")
  verified(beforePrivacy.onboarding_completed_at === null, "Completion timestamp must remain null")

  const invalidInterests = await onboardingRequest(userA, "PATCH", {
    step: "interests",
    interests: ["career", "career"],
  })
  verified(invalidInterests.response.status === 400, "Duplicate interests should be rejected")

  const refusedPrivacy = await onboardingRequest(userA, "PATCH", {
    step: "privacy",
    accepted: false,
  })
  verified(refusedPrivacy.response.status === 400, "Privacy refusal should block completion")
  const { data: stillIncomplete } = await admin
    .from("user_onboarding")
    .select("onboarding_completed_at")
    .eq("profile_id", users[0].id)
    .single()
  verified(stillIncomplete.onboarding_completed_at === null, "Refusal must not set completion timestamp")

  const acceptedPrivacy = await onboardingRequest(userA, "PATCH", {
    step: "privacy",
    accepted: true,
  })
  verified(acceptedPrivacy.response.status === 200, "Privacy acceptance should complete onboarding")
  verified(Boolean(acceptedPrivacy.json.completedAt), "Completion response should include a timestamp")

  const reloaded = await onboardingRequest(userA, "GET")
  verified(reloaded.response.status === 200, "Completed state should remain readable")
  verified(reloaded.json.profile.onboarding_current_step === 6, "Completed state should persist")
  verified(Boolean(reloaded.json.profile.onboarding_completed_at), "Completion timestamp should persist")

  const editAfterCompletion = await onboardingRequest(userA, "PATCH", {
    step: "name",
    name: "Should not save",
  })
  verified(editAfterCompletion.response.status === 409, "Completed onboarding should reject further changes")

  console.log(`Onboarding integration test passed (${assertions} assertions).`)
} finally {
  for (const user of users) {
    if (user.id) await admin.auth.admin.deleteUser(user.id)
  }

  const ids = users.map((user) => user.id).filter(Boolean)
  if (ids.length > 0) {
    const { data: remainingProfiles } = await admin.from("profiles").select("id").in("id", ids)
    assert.equal(remainingProfiles?.length ?? 0, 0, "Integration test profiles were not cleaned up")
  }
}
