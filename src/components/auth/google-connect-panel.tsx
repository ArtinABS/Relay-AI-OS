"use client";

import { AlertCircle, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

type OAuthStatus = {
  hasGoogleOAuthConfig: boolean;
  hasNextAuthSecret: boolean;
  checks: Array<{
    label: string;
    ready: boolean;
    where: string;
  }>;
  redirectUri: string;
  origin: string;
  hasDirectGoogleToken: boolean;
  googleEmail: string | null;
  requiredScopes: string[];
};

export function GoogleConnectPanel() {
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const signedIn = Boolean(oauthStatus?.hasDirectGoogleToken);
  const configured = Boolean(
    oauthStatus?.hasGoogleOAuthConfig && oauthStatus.hasNextAuthSecret,
  );

  useEffect(() => {
    fetch("/api/oauth/status")
      .then((response) => response.json())
      .then((data: OAuthStatus) => setOauthStatus(data))
      .catch(() => setOauthStatus(null));
  }, []);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Google OAuth</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            {signedIn
              ? `Connected as ${oauthStatus?.googleEmail ?? "your Google account"}.`
              : configured
                ? "Connect Google so Relay can identify your account."
                : "Google sign-in needs GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_SECRET in .env.local."}
          </p>
          {!configured ? (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4" />
                OAuth setup needed
              </div>
              <div className="mb-2 space-y-1">
                {(oauthStatus?.checks ?? []).map((check) => (
                  <div key={check.label}>
                    {check.ready ? "Ready" : "Missing"}: {check.label}
                  </div>
                ))}
              </div>
              <div>Origin: {oauthStatus?.origin ?? "http://localhost:3000"}</div>
              <div>
                Redirect URI:{" "}
                {oauthStatus?.redirectUri ??
                  "http://localhost:3000/api/auth/callback/google"}
              </div>
              <div className="mt-2">
                First scopes:{" "}
                {(oauthStatus?.requiredScopes ?? [
                  "openid",
                  "email",
                  "profile",
                ]).join(", ")}
              </div>
            </div>
          ) : null}
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!configured && !signedIn}
          onClick={async () => {
            if (signedIn) {
              await fetch("/api/google/oauth/disconnect", { method: "POST" });
              window.location.reload();
              return;
            }

            window.location.href = "/api/google/oauth/start";
          }}
          type="button"
        >
          {signedIn ? (
            <LogOut className="h-4 w-4" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {signedIn ? "Disconnect" : "Connect Google"}
        </button>
      </div>
    </section>
  );
}
