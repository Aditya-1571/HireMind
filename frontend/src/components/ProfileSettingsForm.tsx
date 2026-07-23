"use client";

import { useMemo, useState } from "react";
import type {
  ExperienceLevel,
  ProfileResponse,
  ProfileUpdatePayload,
} from "@/lib/api";
import { updateProfile } from "@/lib/api";
import { ProfileCompletionCard } from "@/components/ProfileCompletionCard";
import {
  Alert,
  Badge,
  Button,
  Card,
  disabledFieldClassName,
  fieldClassName,
} from "@/components/ui";

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

      <Card className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
              Profile Information
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              These details help personalize your interview practice.
            </p>
          </div>
          {isDirty ? (
            <Badge>
              Unsaved changes
            </Badge>
          ) : null}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Full name
            </label>
            <input
              id="full_name"
              value={form.full_name}
              maxLength={100}
              onChange={(event) => updateField("full_name", event.target.value)}
              placeholder="Your professional name"
              className={`mt-2 ${fieldClassName}`}
            />
          </div>
          <div>
            <label
              htmlFor="professional_headline"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
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
              className={`mt-2 ${fieldClassName}`}
            />
          </div>
          <div>
            <label
              htmlFor="target_role"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Target role
            </label>
            <input
              id="target_role"
              value={form.target_role}
              maxLength={100}
              onChange={(event) => updateField("target_role", event.target.value)}
              placeholder="Backend Developer"
              className={`mt-2 ${fieldClassName}`}
            />
          </div>
          <div>
            <label
              htmlFor="experience_level"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
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
              className={`mt-2 ${fieldClassName}`}
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
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
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
              className={`mt-2 ${fieldClassName}`}
            />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {form.bio.length}/500 characters
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
          Default Interview Preferences
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          These defaults are used when you start a new interview unless a
          Practice Again link provides different values.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="interview_type"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
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
              className={`mt-2 ${fieldClassName}`}
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
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
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
              className={`mt-2 ${fieldClassName}`}
            >
              {difficultyLevels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
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
                      ? "rounded-xl border border-transparent bg-gradient-to-r from-blue-600 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white"
                      : "rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700/70 dark:bg-slate-950/25 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:bg-slate-800/75 dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-slate-950"
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
              className={`mt-3 ${fieldClassName}`}
            />
          </div>
          <div>
            <label
              htmlFor="time_limit_minutes"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Default time limit
            </label>
            <select
              id="time_limit_minutes"
              value={form.time_limit_minutes}
              onChange={(event) =>
                updateField("time_limit_minutes", event.target.value)
              }
              className={`mt-2 ${fieldClassName}`}
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
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
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
              className={`mt-2 ${fieldClassName}`}
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
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Answer mode
            </label>
            <input
              id="answer_mode"
              value="Text"
              disabled
              className={`mt-2 ${disabledFieldClassName}`}
            />
          </div>
        </div>
      </Card>

      {validationErrors.length > 0 ? (
        <Alert tone="danger">
          <ul className="space-y-1 text-sm text-red-700">
            {validationErrors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert tone="success">
          {success}
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={save}
          disabled={!canSave}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
        <Button
          onClick={resetForm}
          disabled={!isDirty || isSaving}
          variant="secondary"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
