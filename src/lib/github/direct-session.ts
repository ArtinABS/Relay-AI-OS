import { cookies } from "next/headers";

export const githubTokenCookieName = "relay_github_tokens";
export const githubOAuthStateCookieName = "relay_github_oauth_state";

export type DirectGithubTokens = {
  accessToken?: string;
  tokenType?: string;
  scope?: string;
  login?: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  htmlUrl?: string | null;
};

export function encodeGithubTokens(tokens: DirectGithubTokens) {
  return Buffer.from(JSON.stringify(tokens), "utf8").toString("base64url");
}

export function decodeGithubTokens(value?: string): DirectGithubTokens | null {
  if (!value) return null;

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function getDirectGithubTokens() {
  const cookieStore = await cookies();
  return decodeGithubTokens(cookieStore.get(githubTokenCookieName)?.value);
}
