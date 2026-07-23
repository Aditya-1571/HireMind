"use client";

import { useMemo, useState } from "react";
import type {
  ExperienceLevel,
  ProfileInformation,
  ProfileResponse,
} from "@/lib/api";
import { updateProfile } from "@/lib/api";
import { ProfileCompletionCard } from "@/components/ProfileCompletionCard";
import {
  Alert,
  Badge,
  Button,
  Card,
  fieldClassName,
} from "@/components/ui";

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
};

function fromProfileResponse(profile: ProfileResponse): FormState {
  return {
    full_name: profile.profile.full_name ?? "",
    professional_headline: profile.profile.professional_headline ?? "",
    target_role: profile.profile.target_role ?? "",
    experience_level: profile.profile.experience_level ?? "",
    bio: profile.profile.bio ?? "",
  };
}

function cleanOptionalText(value: string) {
  const cleaned = value.trim();
  return cleaned || null;
}

function normalizeProfile(state: FormState): Partial<ProfileInformation> {
  return {
    full_name: cleanOptionalText(state.full_name),
    professional_headline: cleanOptionalText(state.professional_headline),
    target_role: cleanOptionalText(state.target_role),
    experience_level: state.experience_level || null,
    bio: cleanOptionalText(state.bio),
  };
}

function stateKey(state: FormState) {
  return JSON.stringify(normalizeProfile(state));
}

function validate(state: FormState) {
  const errors: Record<string, string> = {};
  if (state.full_name.length > 100) {
    errors.full_name = "Full name must be 100 characters or fewer.";
  }
  if (state.professional_headline.length > 150) {
    errors.professional_headline = "Headline must be 150 characters or fewer.";
  }
  if (state.target_role.length > 100) {
    errors.target_role = "Target role must be 100 characters or fewer.";
  }
  if (state.bio.length > 500) {
    errors.bio = "Bio must be 500 characters or fewer.";
  }
  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="mt-2 text-sm text-red-600 dark:text-red-300">
      {message}
    </p>
  );
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
  const errorCount = Object.keys(validationErrors).length;
  const isDirty = currentKey !== baselineKey;
  const canSave = isDirty && errorCount === 0 && !isSaving;

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

    const result = await updateProfile({ profile: normalizeProfile(form) });
    if (!result.ok) {
      setError(result.message);
      setIsSaving(false);
      return;
    }

    const next = fromProfileResponse(result.profile);
    setSavedProfile(result.profile);
    setForm(next);
    setBaselineKey(stateKey(next));
    setSuccess("Profile saved.");
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <ProfileCompletionCard percentage={savedProfile.profile_completion} />

      <Card className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
              Professional profile
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              These details describe your preparation goals inside HireMind.
              They are separate from your Google account identity.
            </p>
          </div>
          {isDirty ? <Badge tone="warning">Unsaved changes</Badge> : null}
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
              aria-describedby={
                validationErrors.full_name ? "full-name-error" : undefined
              }
              className={`mt-2 ${fieldClassName}`}
            />
            <FieldError
              id="full-name-error"
              message={validationErrors.full_name}
            />
          </div>

          <div>
            <label
              htmlFor="professional_headline"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Headline
            </label>
            <input
              id="professional_headline"
              value={form.professional_headline}
              maxLength={150}
              onChange={(event) =>
                updateField("professional_headline", event.target.value)
              }
              placeholder="Aspiring Machine Learning Engineer"
              aria-describedby={
                validationErrors.professional_headline
                  ? "headline-error"
                  : undefined
              }
              className={`mt-2 ${fieldClassName}`}
            />
            <FieldError
              id="headline-error"
              message={validationErrors.professional_headline}
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
              aria-describedby={
                validationErrors.target_role ? "target-role-error" : undefined
              }
              className={`mt-2 ${fieldClassName}`}
            />
            <FieldError
              id="target-role-error"
              message={validationErrors.target_role}
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
              rows={6}
              onChange={(event) => updateField("bio", event.target.value)}
              placeholder="Briefly describe your background, interests, and goals."
              aria-describedby={validationErrors.bio ? "bio-error" : "bio-help"}
              className={`mt-2 ${fieldClassName}`}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p id="bio-help" className="text-sm text-slate-500 dark:text-slate-400">
                Keep it concise and relevant to interview preparation.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {form.bio.length}/500
              </p>
            </div>
            <FieldError id="bio-error" message={validationErrors.bio} />
          </div>
        </div>
      </Card>

      {errorCount > 0 ? (
        <Alert tone="danger">
          Fix the highlighted fields before saving.
        </Alert>
      ) : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          onClick={resetForm}
          disabled={!isDirty || isSaving}
          variant="secondary"
        >
          Reset changes
        </Button>
        <Button onClick={save} disabled={!canSave}>
          {isSaving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </div>
  );
}
