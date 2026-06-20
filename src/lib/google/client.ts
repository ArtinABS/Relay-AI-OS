import { google } from "googleapis";

export type GoogleTokenSet = {
  accessToken?: string;
  refreshToken?: string;
};

export function createGoogleOAuthClient(tokens: GoogleTokenSet = {}) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  client.setCredentials({
    access_token: tokens.accessToken ?? process.env.GOOGLE_DEV_ACCESS_TOKEN,
    refresh_token: tokens.refreshToken ?? process.env.GOOGLE_DEV_REFRESH_TOKEN,
  });

  return client;
}

export function getGoogleSetupStatus() {
  const hasOAuthApp = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  const hasDevToken = Boolean(
    process.env.GOOGLE_DEV_ACCESS_TOKEN || process.env.GOOGLE_DEV_REFRESH_TOKEN,
  );

  return {
    hasOAuthApp,
    hasDevToken,
    readyForUserOAuth: hasOAuthApp,
    readyForDevToolCalls: hasOAuthApp && hasDevToken,
  };
}

export function assertGoogleToolReady() {
  const status = getGoogleSetupStatus();

  if (!status.readyForDevToolCalls) {
    return {
      ok: false,
      reason:
        "Google tools need GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and a development token or per-user encrypted token storage.",
      status,
    };
  }

  return { ok: true, status };
}

export const googleServices = {
  calendar: () => google.calendar({ version: "v3", auth: createGoogleOAuthClient() }),
  drive: () => google.drive({ version: "v3", auth: createGoogleOAuthClient() }),
  docs: () => google.docs({ version: "v1", auth: createGoogleOAuthClient() }),
  sheets: () => google.sheets({ version: "v4", auth: createGoogleOAuthClient() }),
  gmail: () => google.gmail({ version: "v1", auth: createGoogleOAuthClient() }),
  tasks: () => google.tasks({ version: "v1", auth: createGoogleOAuthClient() }),
};
