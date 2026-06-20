import { NextResponse } from "next/server";

import { getDirectGithubTokens } from "@/lib/github/direct-session";
import {
  listGithubPullRequestsForRepository,
  listRecentGithubPullRequests,
} from "@/lib/github/workspace";

export async function GET(request: Request) {
  const tokens = await getDirectGithubTokens();
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");
  const maxResults = Number(url.searchParams.get("maxResults") ?? 10);
  const stateParam = url.searchParams.get("state") ?? "open";
  const state = ["open", "closed", "all"].includes(stateParam)
    ? (stateParam as "open" | "closed" | "all")
    : "open";

  if (!tokens?.accessToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "GitHub is not connected.",
        pullRequests: [],
      },
      { status: 401 },
    );
  }

  try {
    if (owner && repo) {
      return NextResponse.json(
        await listGithubPullRequestsForRepository(
          tokens,
          owner,
          repo,
          maxResults,
          state,
        ),
      );
    }

    return NextResponse.json(
      await listRecentGithubPullRequests(tokens, maxResults),
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to read GitHub pull requests.",
        pullRequests: [],
      },
      { status: 500 },
    );
  }
}
