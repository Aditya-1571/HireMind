"use client";

import { useMemo, useState } from "react";
import type {
  ExperienceLevel,
  ProfileResponse,
  ProfileUpdatePayload,
} from "@/lib/api";
import { updateProfile } from "@/lib/api";
import { ProfileCompletionCard } from "@/components/ProfileCompletionCard";

const interviewTypes = ["HR", "Technical", "Mixed"] as const;
const difficultyLevels = ["Easy", "Medium", "Hard"] as const;
const questionCountPresets = [5, 10, 15, 20];
const timeLimitOptions = [
  { label: "Unlimited", value: "" },
  { label: "15 minutes", value: "15" },
  { label: "30 minutes", value: "30" },
  { label: "45 minutes", value: "45" },
  { label: "60 minutes", value: "60" },
];
const evaluationStyles = [
  { label: "Beginner Friendly", value: "beginner_friendly" },
  { label: "Balanced", value: "balanced" },
  { label: "Strict", value: "strict" },
] as const;
const experienceLevels: Array<{ label: string; value: ExperienceLevel }> = [
  { label: "Student", value: "student" },
  { label: "Fresher", value: "fresher" },
  { label: "Junior", value: "junior" },
  { label: "Mid-level", value: "mid_level" },
  { label: "Senior", value: "senior" },
];

type ProfileSettingsFormProps = {
  initialProfile: ProfileResponse;
};

type FormState = {
  full_name: string;
  professional_headline: string;
  target_role: string;
  experience_level: ExperienceLevel | "";
  bio: string;
  interview_type: "HR" | "Technical" | "Mixed";
  difficulty: "Easy" | "Medium" | "Hard";
  question_count: string;
  time_limit_minutes: string;
  evaluation_style: "beginner_friendly" | "balanced" | "strict";
  answer_mode: "text";
};

function validInterviewType(value: string): FormState["interview_type"] {
  return interviewTypes.includes(value as FormState["interview_type"])
    ? (value as FormState["interview_type"])
    : "HR";
}

function validDifficulty(value: string): FormState["difficulty"] {
  return difficultyLevels.includes(value as FormState["difficulty"])
    ? (value as FormState["difficulty"])
    : "Easy";
}

function validEvaluationStyle(value: string): FormState["evaluation_style"] {
  return evaluationStyles.some((item) => item.value === value)
    ? (value as FormState["evaluation_style"])
    : "balanced";
}

function fromProfileResponse(profile: ProfileResponse): FormState {
  return {
    full_name: profile.profile.full_name ?? "",
    professional_headline: profile.profile.professional_headline ?? "",
    target_role: profile.profile.target_role ?? "",
    experience_level: profile.profile.experience_level ?? "",
    bio: profile.profile.bio ?? "",
    interview_type: validInterviewType(profile.interview_defaults.interview_type),
    difficulty: validDifficulty(profile.interview_defaults.difficulty),
    question_count: String(profile.interview_defaults.question_count),
    time_limit_minutes:
      profile.interview_defaults.time_limit_minutes === null
        ? ""
        : String(profile.interview_defaults.time_limit_minutes),
    evaluation_style: validEvaluationStyle(
      profile.interview_defaults.evaluation_style,
    ),
    answer_mode: "text",
  };
}

function cleanOptionalText(value: string) {
  const cleaned = value.trim();
  return cleaned || null;
}

function normalizeState(state: FormState): ProfileUpdatePayload {
  return {
    profile: {
      full_name: cleanOptionalText(state.full_name),
      professional_headline: cleanOptionalText(state.professional_headline),
      target_role: cleanOptionalText(state.target_role),
      experience_level: state.experience_level || null,
      bio: cleanOptionalText(state.bio),
    },
    interview_defaults: {
      interview_type: state.interview_type,
      difficulty: state.difficulty,
      question_count: Number(state.question_count),
      time_limit_minutes: state.time_limit_minutes
        ? Number(state.time_limit_minutes)
        : null,
      evaluation_style: state.evaluation_style,
      answer_mode: "text",
    },
  };
}

function stateKey(state: FormState) {
  return JSON.stringify(normalizeState(state));
}

function validate(state: FormState) {
  const errors: string[] = [];
  const questionCount = Number(state.question_count);
  if (state.full_name.length > 100) {
    errors.push("Full name must be 100 characters or fewer.");
  }
  if (state.professional_headline.length > 150) {
    errors.push("Professional headline must be 150 characters or fewer.");
  }
  if (state.target_role.length > 100) {
    errors.push("Target role must be 100 characters or fewer.");
  }
  if (state.bio.length > 500) {
    errors.push("Bio must be 500 characters or fewer.");
  }
  if (!Number.isInteger(questionCount) || questionCount < 5 || questionCount > 30) {
    errors.push("Default question count must be a whole number from 5 to 30.");
  }
  return errors;
}

export function ProfileSettingsForm({
  initialProfile,
}: ProfileSettingsFormProps) {
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [form, setForm] = useState(() => fromProfileResponse(initialProfile));
  const [baselineKey, setBaselineKey] = useState(() =>
    stateKey(fromProfileResponse(initialProfile)),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentKey = useMemo(() => stateKey(form), [form]);
  const validationErrors = useMemo(() => validate(form), [form]);
  const isDirty = currentKey !== baselineKey;
  const canSave = isDirty && validationErrors.length === 0 && !isSaving;

  const updateField = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setSuccess(null);
    setError(null);
  };

  const resetForm = () => {
    const next = fromProfileResponse(savedProfile);
    setForm(next);
    setBaselineKey(stateKey(next));
    setSuccess(null);
    setError(null);
  };

  const save = async () => {
    if (!canSave) {
      return;
    }
    setIsSaving(true);
    setSuccess(null);
    setError(null);

    const result = await updateProfile(normalizeState(form));
    if (!result.ok) {
      setError(result.message);
      setIsSaving(false);
      return;
    }

    const next = fromProfileResponse(result.profile);
    setSavedProfile(result.profile);
    setForm(next);
    setBaselineKey(stateKey(next));
    setSuccess("Profile settings saved.");
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <ProfileCompletionCard percentage={savedProfile.profile_completion} />

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">
              Profile Information
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              These details help personalize your interview practice.
            </p>
          </div>
          {isDirty ? (
            <span className="w-fit rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700">
              Unsaved changes
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-neutral-700"
            >
              Full name
            </label>
            <input
              id="full_name"
              value={form.full_name}
              maxLength={100}
              onChange={(event) => updateField("full_name", event.target.value)}
              placeholder="Your professional name"
              className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </div>
          <div>
            <label
              htmlFor="professional_headline"
              className="block text-sm font-medium text-neutral-700"
            >
              Professional headline
            </label>
            <input
              id="professional_headline"
              value={form.professional_headline}
              maxLength={150}
              onChange={(event) =>
                updateField("professional_headline", event.target.value)
              }
              placeholder="Aspiring Machine Learning Engineer"
              className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </div>
          <div>
            <label
              htmlFor="target_role"
              className="block text-sm font-medium text-neutral-700"
            >
              Target role
            </label>
            <input
              id="target_role"
              value={form.target_role}
              maxLength={100}
              onChange={(event) => updateField("target_role", event.target.value)}
              placeholder="Backend Developer"
              className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </div>
          <div>
            <label
              htmlFor="experience_level"
              className="block text-sm font-medium text-neutral-700"
            >
              Experience level
            </label>
            <select
              id="experience_level"
              value={form.experience_level}
              onChange={(event) =>
                updateField(
                  "experience_level",
                  event.target.value as FormState["experience_level"],
                )
              }
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">Not selected</option>
              {experienceLevels.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-neutral-700"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={form.bio}
              maxLength={500}
              rows={5}
              onChange={(event) => updateField("bio", event.target.value)}
              placeholder="Briefly describe your background, interests, and goals."
              className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
            <p className="mt-2 text-sm text-neutral-500">
              {form.bio.length}/500 characters
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-950">
          Default Interview Preferences
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          These defaults are used when you start a new interview unless a
          Practice Again link provides different values.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="interview_type"
              className="block text-sm font-medium text-neutral-700"
            >
              Default interview type
            </label>
            <select
              id="interview_type"
              value={form.interview_type}
              onChange={(event) =>
                updateField(
                  "interview_type",
                  event.target.value as FormState["interview_type"],
                )
              }
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              {interviewTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="difficulty"
              className="block text-sm font-medium text-neutral-700"
            >
              Default difficulty
            </label>
            <select
              id="difficulty"
              value={form.difficulty}
              onChange={(event) =>
                updateField(
                  "difficulty",
                  event.target.value as FormState["difficulty"],
                )
              }
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              {difficultyLevels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Default question count
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {questionCountPresets.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => updateField("question_count", String(count))}
                  className={
                    form.question_count === String(count)
                      ? "rounded-md bg-neutral-950 px-3 py-2 text-sm font-semibold text-white"
                      : "rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  }
                >
                  {count}
                </button>
              ))}
            </div>
            <input
              value={form.question_count}
              inputMode="numeric"
              onChange={(event) => updateField("question_count", event.target.value)}
              className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />
          </div>
          <div>
            <label
              htmlFor="time_limit_minutes"
              className="block text-sm font-medium text-neutral-700"
            >
              Default time limit
            </label>
            <select
              id="time_limit_minutes"
              value={form.time_limit_minutes}
              onChange={(event) =>
                updateField("time_limit_minutes", event.target.value)
              }
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              {timeLimitOptions.map((item) => (
                <option key={item.label} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="evaluation_style"
              className="block text-sm font-medium text-neutral-700"
            >
              Default evaluation style
            </label>
            <select
              id="evaluation_style"
              value={form.evaluation_style}
              onChange={(event) =>
                updateField(
                  "evaluation_style",
                  event.target.value as FormState["evaluation_style"],
                )
              }
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              {evaluationStyles.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="answer_mode"
              className="block text-sm font-medium text-neutral-700"
            >
              Answer mode
            </label>
            <input
              id="answer_mode"
              value="Text"
              disabled
              className="mt-2 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
            />
          </div>
        </div>
      </section>

      {validationErrors.length > 0 ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <ul className="space-y-1 text-sm text-red-700">
            {validationErrors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          disabled={!isDirty || isSaving}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
