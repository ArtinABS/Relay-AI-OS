import { NextResponse } from "next/server";

import { hasGoogleOAuthConfig } from "@/lib/auth/config";
import { getGithubSetupStatus } from "@/lib/github/client";
import { getDirectGithubTokens } from "@/lib/github/direct-session";
import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import { googleWorkspaceScopes } from "@/lib/google/scopes";

export async function GET() {
  const directTokens = await getDirectGoogleTokens();
  const githubTokens = await getDirectGithubTokens();
  const github = getGithubSetupStatus();
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const checks = [
    {
      label: "NEXTAUTH_SECRET",
      ready: Boolean(process.env.NEXTAUTH_SECRET),
      where: ".env.local",
    },
    {
      label: "GOOGLE_CLIENT_ID",
      ready: Boolean(process.env.GOOGLE_CLIENT_ID),
      where: ".env.local",
    },
    {
      label: "GOOGLE_CLIENT_SECRET",
      ready: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      where: ".env.local",
    },
    {
      label: "GITHUB_CLIENT_ID",
      ready: Boolean(process.env.GITHUB_CLIENT_ID),
      where: ".env.local",
    },
    {
      label: "GITHUB_CLIENT_SECRET",
      ready: Boolean(process.env.GITHUB_CLIENT_SECRET),
      where: ".env.local",
    },
  ];

  return NextResponse.json({
    hasGoogleOAuthConfig,
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    checks,
    nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
    redirectUri: `${appUrl}/api/auth/callback/google`,
    origin: appUrl,
    hasDirectGoogleToken: Boolean(
      directTokens?.accessToken || directTokens?.refreshToken,
    ),
    googleEmail: directTokens?.email ?? null,
    requiredScopes: googleWorkspaceScopes,
    github: {
      configured: github.hasOAuthApp,
      connected: Boolean(githubTokens?.accessToken),
      login: githubTokens?.login ?? null,
      name: githubTokens?.name ?? null,
      email: githubTokens?.email ?? null,
      avatarUrl: githubTokens?.avatarUrl ?? null,
      htmlUrl: githubTokens?.htmlUrl ?? null,
      redirectUri: github.redirectUri,
      requiredScopes: github.scopes,
      grantedScopes: githubTokens?.scope
        ?.split(/[,\s]+/)
        .map((scope) => scope.trim())
        .filter(Boolean) ?? [],
    },
  });
}
