import { NextResponse } from "next/server";

import { getDirectGithubTokens } from "@/lib/github/direct-session";
import { listGithubRepositoryTree } from "@/lib/github/workspace";

export async function GET(request: Request) {
  const tokens = await getDirectGithubTokens();
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner")?.trim();
  const repo = url.searchParams.get("repo")?.trim();
  const ref = url.searchParams.get("ref")?.trim();

  if (!tokens?.accessToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "GitHub is not connected.",
        entries: [],
      },
      { status: 401 },
    );
  }

  if (!owner || !repo || !ref) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Owner, repository, and branch are required.",
        entries: [],
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await listGithubRepositoryTree(tokens, owner, repo, ref),
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to read the repository file tree.",
        entries: [],
      },
      { status: 500 },
    );
  }
}
