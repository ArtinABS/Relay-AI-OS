import type { DirectGithubTokens } from "@/lib/github/direct-session";
import { getGithubScopeString } from "@/lib/github/scopes";

const githubApiBaseUrl = "https://api.github.com";

export type GithubViewer = {
  login: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  htmlUrl?: string | null;
};

type GithubUserResponse = {
  login?: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  html_url?: string | null;
};

type GithubEmailResponse = {
  email?: string;
  primary?: boolean;
  verified?: boolean;
};

type GithubTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

export function getGithubAppUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function getGithubRedirectUri() {
  return (
    process.env.GITHUB_REDIRECT_URI ??
    `${getGithubAppUrl()}/api/auth/callback/github`
  );
}

export function getGithubSetupStatus() {
  const hasOAuthApp = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );

  return {
    hasOAuthApp,
    readyForUserOAuth: hasOAuthApp,
    redirectUri: getGithubRedirectUri(),
    scopes: getGithubScopeString().split(" ").filter(Boolean),
  };
}

export function createGithubOAuthUrl(state: string) {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", getGithubRedirectUri());
  url.searchParams.set("scope", getGithubScopeString());
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "true");
  return url;
}

export async function exchangeGithubCode(code: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: getGithubRedirectUri(),
    }),
  });
  const data = (await response.json()) as GithubTokenResponse;

  if (!response.ok || data.error || !data.access_token) {
    throw new Error(
      data.error_description ??
        data.error ??
        "GitHub token exchange failed.",
    );
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    scope: data.scope,
  };
}

export async function githubApi<T>(
  tokens: Pick<DirectGithubTokens, "accessToken">,
  path: string,
  init: RequestInit = {},
) {
  if (!tokens.accessToken) {
    throw new Error("GitHub is not connected in this browser session.");
  }

  const response = await fetch(`${githubApiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokens.accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `GitHub request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return data as T;
}

export async function getGithubViewer(tokens: Pick<DirectGithubTokens, "accessToken">) {
  const user = await githubApi<GithubUserResponse>(tokens, "/user");
  const emails = await githubApi<GithubEmailResponse[]>(tokens, "/user/emails").catch(
    () => [],
  );
  const primaryEmail =
    emails.find((email) => email.primary && email.verified)?.email ??
    emails.find((email) => email.primary)?.email ??
    user.email ??
    null;

  return {
    login: user.login ?? "github-user",
    name: user.name ?? null,
    email: primaryEmail,
    avatarUrl: user.avatar_url ?? null,
    htmlUrl: user.html_url ?? null,
  } satisfies GithubViewer;
}
