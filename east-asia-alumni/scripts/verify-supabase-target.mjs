import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const PRODUCTION_PROJECT_REF = "ircvfhgjvkdwxxumsyqs"

function loadEnvFile(path) {
  if (!existsSync(path)) return

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2")
  }
}

function getLinkedProjectRef(root) {
  const currentRefPath = resolve(root, "supabase/.temp/project-ref")
  if (existsSync(currentRefPath)) return readFileSync(currentRefPath, "utf8").trim()

  const legacyLinkPath = resolve(root, "supabase/.temp/linked-project.json")
  if (!existsSync(legacyLinkPath)) return null

  try {
    return JSON.parse(readFileSync(legacyLinkPath, "utf8")).ref ?? null
  } catch {
    return null
  }
}

const expectedEnvironment = process.argv[2]
if (expectedEnvironment !== "develop") {
  console.error("Usage: node scripts/verify-supabase-target.mjs develop")
  process.exit(1)
}

const projectRoot = resolve(import.meta.dirname, "..")
loadEnvFile(resolve(projectRoot, ".env.development.local"))
loadEnvFile(resolve(projectRoot, ".env.local"))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is missing from .env.development.local")
  process.exit(1)
}

let envProjectRef
try {
  envProjectRef = new URL(supabaseUrl).hostname.split(".")[0]
} catch {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL")
  process.exit(1)
}

if (!envProjectRef || envProjectRef === PRODUCTION_PROJECT_REF) {
  console.error("Blocked: .env.development.local points to the production Supabase project")
  process.exit(1)
}

const linkedProjectRef = getLinkedProjectRef(projectRoot)
if (!linkedProjectRef) {
  console.error("Supabase CLI is not linked. Link the development project first.")
  process.exit(1)
}

if (linkedProjectRef !== envProjectRef) {
  console.error("Blocked: .env.development.local and the Supabase CLI link point to different projects")
  process.exit(1)
}

console.log(`Verified development Supabase target: ${envProjectRef}`)
