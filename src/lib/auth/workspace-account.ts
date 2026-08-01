import { getPasswordSessionUser } from "@/lib/auth/password";
import { getDirectGithubTokens } from "@/lib/github/direct-session";
import { getDirectGoogleTokens } from "@/lib/google/direct-session";

export type WorkspaceAccount = {
  id: string;
  label: string;
  provider: "password" | "google" | "github";
};

export async function getWorkspaceAccount(): Promise<WorkspaceAccount | null> {
  const [passwordUser, googleTokens, githubTokens] = await Promise.all([
    getPasswordSessionUser(),
    getDirectGoogleTokens(),
    getDirectGithubTokens(),
  ]);

  if (passwordUser) {
    return {
      id: `email:${passwordUser.email.trim().toLowerCase()}`,
      label: passwordUser.email,
      provider: "password",
    };
  }

  if (googleTokens?.email) {
    return {
      id: `email:${googleTokens.email.trim().toLowerCase()}`,
      label: googleTokens.email,
      provider: "google",
    };
  }

  if (githubTokens?.login) {
    return {
      id: githubTokens.email
        ? `email:${githubTokens.email.trim().toLowerCase()}`
        : `github:${githubTokens.login.trim().toLowerCase()}`,
      label: githubTokens.email ?? githubTokens.login,
      provider: "github",
    };
  }

  return null;
}
