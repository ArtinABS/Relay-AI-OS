import { NextResponse } from "next/server";
import { z } from "zod";

import { getDirectGithubTokens } from "@/lib/github/direct-session";
import {
  createGithubIssueForRepository,
  listGithubIssuesForRepository,
  listGithubIssuesForUser,
  updateGithubIssueForRepository,
} from "@/lib/github/workspace";

const createIssueSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  confirmed: z.boolean().default(false),
});

const updateIssueSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  issueNumber: z.number().int().min(1),
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  state: z.enum(["open", "closed"]).optional(),
  confirmed: z.boolean().default(false),
});

export async function GET(request: Request) {
  const tokens = await getDirectGithubTokens();
  const url = new URL(request.url);
  const maxResults = Number(url.searchParams.get("maxResults") ?? 12);
  const filter = url.searchParams.get("filter") ?? "assigned";
  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");
  const stateParam = url.searchParams.get("state") ?? "open";
  const state = ["open", "closed", "all"].includes(stateParam)
    ? (stateParam as "open" | "closed" | "all")
    : "open";

  if (!tokens?.accessToken) {
    return NextResponse.json(
      {
        ok: false,
        reason: "GitHub is not connected.",
        issues: [],
      },
      { status: 401 },
    );
  }

  try {
    if (owner && repo) {
      return NextResponse.json(
        await listGithubIssuesForRepository(tokens, owner, repo, maxResults, state),
      );
    }

    return NextResponse.json(
      await listGithubIssuesForUser(
        tokens,
        maxResults,
        ["assigned", "created", "mentioned", "subscribed", "all"].includes(filter)
          ? (filter as "assigned" | "created" | "mentioned" | "subscribed" | "all")
          : "assigned",
      ),
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error ? error.message : "Unable to read GitHub issues.",
        issues: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const tokens = await getDirectGithubTokens();

  if (!tokens?.accessToken) {
    return NextResponse.json(
      { ok: false, reason: "GitHub is not connected." },
      { status: 401 },
    );
  }

  const parsed = createIssueSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "Send owner, repo, title, and confirmed." },
      { status: 400 },
    );
  }

  if (!parsed.data.confirmed) {
    return NextResponse.json(
      { ok: false, reason: "Creating a GitHub issue requires confirmation." },
      { status: 409 },
    );
  }

  try {
    return NextResponse.json(await createGithubIssueForRepository(tokens, parsed.data));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error ? error.message : "Unable to create GitHub issue.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const tokens = await getDirectGithubTokens();

  if (!tokens?.accessToken) {
    return NextResponse.json(
      { ok: false, reason: "GitHub is not connected." },
      { status: 401 },
    );
  }

  const parsed = updateIssueSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "Send owner, repo, issueNumber, and confirmed." },
      { status: 400 },
    );
  }

  if (!parsed.data.confirmed) {
    return NextResponse.json(
      { ok: false, reason: "Editing a GitHub issue requires confirmation." },
      { status: 409 },
    );
  }

  try {
    return NextResponse.json(await updateGithubIssueForRepository(tokens, parsed.data));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error ? error.message : "Unable to edit GitHub issue.",
      },
      { status: 500 },
    );
  }
}
