import { NextResponse } from "next/server";

import { getDirectGithubTokens } from "@/lib/github/direct-session";
import { listGithubRepositoriesForUser } from "@/lib/github/workspace";

export async function GET(request: Request) {
  const tokens = await getDirectGithubTokens();
  const url = new URL(request.url);
  const maxResults = Number(url.searchParams.get("maxResults") ?? 12);

  if (!tokens?.accessToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "GitHub is not connected.",
        repositories: [],
      },
      { status: 401 },
    );
  }

  try {
    return NextResponse.json(
      await listGithubRepositoriesForUser(tokens, maxResults),
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to read GitHub repositories.",
        repositories: [],
      },
      { status: 500 },
    );
  }
}
