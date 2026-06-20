import { cookies } from "next/headers";

export const googleTokenCookieName = "relay_google_tokens";

export type DirectGoogleTokens = {
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number | null;
  email?: string;
  name?: string;
  image?: string;
};

export function encodeGoogleTokens(tokens: DirectGoogleTokens) {
  return Buffer.from(JSON.stringify(tokens), "utf8").toString("base64url");
}

export function decodeGoogleTokens(value?: string): DirectGoogleTokens | null {
  if (!value) return null;

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function getDirectGoogleTokens() {
  const cookieStore = await cookies();
  return decodeGoogleTokens(cookieStore.get(googleTokenCookieName)?.value);
}
