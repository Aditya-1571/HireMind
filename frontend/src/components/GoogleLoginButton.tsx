"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchWithTimeout,
  networkErrorMessage,
  responseErrorMessage,
} from "@/lib/errors";

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

      setIsSigningIn(true);
      setMessage(null);

      try {
        const loginResponse = await fetchWithTimeout("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credential: response.credential }),
        }, 45000);

        if (!loginResponse.ok) {
          setMessage(await responseErrorMessage(loginResponse, "Google sign-in failed."));
          setIsSigningIn(false);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } catch {
        setMessage(networkErrorMessage("Google sign-in is unavailable."));
        setIsSigningIn(false);
      }
    };

    const initializeGoogle = () => {
      if (!window.google || !buttonRef.current) {
        setMessage("Google sign-in could not be initialized.");
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

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", initializeGoogle, { once: true });
      existingScript.addEventListener(
        "error",
        () => setMessage("Google sign-in script failed to load."),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => {
      setMessage("Google sign-in script failed to load.");
    };
    document.head.appendChild(script);
  }, [router]);

  return (
    <div>
      <div
        ref={buttonRef}
        className="mt-6 min-h-11"
        aria-label="Sign in with Google"
      />
      {isSigningIn ? (
        <p
          className="mt-3 text-sm text-slate-600 dark:text-slate-300"
          role="status"
          aria-live="polite"
        >
          Signing in
        </p>
      ) : null}
      {!googleClientId ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-300">
          Google sign-in is not configured.
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-red-600 dark:text-red-300">{message}</p> : null}
    </div>
  );
}
