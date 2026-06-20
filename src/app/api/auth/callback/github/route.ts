import { NextResponse } from "next/server";

import {
  exchangeGithubCode,
  getGithubAppUrl,
  getGithubViewer,
} from "@/lib/github/client";
import {
  encodeGithubTokens,
  githubOAuthStateCookieName,
  githubTokenCookieName,
} from "@/lib/github/direct-session";

export async function GET(request: Request) {
  const appUrl = getGithubAppUrl();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");
  const expectedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${githubOAuthStateCookieName}=`))
    ?.split("=")[1];

  if (error) {
    return NextResponse.redirect(
      new URL(`/?githubOAuthError=${encodeURIComponent(error)}`, appUrl),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?githubOAuthError=Missing%20OAuth%20code", appUrl),
    );
  }

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/?githubOAuthError=Invalid%20OAuth%20state", appUrl),
    );
  }

  try {
    const tokens = await exchangeGithubCode(code);
    const viewer = await getGithubViewer({ accessToken: tokens.accessToken });
    const response = NextResponse.redirect(
      new URL("/?githubOAuth=connected", appUrl),
    );
    response.cookies.set({
      name: githubTokenCookieName,
      value: encodeGithubTokens({
        ...tokens,
        login: viewer.login,
        name: viewer.name,
        email: viewer.email,
        avatarUrl: viewer.avatarUrl,
        htmlUrl: viewer.htmlUrl,
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: appUrl.startsWith("https://"),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.delete(githubOAuthStateCookieName);

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GitHub token exchange failed.";
    console.error("GitHub OAuth callback failed", error);

    return NextResponse.redirect(
      new URL(`/?githubOAuthError=${encodeURIComponent(message)}`, appUrl),
    );
  }
}
