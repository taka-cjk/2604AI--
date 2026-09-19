"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { WANTS_OPTIONS } from "@/data/wants"
import {
  AFFILIATION_TYPE_OPTIONS,
  AGE_GROUP_OPTIONS,
  MAX_AFFILIATIONS,
  MAX_AFFILIATION_NAME_LENGTH,
  MAX_NAME_LENGTH,
  ONBOARDING_TOTAL_STEPS,
  PRIVACY_POLICY_VERSION,
  type AffiliationType,
  type AgeGroup,
} from "@/lib/onboarding"

type EditableAffiliation = {
  type: AffiliationType | ""
  name: string
}

type Props = {
  initialName: string
  initialAgeGroup: AgeGroup | ""
  initialAffiliations: Array<{ type: AffiliationType; name: string }>
  initialInterests: string[]
  initialStep: number
}

const stepLabels = ["Name", "Age group", "Affiliation", "Interests", "Privacy"]
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"

export function OnboardingFlow({
  initialName,
  initialAgeGroup,
  initialAffiliations,
  initialInterests,
  initialStep,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState(initialStep)
  const [name, setName] = useState(initialName)
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">(initialAgeGroup)
  const [affiliations, setAffiliations] = useState<EditableAffiliation[]>(
    initialAffiliations.length > 0 ? initialAffiliations : [{ type: "", name: "" }],
  )
  const [interests, setInterests] = useState<string[]>(initialInterests)
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveStep(payload: Record<string, unknown>, completed = false) {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = (await response.json()) as { error?: string }

      if (response.status === 401) {
        router.replace("/auth/login")
        return
      }
      if (!response.ok) {
        setError(result.error ?? "Something went wrong. Please try again.")
        return
      }

      if (completed) {
        router.replace("/feed")
        router.refresh()
        return
      }

      setStep((current) => Math.min(current + 1, ONBOARDING_TOTAL_STEPS))
    } catch {
      setError("Could not connect to the server. Your entries are still here; please try again.")
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (step === 1) void saveStep({ step: "name", name })
    if (step === 2) void saveStep({ step: "age_group", ageGroup })
    if (step === 3) {
      void saveStep({
        step: "affiliations",
        affiliations: affiliations.map((affiliation) => ({
          type: affiliation.type,
          name: affiliation.type === "none" ? null : affiliation.name,
        })),
      })
    }
    if (step === 4) void saveStep({ step: "interests", interests })
    if (step === 5) void saveStep({ step: "privacy", accepted }, true)
  }

  function updateAffiliationType(index: number, type: AffiliationType) {
    if (type === "none") {
      setAffiliations([{ type: "none", name: "" }])
      return
    }

    setAffiliations((current) =>
      current.map((affiliation, affiliationIndex) =>
        affiliationIndex === index ? { ...affiliation, type } : affiliation,
      ),
    )
  }

  function updateAffiliationName(index: number, affiliationName: string) {
    setAffiliations((current) =>
      current.map((affiliation, affiliationIndex) =>
        affiliationIndex === index ? { ...affiliation, name: affiliationName } : affiliation,
      ),
    )
  }

  function toggleInterest(value: string) {
    setInterests((current) =>
      current.includes(value)
        ? current.filter((interest) => interest !== value)
        : [...current, value],
    )
  }

  const affiliationValid = affiliations.every(
    (affiliation) =>
      affiliation.type &&
      (affiliation.type === "none" || affiliation.name.trim().length > 0),
  )
  const canContinue =
    (step === 1 && name.trim().length > 0 && name.trim().length <= MAX_NAME_LENGTH) ||
    (step === 2 && Boolean(ageGroup)) ||
    (step === 3 && affiliationValid) ||
    step === 4 ||
    (step === 5 && accepted)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-8">
        <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>
            Step {step} of {ONBOARDING_TOTAL_STEPS}
          </span>
          <span>{stepLabels[step - 1]}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${(step / ONBOARDING_TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <ol className="mt-3 hidden grid-cols-5 gap-2 text-center text-[11px] text-slate-400 sm:grid">
          {stepLabels.map((label, index) => (
            <li
              key={label}
              className={index + 1 === step ? "font-semibold text-indigo-700" : undefined}
              aria-current={index + 1 === step ? "step" : undefined}
            >
              {label}
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-7 sm:px-8 sm:py-8">
        {step === 1 && (
          <section>
            <h2 className="text-xl font-semibold text-slate-900">What should we call you?</h2>
            <p className="mt-2 text-sm text-slate-500">This is the name shown to other members.</p>
            <label htmlFor="onboarding-name" className="mt-6 block text-sm font-medium text-slate-700">
              Display name
            </label>
            <input
              id="onboarding-name"
              autoFocus
              required
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`${inputClass} mt-2`}
              placeholder="Taro Yamada"
              autoComplete="name"
            />
            <p className="mt-2 text-right text-xs text-slate-400">
              {name.length}/{MAX_NAME_LENGTH}
            </p>
          </section>
        )}

        {step === 2 && (
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Choose your age group</h2>
            <p className="mt-2 text-sm text-slate-500">You can choose not to share this information.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {AGE_GROUP_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition ${
                    ageGroup === option.value
                      ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-800 ring-1 ring-indigo-600"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="age-group"
                    value={option.value}
                    checked={ageGroup === option.value}
                    onChange={() => setAgeGroup(option.value)}
                    className="mr-3 accent-indigo-600"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Where are you affiliated?</h2>
            <p className="mt-2 text-sm text-slate-500">
              Add your university, company, or another organization. You can add more than one.
            </p>
            <div className="mt-6 space-y-4">
              {affiliations.map((affiliation, index) => (
                <div key={index} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor={`affiliation-type-${index}`} className="text-sm font-medium text-slate-700">
                      Affiliation {affiliations.length > 1 ? index + 1 : ""}
                    </label>
                    {affiliations.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setAffiliations((current) => current.filter((_, itemIndex) => itemIndex !== index))
                        }
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <select
                    id={`affiliation-type-${index}`}
                    required
                    value={affiliation.type}
                    onChange={(event) =>
                      updateAffiliationType(index, event.target.value as AffiliationType)
                    }
                    className={`${inputClass} mt-2`}
                  >
                    <option value="" disabled>
                      Select a type
                    </option>
                    {AFFILIATION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {affiliation.type && affiliation.type !== "none" && (
                    <input
                      required
                      maxLength={MAX_AFFILIATION_NAME_LENGTH}
                      value={affiliation.name}
                      onChange={(event) => updateAffiliationName(index, event.target.value)}
                      className={`${inputClass} mt-3`}
                      placeholder={
                        affiliation.type === "university"
                          ? "University / graduate school name"
                          : affiliation.type === "company"
                            ? "Company name"
                            : "Organization name"
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={
                affiliations.length >= MAX_AFFILIATIONS ||
                affiliations.some((affiliation) => affiliation.type === "none")
              }
              onClick={() => setAffiliations((current) => [...current, { type: "", name: "" }])}
              className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Add another affiliation
            </button>
          </section>
        )}

        {step === 4 && (
          <section>
            <h2 className="text-xl font-semibold text-slate-900">What are you interested in?</h2>
            <p className="mt-2 text-sm text-slate-500">
              Choose any that fit. You can also continue without selecting one.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {WANTS_OPTIONS.map((option) => {
                const selected = interests.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInterest(option.value)}
                    className={`rounded-full border px-4 py-2.5 text-sm transition ${
                      selected
                        ? "border-indigo-600 bg-indigo-600 font-medium text-white shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <span className="mr-2" aria-hidden="true">
                      {option.emoji}
                    </span>
                    {option.label}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {step === 5 && (
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Review the Privacy Policy</h2>
            <p className="mt-2 text-sm text-slate-500">
              Please review how we handle your personal information before entering the community.
            </p>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p>
                Read the{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
                >
                  Privacy Policy
                </Link>{" "}
                (version {PRIVACY_POLICY_VERSION}).
              </p>
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-indigo-600"
              />
              <span>I have read and agree to the Privacy Policy.</span>
            </label>
          </section>
        )}

        {error && (
          <p role="alert" className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => {
              setError(null)
              setStep((current) => Math.max(1, current - 1))
            }}
            disabled={step === 1 || saving}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:invisible"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={!canContinue || saving}
            className="min-w-32 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : step === 5 ? "Agree and continue" : "Next →"}
          </button>
        </div>
      </form>
    </div>
  )
}
