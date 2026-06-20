import { NextResponse } from "next/server";

import {
  createGithubOAuthUrl,
  getGithubAppUrl,
} from "@/lib/github/client";
import { githubOAuthStateCookieName } from "@/lib/github/direct-session";

export async function GET() {
  const appUrl = getGithubAppUrl();

  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL(
        "/?githubOAuthError=Missing%20GITHUB_CLIENT_ID%20or%20GITHUB_CLIENT_SECRET",
        appUrl,
      ),
    );
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(createGithubOAuthUrl(state));
  response.cookies.set({
    name: githubOAuthStateCookieName,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
