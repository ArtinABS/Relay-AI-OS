import { NextResponse } from "next/server";

import { getDirectGithubTokens } from "@/lib/github/direct-session";
import { listGithubRepositoryBranches } from "@/lib/github/workspace";

export async function GET(request: Request) {
  const tokens = await getDirectGithubTokens();
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner")?.trim();
  const repo = url.searchParams.get("repo")?.trim();

  if (!tokens?.accessToken) {
    return NextResponse.json(
      { ok: false, reason: "GitHub is not connected.", branches: [] },
      { status: 401 },
    );
  }

  if (!owner || !repo) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Owner and repository are required.",
        branches: [],
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await listGithubRepositoryBranches(tokens, owner, repo),
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to read repository branches.",
        branches: [],
      },
      { status: 500 },
    );
  }
}
