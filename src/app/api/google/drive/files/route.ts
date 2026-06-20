import { NextResponse } from "next/server";

import { getDirectGoogleTokens } from "@/lib/google/direct-session";
import { listRecentDriveFilesForUser } from "@/lib/google/workspace";

export async function GET(request: Request) {
  const tokens = await getDirectGoogleTokens();
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || undefined;

  if (!tokens?.accessToken && !tokens?.refreshToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Google Drive is not connected.",
        files: [],
      },
      { status: 412 },
    );
  }

  try {
    const result = await listRecentDriveFilesForUser(tokens, query ? 20 : 10, query);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to read Google Drive files.",
        files: [],
      },
      { status: 502 },
    );
  }
}
