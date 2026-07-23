"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountInformation, ProfileInformation } from "@/lib/api";
import { Alert, Button, Card } from "@/components/ui";

type AccountInformationCardProps = {
  account: AccountInformation;
  profile: ProfileInformation;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function initials(name: string | null, email: string) {
  const source = name || email;
  const parts = source.split(/\s+|@/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AccountInformationCard({
  account,
  profile,
}: AccountInformationCardProps) {
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showImage = account.profile_picture_url && !imageFailed;

  const signOut = async () => {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!response.ok) {
        setError("Unable to sign out.");
        setIsSigningOut(false);
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      setError("Unable to sign out.");
      setIsSigningOut(false);
    }
  };

  return (
    <Card id="account" className="scroll-mt-6 p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-lg font-semibold text-white">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={account.profile_picture_url ?? ""}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span>{initials(profile.full_name, account.email)}</span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
              Account Information
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Google account details are read-only.
            </p>
          </div>
        </div>
        <Button
          onClick={signOut}
          disabled={isSigningOut}
          variant="secondary"
          className="w-fit"
        >
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-500 dark:text-slate-400">Email</dt>
          <dd className="mt-1 break-words text-sm font-medium text-slate-950 dark:text-slate-50">
            {account.email}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500 dark:text-slate-400">Authentication provider</dt>
          <dd className="mt-1 text-sm font-medium text-slate-950 dark:text-slate-50">
            {account.auth_provider}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500 dark:text-slate-400">Account created</dt>
          <dd className="mt-1 text-sm font-medium text-slate-950 dark:text-slate-50">
            {formatDate(account.created_at)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500 dark:text-slate-400">Display name</dt>
          <dd className="mt-1 text-sm font-medium text-slate-950 dark:text-slate-50">
            {profile.full_name ?? "Not available"}
          </dd>
        </div>
      </dl>

      {error ? (
        <Alert className="mt-4" tone="danger">
          {error}
        </Alert>
      ) : null}
    </Card>
  );
}
