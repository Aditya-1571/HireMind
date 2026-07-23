"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button } from "@/components/ui";
import { fetchWithTimeout } from "@/lib/errors";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    setError(null);
    try {
      const response = await fetchWithTimeout("/api/auth/logout", {
        method: "POST",
      }, 15000);
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
    <div className="space-y-3">
      <Button
        onClick={handleLogout}
        variant="secondary"
        loading={isSigningOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? "Signing out" : "Logout"}
      </Button>
      {error ? <Alert tone="danger">{error}</Alert> : null}
    </div>
  );
}
