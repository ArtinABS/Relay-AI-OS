"use client";

import { Button, ScrollShadow, Tabs } from "@heroui/react";
import {
  Atom,
  BookOpenText,
  Braces,
  CheckCircle2,
  Circle,
  Clock,
  Database,
  ExternalLink,
  FileArchive,
  FileCode2,
  FileCog,
  FileImage,
  FileType2,
  FolderTree,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  ListTodo,
  LockKeyhole,
  Package,
  Palette,
  SquareTerminal,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  TreeExpander,
  TreeIcon,
  TreeLabel,
  TreeNode,
  TreeNodeContent,
  TreeNodeTrigger,
  TreeProvider,
  TreeView,
} from "@/components/ui/tree";

type Repository = {
  defaultBranch?: string;
  description?: string | null;
  forks: number;
  fullName: string;
  htmlUrl: string;
  id: number;
  language?: string | null;
  name: string;
  openIssues: number;
  private: boolean;
  stars: number;
  updatedAt?: string | null;
};

type RepositoryTask = {
  completed?: string | null;
  due?: string | null;
  id?: string | null;
  repositoryFullName?: string | null;
  status?: string | null;
  taskListTitle?: string | null;
  title: string;
  updated?: string | null;
};

type GithubTreeEntry = {
  mode: string;
  path: string;
  sha: string;
  size?: number;
  type: "blob" | "tree" | "commit";
};

type GithubTreeNode = {
  children: GithubTreeNode[];
  kind: "directory" | "file" | "submodule";
  mode?: string;
  name: string;
  path: string;
  sha?: string;
  size?: number;
};

type GithubCommit = {
  sha: string;
  shortSha: string;
  htmlUrl: string;
  message: string;
  authoredAt?: string | null;
  author: {
    login?: string | null;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  };
  additions: number;
  deletions: number;
  changedFiles: number;
  files: Array<{
    path: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    htmlUrl?: string | null;
  }>;
};

type GithubPullRequest = {
  id: number;
  number: number;
  title: string;
  state: string;
  htmlUrl: string;
  updatedAt?: string | null;
  author?: string | null;
  draft: boolean;
  headRef?: string | null;
  baseRef?: string | null;
};

type GithubPanelTab = "directory" | "commits" | "pullRequests";

const panelClass =
  "relay-panel min-w-0 rounded-2xl border border-separator bg-surface shadow-surface transition duration-200 ease-out";

const githubTabsListClassName = [
  "m-3 min-w-max rounded-xl border border-accent/10 bg-accent-soft/30 p-1",
  "**:data-[slot=tabs-tab]:rounded-lg",
  "**:data-[slot=tabs-tab]:bg-transparent",
  "**:data-[slot=tabs-tab]:text-muted",
  "**:data-[slot=tabs-tab]:opacity-100",
  "**:data-[slot=tabs-tab]:transition-colors",
  "**:data-[slot=tabs-tab]:data-[hovered=true]:not-data-[selected=true]:bg-accent-soft",
  "**:data-[slot=tabs-tab]:data-[selected=true]:font-medium",
  "**:data-[slot=tabs-tab]:data-[selected=true]:text-accent-foreground",
  "**:data-[slot=tabs-tab]:shadow-none",
  "**:data-[slot=tabs-indicator]:rounded-lg",
  "**:data-[slot=tabs-indicator]:bg-accent",
  "**:data-[slot=tabs-indicator]:shadow-none",
].join(" ");

function relativeTime(value?: string | null) {
  if (!value) return "Update time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Update time unavailable";

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / 86_400_000),
    "day",
  );
}

function formatCommitTime(value?: string | null) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function commitTitle(message: string) {
  return message.split("\n")[0]?.trim() || "Untitled commit";
}

function fileStatusLabel(status: string) {
  if (status === "added") return "Added";
  if (status === "removed") return "Deleted";
  if (status === "renamed") return "Renamed";
  return "Modified";
}

function formatBytes(value?: number) {
  if (value === undefined) return null;
  if (value < 1_024) return `${value} B`;
  if (value < 1_048_576) return `${Math.round(value / 1_024)} KB`;
  return `${(value / 1_048_576).toFixed(1)} MB`;
}

function formatTaskDue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function buildGithubTree(entries: GithubTreeEntry[]) {
  const root: GithubTreeNode = {
    children: [],
    kind: "directory",
    name: "",
    path: "",
  };
  const nodes = new Map<string, GithubTreeNode>([["", root]]);
  const orderedEntries = [...entries].sort((left, right) => {
    const depthDifference =
      left.path.split("/").length - right.path.split("/").length;
    return depthDifference || left.path.localeCompare(right.path);
  });

  for (const entry of orderedEntries) {
    const segments = entry.path.split("/").filter(Boolean);
    let parent = root;

    segments.forEach((segment, index) => {
      const path = segments.slice(0, index + 1).join("/");
      const isEntry = index === segments.length - 1;
      const kind = isEntry
        ? entry.type === "tree"
          ? "directory"
          : entry.type === "commit"
            ? "submodule"
            : "file"
        : "directory";
      let node = nodes.get(path);

      if (!node) {
        node = {
          children: [],
          kind,
          name: segment,
          path,
        };
        nodes.set(path, node);
        parent.children.push(node);
      }

      if (isEntry) {
        node.kind = kind;
        node.mode = entry.mode;
        node.sha = entry.sha;
        node.size = entry.size;
      }
      parent = node;
    });
  }

  function sortNodes(nodesToSort: GithubTreeNode[]) {
    nodesToSort.sort((left, right) => {
      if (left.kind === "directory" && right.kind !== "directory") return -1;
      if (left.kind !== "directory" && right.kind === "directory") return 1;
      return left.name.localeCompare(right.name, undefined, {
        sensitivity: "base",
      });
    });
    nodesToSort.forEach((node) => sortNodes(node.children));
  }

  sortNodes(root.children);
  return root.children;
}

function githubFileIcon(name: string): ReactNode {
  const normalized = name.toLowerCase();
  const extension = normalized.includes(".")
    ? normalized.slice(normalized.lastIndexOf("."))
    : "";

  if ([".tsx", ".jsx"].includes(extension)) {
    return <Atom className="h-4 w-4 text-cyan-500" />;
  }
  if (extension === ".py") {
    return <FileCode2 className="h-4 w-4 text-amber-500" />;
  }
  if ([".ts", ".js", ".mjs", ".cjs"].includes(extension)) {
    return <FileCode2 className="h-4 w-4 text-sky-500" />;
  }
  if ([".md", ".mdx", ".rst"].includes(extension)) {
    return <BookOpenText className="h-4 w-4 text-violet-500" />;
  }
  if ([".json", ".jsonc"].includes(extension)) {
    return <Braces className="h-4 w-4 text-yellow-500" />;
  }
  if ([".css", ".scss", ".sass", ".less"].includes(extension)) {
    return <Palette className="h-4 w-4 text-pink-500" />;
  }
  if (
    [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"].includes(
      extension,
    )
  ) {
    return <FileImage className="h-4 w-4 text-emerald-500" />;
  }
  if ([".zip", ".tar", ".gz", ".7z", ".rar"].includes(extension)) {
    return <FileArchive className="h-4 w-4 text-orange-500" />;
  }
  if ([".sh", ".bash", ".zsh", ".ps1", ".bat", ".cmd"].includes(extension)) {
    return <SquareTerminal className="h-4 w-4 text-lime-500" />;
  }
  if ([".sql", ".db", ".sqlite"].includes(extension)) {
    return <Database className="h-4 w-4 text-indigo-500" />;
  }
  if (
    normalized === "package.json" ||
    normalized.includes("lock") ||
    normalized === "gemfile"
  ) {
    return <Package className="h-4 w-4 text-rose-500" />;
  }
  if (
    normalized.startsWith(".") ||
    ["config", "dockerfile", "makefile"].some((part) =>
      normalized.includes(part),
    ) ||
    [".toml", ".yaml", ".yml", ".ini", ".env"].includes(extension)
  ) {
    return <FileCog className="h-4 w-4 text-slate-500" />;
  }
  return <FileType2 className="h-4 w-4 text-muted" />;
}

function GithubTreeBranch({
  level = 0,
  nodes,
  parentPath = [],
}: {
  level?: number;
  nodes: GithubTreeNode[];
  parentPath?: boolean[];
}) {
  return nodes.map((node, index) => {
    const isLast = index === nodes.length - 1;
    const hasChildren = node.kind === "directory" && node.children.length > 0;
    const icon =
      node.kind === "directory" ? undefined : node.kind === "submodule" ? (
        <GitBranch className="h-4 w-4 text-orange-500" />
      ) : (
        githubFileIcon(node.name)
      );

    return (
      <TreeNode
        isLast={isLast}
        key={node.path}
        level={level}
        nodeId={node.path}
        parentPath={parentPath}
      >
        <TreeNodeTrigger className="py-1.5">
          <TreeExpander hasChildren={hasChildren} />
          <TreeIcon hasChildren={hasChildren} icon={icon} />
          <TreeLabel className="font-mono text-[13px] font-medium">
            {node.name}
          </TreeLabel>
          {node.kind === "file" && node.size !== undefined ? (
            <span className="shrink-0 text-[10px] tabular-nums text-muted">
              {formatBytes(node.size)}
            </span>
          ) : null}
        </TreeNodeTrigger>
        <TreeNodeContent hasChildren={hasChildren}>
          <GithubTreeBranch
            level={level + 1}
            nodes={node.children}
            parentPath={[...parentPath, isLast]}
          />
        </TreeNodeContent>
      </TreeNode>
    );
  });
}

function EmptyPanel({
  detail,
  icon,
  title,
}: {
  detail: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="grid min-h-48 place-items-center px-5 py-10 text-center">
      <div className="max-w-64">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-separator bg-surface-secondary text-accent">
          {icon}
        </span>
        <h3 className="mt-3 text-sm font-semibold">{title}</h3>
        <p className="mt-1.5 text-xs leading-5 text-muted">{detail}</p>
      </div>
    </div>
  );
}

export function GithubRepositoryExplorer({
  repositories,
  repositoryError,
  signedIn,
  tasks,
}: {
  repositories: Repository[];
  repositoryError?: string;
  signedIn: boolean;
  tasks: RepositoryTask[];
}) {
  const [selectedRepoName, setSelectedRepoName] = useState(
    repositories[0]?.fullName ?? "",
  );
  const [entries, setEntries] = useState<GithubTreeEntry[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [treeTruncated, setTreeTruncated] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<GithubPanelTab>("directory");
  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [contributorFilter, setContributorFilter] = useState("all");
  const [expandedCommitSha, setExpandedCommitSha] = useState<string | null>(
    null,
  );
  const [pullRequests, setPullRequests] = useState<GithubPullRequest[]>([]);
  const [loadingPullRequests, setLoadingPullRequests] = useState(false);
  const [pullRequestError, setPullRequestError] = useState<string | null>(null);
  const selectedRepo =
    repositories.find((repo) => repo.fullName === selectedRepoName) ??
    repositories[0] ??
    null;
  const selectedRepoFullName = selectedRepo?.fullName ?? "";
  const branch = selectedRepo?.defaultBranch ?? "main";
  const tree = useMemo(
    () => (selectedRepo ? buildGithubTree(entries) : []),
    [entries, selectedRepo],
  );
  const topLevelDirectoryIds = useMemo(
    () =>
      tree.filter((node) => node.kind === "directory").map((node) => node.path),
    [tree],
  );
  const selectedNode = useMemo(
    () => entries.find((entry) => entry.path === selectedPath) ?? null,
    [entries, selectedPath],
  );
  const linkedTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.repositoryFullName?.toLowerCase() ===
          selectedRepoFullName.toLowerCase(),
      ),
    [selectedRepoFullName, tasks],
  );
  const contributors = useMemo(
    () =>
      Array.from(
        new Map(
          commits.map((commit) => [
            commit.author.login ?? commit.author.name,
            commit.author,
          ]),
        ).entries(),
      ).map(([id, author]) => ({ id, ...author })),
    [commits],
  );
  const filteredCommits = useMemo(
    () =>
      contributorFilter === "all"
        ? commits
        : commits.filter(
            (commit) =>
              (commit.author.login ?? commit.author.name) === contributorFilter,
          ),
    [commits, contributorFilter],
  );

  function selectRepository(fullName: string) {
    setSelectedRepoName(fullName);
    setEntries([]);
    setCommits([]);
    setPullRequests([]);
    setSelectedPath(null);
    setContributorFilter("all");
    setExpandedCommitSha(null);
  }

  useEffect(() => {
    if (!selectedRepoFullName || activeTab !== "directory") return;

    const controller = new AbortController();
    const [owner, repo] = selectedRepoFullName.split("/");

    async function loadTree() {
      setLoadingTree(true);
      setTreeError(null);
      setTreeTruncated(false);
      setSelectedPath(null);

      try {
        const response = await fetch(
          `/api/github/tree?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&ref=${encodeURIComponent(branch)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as {
          entries?: GithubTreeEntry[];
          ok?: boolean;
          reason?: string;
          truncated?: boolean;
        };

        if (!response.ok || !data.ok) {
          throw new Error(data.reason ?? "Unable to load the file tree.");
        }
        setEntries(data.entries ?? []);
        setTreeTruncated(Boolean(data.truncated));
      } catch (error) {
        if (controller.signal.aborted) return;
        setEntries([]);
        setTreeError(
          error instanceof Error
            ? error.message
            : "Unable to load the file tree.",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingTree(false);
      }
    }

    void loadTree();
    return () => controller.abort();
  }, [activeTab, branch, selectedRepoFullName]);

  useEffect(() => {
    if (!selectedRepoFullName || activeTab !== "commits") return;

    const controller = new AbortController();
    const [owner, repo] = selectedRepoFullName.split("/");

    async function loadCommits() {
      setLoadingCommits(true);
      setCommitError(null);

      try {
        const response = await fetch(
          `/api/github/commits?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&ref=${encodeURIComponent(branch)}&maxResults=12`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as {
          commits?: GithubCommit[];
          ok?: boolean;
          reason?: string;
        };

        if (!response.ok || !data.ok) {
          throw new Error(data.reason ?? "Unable to load commit history.");
        }
        setCommits(data.commits ?? []);
      } catch (error) {
        if (controller.signal.aborted) return;
        setCommits([]);
        setCommitError(
          error instanceof Error
            ? error.message
            : "Unable to load commit history.",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingCommits(false);
      }
    }

    void loadCommits();
    return () => controller.abort();
  }, [activeTab, branch, selectedRepoFullName]);

  useEffect(() => {
    if (!selectedRepoFullName || activeTab !== "pullRequests") return;

    const controller = new AbortController();
    const [owner, repo] = selectedRepoFullName.split("/");

    async function loadPullRequests() {
      setLoadingPullRequests(true);
      setPullRequestError(null);

      try {
        const response = await fetch(
          `/api/github/pulls?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&state=open&maxResults=20`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as {
          ok?: boolean;
          pullRequests?: GithubPullRequest[];
          reason?: string;
        };

        if (!response.ok || !data.ok) {
          throw new Error(data.reason ?? "Unable to load pull requests.");
        }
        setPullRequests(data.pullRequests ?? []);
      } catch (error) {
        if (controller.signal.aborted) return;
        setPullRequests([]);
        setPullRequestError(
          error instanceof Error
            ? error.message
            : "Unable to load pull requests.",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingPullRequests(false);
      }
    }

    void loadPullRequests();
    return () => controller.abort();
  }, [activeTab, selectedRepoFullName]);

  const selectedFileUrl =
    selectedRepo && selectedNode?.type === "blob"
      ? `${selectedRepo.htmlUrl}/blob/${encodeURIComponent(branch)}/${selectedNode.path
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`
      : null;

  return (
    <div className="github-workspace-grid grid min-h-[calc(100dvh-2rem)] gap-4 sm:min-h-[calc(100dvh-3rem)] lg:h-[calc(100dvh-3rem)] lg:min-h-0 xl:h-[calc(100dvh-4rem)] xl:grid-cols-[288px_minmax(360px,1fr)_340px]">
      <section
        className={`${panelClass} flex min-h-[360px] flex-col overflow-hidden lg:min-h-0`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-separator bg-surface p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              GitHub
            </p>
            <h2 className="mt-1 text-lg font-semibold">Repositories</h2>
            <p className="mt-1 text-xs text-muted">
              {signedIn
                ? `${repositories.length} available`
                : "Connect GitHub to browse repositories"}
            </p>
          </div>
          <GitBranch className="mt-1 h-4 w-4 shrink-0 text-accent" />
        </div>

        <ScrollShadow
          className="min-h-0 flex-1 p-3"
          hideScrollBar={false}
          offset={8}
          size={56}
        >
          <div className="space-y-2">
            {repositories.map((repo) => {
              const [owner] = repo.fullName.split("/");
              const selected = selectedRepo?.id === repo.id;

              return (
                <Button
                  aria-label={`Open ${repo.fullName}`}
                  className={`task-rail-card h-auto w-full justify-start rounded-xl border p-3 text-left ${
                    selected
                      ? "border-[var(--accent)] bg-accent-soft shadow-[inset_3px_0_0_var(--accent)]"
                      : "border-separator bg-surface"
                  }`}
                  key={repo.id}
                  onClick={() => selectRepository(repo.fullName)}
                  type="button"
                  variant="ghost"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-separator bg-surface-secondary text-accent">
                    {repo.private ? (
                      <LockKeyhole className="h-4 w-4" />
                    ) : (
                      <GitBranch className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {repo.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted">
                      {owner} · {repo.language ?? "Mixed"} ·{" "}
                      {relativeTime(repo.updatedAt)}
                    </span>
                  </span>
                </Button>
              );
            })}
            {repositories.length === 0 ? (
              <EmptyPanel
                detail={
                  repositoryError ??
                  (signedIn
                    ? "No repositories were returned for this account."
                    : "Connect GitHub from Integrations to load your repositories.")
                }
                icon={<GitBranch className="h-5 w-5" />}
                title={
                  signedIn ? "No repositories loaded" : "GitHub not connected"
                }
              />
            ) : null}
          </div>
        </ScrollShadow>
      </section>

      <section
        className={`${panelClass} flex min-h-[480px] flex-col overflow-hidden lg:min-h-0`}
      >
        <div className="shrink-0 border-b border-separator p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {selectedRepo ? branch : "Repository"}
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold">
                {selectedRepo?.fullName ?? "Repository workspace"}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                {selectedRepo?.description ??
                  "Select a repository to inspect its code and delivery history."}
              </p>
            </div>
            {selectedRepo ? (
              <a
                aria-label={`Open ${selectedRepo.fullName} on GitHub`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-separator bg-surface-secondary text-muted transition hover:border-border-secondary hover:bg-accent-soft hover:text-accent"
                href={selectedRepo.htmlUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>

          {selectedRepo ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
              <span>{selectedRepo.language ?? "Mixed"}</span>
              <span>{selectedRepo.stars} stars</span>
              <span>{selectedRepo.openIssues} open issues</span>
            </div>
          ) : null}
        </div>

        <Tabs
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSelectionChange={(key) => setActiveTab(key as GithubPanelTab)}
          selectedKey={activeTab}
        >
          <Tabs.ListContainer className="github-tabs-list-container shrink-0 rounded-none border-b border-separator bg-surface">
            <Tabs.List
              aria-label="Repository sections"
              className={githubTabsListClassName}
            >
              <Tabs.Tab id="directory">
                <FolderTree className="h-3.5 w-3.5" />
                Directory
                <span className="github-tab-count">
                  {entries.filter((entry) => entry.type === "blob").length}
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="commits">
                <GitCommitHorizontal className="h-3.5 w-3.5" />
                Commits
                <span className="github-tab-count">{commits.length}</span>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="pullRequests">
                <GitPullRequest className="h-3.5 w-3.5" />
                Pull requests
                <span className="github-tab-count">{pullRequests.length}</span>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel className="min-h-0 flex-1 overflow-hidden" id="directory">
            <div className="flex h-full min-h-0 flex-col">
              {treeTruncated ? (
                <p className="m-3 mb-0 rounded-lg border border-warning bg-warning-soft px-3 py-2 text-xs text-warning">
                  GitHub truncated this very large tree. The available structure
                  is shown.
                </p>
              ) : null}
              <div className="min-h-0 flex-1 overflow-hidden">
                {selectedRepo && loadingTree ? (
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 8 }, (_, index) => (
                      <div
                        className="skeleton h-9 rounded-lg"
                        key={`tree-skeleton-${index}`}
                        style={{ width: `${Math.max(52, 94 - index * 4)}%` }}
                      />
                    ))}
                  </div>
                ) : treeError ? (
                  <EmptyPanel
                    detail={treeError}
                    icon={<FolderTree className="h-5 w-5" />}
                    title="File tree unavailable"
                  />
                ) : tree.length > 0 ? (
                  <ScrollShadow
                    className="h-full p-2"
                    hideScrollBar={false}
                    offset={8}
                    size={56}
                  >
                    <TreeProvider
                      defaultExpandedIds={topLevelDirectoryIds}
                      indent={20}
                      key={selectedRepoFullName}
                      onSelectionChange={(selectedIds) =>
                        setSelectedPath(selectedIds[0] ?? null)
                      }
                      selectedIds={selectedPath ? [selectedPath] : []}
                      showLines
                    >
                      <TreeView className="p-0">
                        <GithubTreeBranch nodes={tree} />
                      </TreeView>
                    </TreeProvider>
                  </ScrollShadow>
                ) : (
                  <EmptyPanel
                    detail={
                      selectedRepo
                        ? "This branch has no files to display."
                        : "Choose a repository from the rail to load its structure."
                    }
                    icon={<FolderTree className="h-5 w-5" />}
                    title={
                      selectedRepo ? "Empty repository" : "Select a repository"
                    }
                  />
                )}
              </div>

              {selectedNode ? (
                <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-t border-separator bg-surface-secondary px-4 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] text-foreground">
                      {selectedNode.path}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {selectedNode.type === "tree"
                        ? "Directory"
                        : (formatBytes(selectedNode.size) ?? "Git object")}
                    </p>
                  </div>
                  {selectedFileUrl ? (
                    <a
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-accent hover:underline"
                      href={selectedFileUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open file
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Tabs.Panel>

          <Tabs.Panel className="min-h-0 flex-1 overflow-hidden" id="commits">
            <div className="flex h-full min-h-0 flex-col">
              {contributors.length > 0 ? (
                <div className="shrink-0 border-b border-separator px-3 py-2.5">
                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <UserRound className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <button
                      aria-pressed={contributorFilter === "all"}
                      className="github-contributor-filter"
                      onClick={() => setContributorFilter("all")}
                      type="button"
                    >
                      Everyone
                    </button>
                    {contributors.map((contributor) => (
                      <button
                        aria-pressed={contributorFilter === contributor.id}
                        className="github-contributor-filter"
                        key={contributor.id}
                        onClick={() => setContributorFilter(contributor.id)}
                        type="button"
                      >
                        {contributor.login ?? contributor.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {loadingCommits ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div
                      className="skeleton h-24 rounded-xl"
                      key={`commit-skeleton-${index}`}
                    />
                  ))}
                </div>
              ) : commitError ? (
                <EmptyPanel
                  detail={commitError}
                  icon={<GitCommitHorizontal className="h-5 w-5" />}
                  title="Commit history unavailable"
                />
              ) : filteredCommits.length > 0 ? (
                <ScrollShadow
                  className="min-h-0 flex-1 p-3"
                  hideScrollBar={false}
                  offset={8}
                  size={56}
                >
                  <div className="space-y-2.5">
                    {filteredCommits.map((commit) => {
                      const expanded = expandedCommitSha === commit.sha;
                      const authorInitial = (
                        commit.author.login ?? commit.author.name
                      )
                        .slice(0, 1)
                        .toUpperCase();

                      return (
                        <article
                          className="overflow-hidden rounded-xl border border-separator bg-surface"
                          key={commit.sha}
                        >
                          <button
                            aria-expanded={expanded}
                            className="github-commit-trigger w-full p-3 text-left"
                            onClick={() =>
                              setExpandedCommitSha(expanded ? null : commit.sha)
                            }
                            type="button"
                          >
                            <span className="flex items-start gap-3">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-separator bg-accent-soft text-xs font-bold text-accent">
                                {authorInitial}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-foreground">
                                  {commitTitle(commit.message)}
                                </span>
                                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
                                  <span className="font-semibold text-foreground">
                                    {commit.author.login ?? commit.author.name}
                                  </span>
                                  <span>
                                    {formatCommitTime(commit.authoredAt)}
                                  </span>
                                  <span className="font-mono">
                                    {commit.shortSha}
                                  </span>
                                </span>
                                <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                                  <span className="text-muted">
                                    {commit.changedFiles} changed
                                  </span>
                                  <span className="text-success">
                                    +{commit.additions}
                                  </span>
                                  <span className="text-danger">
                                    -{commit.deletions}
                                  </span>
                                </span>
                              </span>
                            </span>
                          </button>

                          {expanded ? (
                            <div className="border-t border-separator bg-surface-secondary/60 p-2">
                              {commit.files.length > 0 ? (
                                <div className="space-y-1">
                                  {commit.files.map((file) => (
                                    <div
                                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] hover:bg-surface"
                                      key={file.path}
                                    >
                                      <span
                                        className="github-file-status"
                                        data-status={file.status}
                                      >
                                        {fileStatusLabel(file.status).slice(
                                          0,
                                          1,
                                        )}
                                      </span>
                                      <span className="min-w-0 flex-1 truncate font-mono text-foreground">
                                        {file.path}
                                      </span>
                                      <span className="shrink-0 text-success">
                                        +{file.additions}
                                      </span>
                                      <span className="shrink-0 text-danger">
                                        -{file.deletions}
                                      </span>
                                      {file.htmlUrl ? (
                                        <a
                                          aria-label={`Open ${file.path} on GitHub`}
                                          className="shrink-0 text-muted hover:text-accent"
                                          href={file.htmlUrl}
                                          onClick={(event) =>
                                            event.stopPropagation()
                                          }
                                          rel="noreferrer"
                                          target="_blank"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="px-2 py-3 text-xs text-muted">
                                  Changed-file details are unavailable for this
                                  commit.
                                </p>
                              )}
                              <a
                                className="mt-2 inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-accent hover:underline"
                                href={commit.htmlUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Open commit
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </ScrollShadow>
              ) : (
                <EmptyPanel
                  detail={
                    contributorFilter === "all"
                      ? "No commits were returned for this branch."
                      : "This contributor has no commits in the loaded history."
                  }
                  icon={<GitCommitHorizontal className="h-5 w-5" />}
                  title="No commits to show"
                />
              )}
            </div>
          </Tabs.Panel>

          <Tabs.Panel
            className="min-h-0 flex-1 overflow-hidden"
            id="pullRequests"
          >
            {loadingPullRequests ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }, (_, index) => (
                  <div
                    className="skeleton h-24 rounded-xl"
                    key={`pull-skeleton-${index}`}
                  />
                ))}
              </div>
            ) : pullRequestError ? (
              <EmptyPanel
                detail={pullRequestError}
                icon={<GitPullRequest className="h-5 w-5" />}
                title="Pull requests unavailable"
              />
            ) : pullRequests.length > 0 ? (
              <ScrollShadow
                className="h-full p-3"
                hideScrollBar={false}
                offset={8}
                size={56}
              >
                <div className="space-y-2.5">
                  {pullRequests.map((pullRequest) => (
                    <a
                      className="github-pull-request-card block rounded-xl border border-separator bg-surface p-3"
                      href={pullRequest.htmlUrl}
                      key={pullRequest.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="flex items-start gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-separator bg-accent-soft text-accent">
                          <GitPullRequest className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="line-clamp-2 flex-1 text-sm font-semibold leading-5 text-foreground">
                              {pullRequest.title}
                            </span>
                            {pullRequest.draft ? (
                              <span className="rounded-full bg-default px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted">
                                Draft
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1 block text-[10px] text-muted">
                            #{pullRequest.number} by{" "}
                            {pullRequest.author ?? "Unknown"} · updated{" "}
                            {relativeTime(pullRequest.updatedAt)}
                          </span>
                          {pullRequest.headRef || pullRequest.baseRef ? (
                            <span className="mt-2 block truncate font-mono text-[10px] text-muted">
                              {pullRequest.headRef ?? "branch"} →{" "}
                              {pullRequest.baseRef ?? branch}
                            </span>
                          ) : null}
                        </span>
                        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted" />
                      </span>
                    </a>
                  ))}
                </div>
              </ScrollShadow>
            ) : (
              <EmptyPanel
                detail="There are no open pull requests for this repository."
                icon={<GitPullRequest className="h-5 w-5" />}
                title="Review queue is clear"
              />
            )}
          </Tabs.Panel>
        </Tabs>
      </section>

      <section
        className={`${panelClass} flex min-h-[360px] flex-col overflow-hidden lg:min-h-0`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-separator p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Repository work
            </p>
            <h2 className="mt-1 text-lg font-semibold">Linked tasks</h2>
            <p className="mt-1 truncate text-xs text-muted">
              {selectedRepo
                ? `${linkedTasks.length} for ${selectedRepo.name}`
                : "Select a repository"}
            </p>
          </div>
          <ListTodo className="mt-1 h-4 w-4 shrink-0 text-accent" />
        </div>

        <ScrollShadow
          className="min-h-0 flex-1 p-3"
          hideScrollBar={false}
          offset={8}
          size={56}
        >
          <div className="space-y-2">
            {linkedTasks.map((task) => {
              const completed = task.status === "completed";

              return (
                <div
                  className="task-rail-card rounded-xl border border-separator bg-surface p-3"
                  key={task.id ?? `${task.title}-${task.updated ?? ""}`}
                >
                  <div className="flex items-start gap-3">
                    {completed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold leading-5 ${
                          completed
                            ? "text-muted line-through"
                            : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
                        <span>{task.taskListTitle ?? "Tasks"}</span>
                        {task.due ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTaskDue(task.due)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {linkedTasks.length === 0 ? (
              <EmptyPanel
                detail={
                  selectedRepo
                    ? `Assign ${selectedRepo.fullName} while editing a task in Tasks. Linked work will appear here immediately.`
                    : "Choose a repository to see the work connected to it."
                }
                icon={<ListTodo className="h-5 w-5" />}
                title={
                  selectedRepo ? "No linked tasks yet" : "Select a repository"
                }
              />
            ) : null}
          </div>
        </ScrollShadow>
      </section>
    </div>
  );
}
