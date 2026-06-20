import { NextResponse } from "next/server";

import { createGoogleOAuthClient } from "@/lib/google/client";
import { googleWorkspaceScopes } from "@/lib/google/scopes";

function getAppUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export async function GET() {
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL(
        "/?googleOAuthError=Missing%20GOOGLE_CLIENT_ID%20or%20GOOGLE_CLIENT_SECRET",
        appUrl,
      ),
    );
  }

  const client = createGoogleOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    redirect_uri: redirectUri,
    scope: [...googleWorkspaceScopes],
  });

  return NextResponse.redirect(url);
}
