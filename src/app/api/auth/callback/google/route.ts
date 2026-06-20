import { NextResponse } from "next/server";

import { createGoogleOAuthClient } from "@/lib/google/client";
import {
  encodeGoogleTokens,
  googleTokenCookieName,
} from "@/lib/google/direct-session";

function getAppUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

type GoogleUserInfo = {
  email?: string;
  name?: string;
  picture?: string;
};

export async function GET(request: Request) {
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/auth/callback/google`;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?googleOAuthError=${encodeURIComponent(error)}`, appUrl),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?googleOAuthError=Missing%20OAuth%20code", appUrl),
    );
  }

  try {
    const client = createGoogleOAuthClient();
    const { tokens } = await client.getToken({
      code,
      redirect_uri: redirectUri,
    });

    let profile: GoogleUserInfo = {};
    if (tokens.access_token) {
      const profileResponse = await fetch(
        "https://openidconnect.googleapis.com/v1/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        },
      );

      if (profileResponse.ok) {
        profile = (await profileResponse.json()) as GoogleUserInfo;
      }
    }

    const response = NextResponse.redirect(
      new URL("/?googleOAuth=connected", appUrl),
    );
    response.cookies.set({
      name: googleTokenCookieName,
      value: encodeGoogleTokens({
        accessToken: tokens.access_token ?? undefined,
        refreshToken: tokens.refresh_token ?? undefined,
        expiryDate: tokens.expiry_date,
        email: profile.email,
        name: profile.name,
        image: profile.picture,
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: appUrl.startsWith("https://"),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google token exchange failed.";
    console.error("Direct Google OAuth callback failed", error);

    return NextResponse.redirect(
      new URL(`/?googleOAuthError=${encodeURIComponent(message)}`, appUrl),
    );
  }
}
