"use client";

import { Button, ScrollShadow } from "@heroui/react";
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
  ListTodo,
  LockKeyhole,
  Package,
  Palette,
  SquareTerminal,
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

const panelClass =
  "relay-panel min-w-0 rounded-2xl border border-separator bg-surface shadow-surface transition duration-200 ease-out";

function relativeTime(value?: string | null) {
  if (!value) return "Update time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Update time unavailable";

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / 86_400_000),
    "day",
  );
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
      tree
        .filter((node) => node.kind === "directory")
        .map((node) => node.path),
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

  useEffect(() => {
    if (!selectedRepoFullName) return;

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
          error instanceof Error ? error.message : "Unable to load the file tree.",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingTree(false);
      }
    }

    void loadTree();
    return () => controller.abort();
  }, [branch, selectedRepoFullName]);

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
                  onClick={() => setSelectedRepoName(repo.fullName)}
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
                title={signedIn ? "No repositories loaded" : "GitHub not connected"}
              />
            ) : null}
          </div>
        </ScrollShadow>
      </section>

      <section
        className={`${panelClass} flex min-h-[480px] flex-col overflow-hidden lg:min-h-0`}
      >
        <div className="shrink-0 border-b border-separator p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {selectedRepo ? branch : "Repository"}
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold">
                {selectedRepo?.fullName ?? "File tree"}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                {selectedRepo?.description ??
                  "Select a repository to inspect its complete structure."}
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
              <span>{entries.filter((entry) => entry.type === "blob").length} files</span>
              <span>{entries.filter((entry) => entry.type === "tree").length} folders</span>
              <span>{selectedRepo.openIssues} open issues</span>
            </div>
          ) : null}
          {treeTruncated ? (
            <p className="mt-3 rounded-lg border border-warning bg-warning-soft px-3 py-2 text-xs text-warning">
              GitHub truncated this very large tree. The available structure is shown.
            </p>
          ) : null}
        </div>

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
              title={selectedRepo ? "Empty repository" : "Select a repository"}
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
                          completed ? "text-muted line-through" : "text-foreground"
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
                title={selectedRepo ? "No linked tasks yet" : "Select a repository"}
              />
            ) : null}
          </div>
        </ScrollShadow>
      </section>
    </div>
  );
}
