export const googleWorkspaceScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/contacts",
] as const;

export const googleWorkspaceScopeString = googleWorkspaceScopes.join(" ");
