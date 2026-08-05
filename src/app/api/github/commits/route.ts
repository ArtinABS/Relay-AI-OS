import { NextResponse } from "next/server";

import { getDirectGithubTokens } from "@/lib/github/direct-session";
import {
  getGithubRepositoryCommit,
  listGithubRepositoryCommits,
} from "@/lib/github/workspace";

export async function GET(request: Request) {
  const tokens = await getDirectGithubTokens();
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner")?.trim();
  const repo = url.searchParams.get("repo")?.trim();
  const ref = url.searchParams.get("ref")?.trim();
  const commitSha = url.searchParams.get("commitSha")?.trim();
  const includeDetails = url.searchParams.get("includeDetails") !== "false";
  const requestedMaxResults = Number(url.searchParams.get("maxResults") ?? 10);
  const maxResults = Number.isFinite(requestedMaxResults)
    ? Math.min(
        Math.max(Math.trunc(requestedMaxResults), 1),
        includeDetails ? 20 : 50,
      )
    : 10;

  if (!tokens?.accessToken) {
    return NextResponse.json(
      { ok: false, reason: "GitHub is not connected.", commits: [] },
      { status: 401 },
    );
  }

  if (!owner || !repo || (!ref && !commitSha)) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Owner, repository, and a branch or commit are required.",
        commits: [],
      },
      { status: 400 },
    );
  }

  try {
    if (commitSha) {
      return NextResponse.json(
        await getGithubRepositoryCommit(tokens, owner, repo, commitSha),
      );
    }

    return NextResponse.json(
      await listGithubRepositoryCommits(
        tokens,
        owner,
        repo,
        ref!,
        maxResults,
        includeDetails,
      ),
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
