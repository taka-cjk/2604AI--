import Link from "next/link"
import { PRIVACY_POLICY_VERSION } from "@/lib/onboarding"

export const metadata = {
  title: "Privacy Policy | East Asia Alumni Network",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-full bg-slate-50 px-4 py-10 sm:py-14">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="border-b border-slate-200 pb-6">
          <Link href="/auth/onboarding" className="text-sm font-medium text-indigo-600 hover:underline">
            ← Back to onboarding
          </Link>
          <h1 className="mt-5 text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Version {PRIVACY_POLICY_VERSION}</p>
        </div>

        <div className="space-y-8 py-7 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Information we collect</h2>
            <p className="mt-2">
              We collect account details and the profile information you provide, including your name,
              age group, affiliations, interests, posts, event activity, messages, and policy consent record.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">How we use information</h2>
            <p className="mt-2">
              We use this information to operate the alumni community, display profiles, help members find
              relevant people and activities, secure accounts, provide support, and improve the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Visibility and service providers</h2>
            <p className="mt-2">
              Profile and community content may be visible to other members as indicated in the product.
              We use infrastructure and authentication providers, including Supabase and our hosting provider,
              to process data on our behalf. We do not sell personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Retention and your choices</h2>
            <p className="mt-2">
              We retain information while your account is active and as reasonably needed to operate the
              service, meet legal obligations, and resolve disputes. You can update profile information in
              the app and contact the community administrator to request access, correction, or deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Changes to this policy</h2>
            <p className="mt-2">
              If this policy changes, we will publish a new version and may ask you to agree again when the
              change materially affects how personal information is handled.
            </p>
          </section>
        </div>
      </article>
    </main>
  )
}
