import { NextResponse } from "next/server";

import { getDirectGithubTokens } from "@/lib/github/direct-session";
import { listGithubRepositoryCommits } from "@/lib/github/workspace";

export async function GET(request: Request) {
  const tokens = await getDirectGithubTokens();
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner")?.trim();
  const repo = url.searchParams.get("repo")?.trim();
  const ref = url.searchParams.get("ref")?.trim();
  const requestedMaxResults = Number(url.searchParams.get("maxResults") ?? 10);
  const maxResults = Number.isFinite(requestedMaxResults)
    ? Math.min(Math.max(Math.trunc(requestedMaxResults), 1), 20)
    : 10;

  if (!tokens?.accessToken) {
    return NextResponse.json(
      { ok: false, reason: "GitHub is not connected.", commits: [] },
      { status: 401 },
    );
  }

  if (!owner || !repo || !ref) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Owner, repository, and branch are required.",
        commits: [],
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await listGithubRepositoryCommits(tokens, owner, repo, ref, maxResults),
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to read the repository commit history.",
        commits: [],
      },
      { status: 500 },
    );
  }
}
