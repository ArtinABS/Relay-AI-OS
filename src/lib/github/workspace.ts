import { githubApi } from "@/lib/github/client";
import type { DirectGithubTokens } from "@/lib/github/direct-session";

type GithubRepoResponse = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  pushed_at?: string | null;
  updated_at?: string | null;
  default_branch?: string;
  owner?: {
    login?: string;
    avatar_url?: string | null;
  };
};

type GithubIssueResponse = {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  body?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  repository_url?: string;
  pull_request?: unknown;
  user?: {
    login?: string;
    avatar_url?: string | null;
  };
  labels?: Array<string | { name?: string | null }>;
};

type GithubPullResponse = {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  body?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  merged_at?: string | null;
  draft?: boolean;
  user?: {
    login?: string;
    avatar_url?: string | null;
  };
  head?: {
    ref?: string;
  };
  base?: {
    ref?: string;
  };
};

export type GithubRepository = {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description?: string | null;
  language?: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt?: string | null;
  updatedAt?: string | null;
  defaultBranch?: string;
  owner: {
    login: string;
    avatarUrl?: string | null;
  };
};

export type GithubIssue = {
  id: number;
  number: number;
  title: string;
  state: string;
  htmlUrl: string;
  body?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  repositoryFullName?: string | null;
  author?: string | null;
  avatarUrl?: string | null;
  labels: string[];
};

export type GithubPullRequest = {
  id: number;
  number: number;
  title: string;
  state: string;
  htmlUrl: string;
  body?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  mergedAt?: string | null;
  draft: boolean;
  author?: string | null;
  avatarUrl?: string | null;
  headRef?: string | null;
  baseRef?: string | null;
  repositoryFullName: string;
};

function toRepository(repo: GithubRepoResponse): GithubRepository {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    htmlUrl: repo.html_url,
    description: repo.description ?? null,
    language: repo.language ?? null,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    openIssues: repo.open_issues_count ?? 0,
    pushedAt: repo.pushed_at ?? null,
    updatedAt: repo.updated_at ?? null,
    defaultBranch: repo.default_branch,
    owner: {
      login: repo.owner?.login ?? repo.full_name.split("/")[0] ?? "unknown",
      avatarUrl: repo.owner?.avatar_url ?? null,
    },
  };
}

function repoFullNameFromRepositoryUrl(repositoryUrl?: string) {
  if (!repositoryUrl) return null;
  const marker = "/repos/";
  const index = repositoryUrl.indexOf(marker);
  return index >= 0 ? repositoryUrl.slice(index + marker.length) : null;
}

function toIssue(issue: GithubIssueResponse): GithubIssue {
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    state: issue.state,
    htmlUrl: issue.html_url,
    body: issue.body ?? null,
    createdAt: issue.created_at ?? null,
    updatedAt: issue.updated_at ?? null,
    repositoryFullName: repoFullNameFromRepositoryUrl(issue.repository_url),
    author: issue.user?.login ?? null,
    avatarUrl: issue.user?.avatar_url ?? null,
    labels:
      issue.labels?.map((label) =>
        typeof label === "string" ? label : label.name ?? "label",
      ) ?? [],
  };
}

function toPullRequest(
  pull: GithubPullResponse,
  repositoryFullName: string,
): GithubPullRequest {
  return {
    id: pull.id,
    number: pull.number,
    title: pull.title,
    state: pull.state,
    htmlUrl: pull.html_url,
    body: pull.body ?? null,
    createdAt: pull.created_at ?? null,
    updatedAt: pull.updated_at ?? null,
    mergedAt: pull.merged_at ?? null,
    draft: Boolean(pull.draft),
    author: pull.user?.login ?? null,
    avatarUrl: pull.user?.avatar_url ?? null,
    headRef: pull.head?.ref ?? null,
    baseRef: pull.base?.ref ?? null,
    repositoryFullName,
  };
}

export async function listGithubRepositoriesForUser(
  tokens: DirectGithubTokens,
  maxResults = 12,
) {
  const repos = await githubApi<GithubRepoResponse[]>(
    tokens,
    `/user/repos?${new URLSearchParams({
      affiliation: "owner,collaborator,organization_member",
      sort: "updated",
      direction: "desc",
      per_page: String(Math.min(Math.max(maxResults, 1), 50)),
    })}`,
  );

  return {
    ok: true,
    repositories: repos.map(toRepository),
  };
}

export async function listGithubIssuesForUser(
  tokens: DirectGithubTokens,
  maxResults = 12,
  filter: "assigned" | "created" | "mentioned" | "subscribed" | "all" = "assigned",
) {
  const issues = await githubApi<GithubIssueResponse[]>(
    tokens,
    `/issues?${new URLSearchParams({
      filter,
      state: "open",
      sort: "updated",
      direction: "desc",
      per_page: String(Math.min(Math.max(maxResults, 1), 50)),
    })}`,
  );

  return {
    ok: true,
    issues: issues
      .filter((issue) => !issue.pull_request)
      .map(toIssue),
  };
}

export async function listGithubIssuesForRepository(
  tokens: DirectGithubTokens,
  owner: string,
  repo: string,
  maxResults = 20,
  state: "open" | "closed" | "all" = "open",
) {
  const issues = await githubApi<GithubIssueResponse[]>(
    tokens,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?${new URLSearchParams({
      state,
      sort: "updated",
      direction: "desc",
      per_page: String(Math.min(Math.max(maxResults, 1), 50)),
    })}`,
  );

  return {
    ok: true,
    issues: issues
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        ...toIssue(issue),
        repositoryFullName: `${owner}/${repo}`,
      })),
  };
}

export async function listGithubPullRequestsForRepository(
  tokens: DirectGithubTokens,
  owner: string,
  repo: string,
  maxResults = 10,
  state: "open" | "closed" | "all" = "open",
) {
  const pulls = await githubApi<GithubPullResponse[]>(
    tokens,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?${new URLSearchParams({
      state,
      sort: "updated",
      direction: "desc",
      per_page: String(Math.min(Math.max(maxResults, 1), 50)),
    })}`,
  );

  return {
    ok: true,
    pullRequests: pulls.map((pull) => toPullRequest(pull, `${owner}/${repo}`)),
  };
}

export async function listRecentGithubPullRequests(
  tokens: DirectGithubTokens,
  maxResults = 10,
) {
  const reposResult = await listGithubRepositoriesForUser(tokens, 6);
  const pullGroups = await Promise.all(
    reposResult.repositories.map((repo) => {
      const [owner, name] = repo.fullName.split("/");
      return listGithubPullRequestsForRepository(
        tokens,
        owner,
        name,
        Math.ceil(maxResults / 2),
      ).catch(() => ({ ok: false as const, pullRequests: [] }));
    }),
  );
  const pullRequests = pullGroups
    .flatMap((group) => group.pullRequests)
    .sort((a, b) => {
      const left = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const right = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return right - left;
    })
    .slice(0, maxResults);

  return {
    ok: true,
    pullRequests,
  };
}

export async function createGithubIssueForRepository(
  tokens: DirectGithubTokens,
  input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
    labels?: string[];
  },
) {
  const issue = await githubApi<GithubIssueResponse>(
    tokens,
    `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/issues`,
    {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        labels: input.labels,
      }),
    },
  );

  return {
    ok: true,
    issue: toIssue(issue),
  };
}

export async function updateGithubIssueForRepository(
  tokens: DirectGithubTokens,
  input: {
    owner: string;
    repo: string;
    issueNumber: number;
    title?: string;
    body?: string;
    labels?: string[];
    state?: "open" | "closed";
  },
) {
  const issue = await githubApi<GithubIssueResponse>(
    tokens,
    `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/issues/${input.issueNumber}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        labels: input.labels,
        state: input.state,
      }),
    },
  );

  return {
    ok: true,
    issue: {
      ...toIssue(issue),
      repositoryFullName: `${input.owner}/${input.repo}`,
    },
  };
}

export async function commentOnGithubIssue(
  tokens: DirectGithubTokens,
  input: {
    owner: string;
    repo: string;
    issueNumber: number;
    body: string;
  },
) {
  const comment = await githubApi<{ id: number; html_url: string; body?: string }>(
    tokens,
    `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/issues/${input.issueNumber}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body: input.body }),
    },
  );

  return {
    ok: true,
    comment: {
      id: comment.id,
      htmlUrl: comment.html_url,
      body: comment.body ?? "",
    },
  };
}
