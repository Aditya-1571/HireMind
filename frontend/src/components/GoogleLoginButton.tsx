"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme: "outline";
              size: "large";
              width: string;
            },
          ) => void;
        };
      };
    };
  }
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    const handleCredential = async (response: { credential?: string }) => {
      if (!response.credential) {
        setMessage("Google sign-in failed.");
        return;
      }

      setMessage("Signing in...");
      setIsSigningIn(true);

      try {
        const loginResponse = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credential: response.credential }),
        });

        if (!loginResponse.ok) {
          const error = (await loginResponse.json().catch(() => ({}))) as {
            message?: unknown;
          };
          setMessage(
            typeof error.message === "string"
              ? error.message
              : "Google sign-in failed.",
          );
          setIsSigningIn(false);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } catch {
        setMessage("Google sign-in is unavailable.");
        setIsSigningIn(false);
      }
    };

    const initializeGoogle = () => {
      if (!window.google || !buttonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
      });
    };

    if (window.google) {
      initializeGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);
  }, [router]);

  return (
    <div>
      <div ref={buttonRef} className="mt-6 min-h-11" />
      {isSigningIn ? (
        <p className="mt-3 text-sm text-neutral-600">Signing in...</p>
      ) : null}
      {!googleClientId ? (
        <p className="mt-3 text-sm text-red-600">
          Google sign-in is not configured.
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
