"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountInformation, ProfileInformation } from "@/lib/api";
import { Alert, Badge, Button, Card, LinkButton } from "@/components/ui";

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
  return source
    .split(/\s+|@/)
    .filter(Boolean)
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
  const displayName = profile.full_name || account.email;
  const provider =
    account.auth_provider?.toLowerCase() === "google"
      ? "Google account"
      : account.auth_provider || "External account";

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
    <div id="account" className="scroll-mt-6 space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-r from-blue-600/14 via-indigo-500/12 to-fuchsia-500/14 p-6 dark:from-blue-500/18 dark:via-indigo-500/12 dark:to-fuchsia-500/16">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-600 to-fuchsia-500 text-xl font-semibold text-white shadow-lg shadow-blue-950/20">
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
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-semibold text-slate-950 dark:text-slate-50">
                  {displayName}
                </h2>
                <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">
                  {account.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="success">Active</Badge>
                  <Badge tone="info">{provider}</Badge>
                </div>
              </div>
            </div>
            <LinkButton href="/settings/profile" variant="secondary">
              Edit professional profile
            </LinkButton>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.82fr]">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            Account details
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Your account identity comes from Google authentication. HireMind
            does not provide email or password editing for Google accounts.
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <AccountRow label="Name" value={displayName} />
            <AccountRow label="Email" value={account.email} />
            <AccountRow label="Sign-in method" value={provider} />
            <AccountRow label="Member since" value={formatDate(account.created_at)} />
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            Current session
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            You are signed in on this device. Signing out clears the current
            HireMind session without deleting resumes, interviews, or reports.
          </p>
          <Button
            className="mt-6 w-full sm:w-fit"
            onClick={signOut}
            disabled={isSigningOut}
            variant="danger"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Button>
          {error ? (
            <Alert className="mt-4" tone="danger">
              {error}
            </Alert>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/75 bg-white/55 p-4 dark:border-slate-700/55 dark:bg-slate-950/24">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-950 dark:text-slate-50">
        {value}
      </dd>
    </div>
  );
}
