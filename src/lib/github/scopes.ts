export const defaultGithubScopes = [
  "read:user",
  "user:email",
  "repo",
  "read:org",
] as const;

export function getGithubScopes() {
  return (process.env.GITHUB_OAUTH_SCOPES ?? defaultGithubScopes.join(" "))
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export function getGithubScopeString() {
  return getGithubScopes().join(" ");
}
