"use client";

import { Button, ScrollShadow, Tabs } from "@heroui/react";
import {
  Activity,
  Atom,
  BookOpenText,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
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
  GitFork,
  GitMerge,
  GitPullRequest,
  ListTodo,
  LockKeyhole,
  Package,
  Palette,
  SquareTerminal,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react";

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
  detailsLoaded: boolean;
  parents: string[];
  files: Array<{
    path: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    htmlUrl?: string | null;
  }>;
};

type GithubGraphCommit = GithubCommit & {
  branchNames: string[];
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

type GithubBranch = {
  name: string;
  protected: boolean;
  sha?: string | null;
};

type GithubPanelTab = "overview" | "directory" | "commits" | "pullRequests";

export const defaultGithubWorkspaceLayout = {
  repositories: 15,
  tasks: 15,
};
export type GithubWorkspaceLayout = typeof defaultGithubWorkspaceLayout;

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

const githubBranchColors = [
  "#22d3ee",
  "#f97316",
  "#d946ef",
  "#22c55e",
  "#facc15",
];

type GithubGraphLane = {
  colorIndex: number;
  sha: string;
};

type GithubGraphNodeLayout = {
  colorIndex: number;
  joinLanes: Array<{ colorIndex: number; lane: number }>;
  lane: number;
};

type GithubGraphEdgeLayout = {
  colorIndex: number;
  kind: "direct" | "fork" | "merge";
  parentSha: string;
  sourceSha: string;
};

function githubCommitTimestamp(commit: GithubGraphCommit) {
  return commit.authoredAt ? new Date(commit.authoredAt).getTime() : 0;
}

function orderGithubGraphCommits(commits: GithubGraphCommit[]) {
  const commitBySha = new Map(commits.map((commit) => [commit.sha, commit]));
  const originalIndex = new Map(
    commits.map((commit, index) => [commit.sha, index]),
  );
  const remainingChildren = new Map(commits.map((commit) => [commit.sha, 0]));

  commits.forEach((commit) => {
    commit.parents.forEach((parentSha) => {
      if (!commitBySha.has(parentSha)) return;
      remainingChildren.set(
        parentSha,
        (remainingChildren.get(parentSha) ?? 0) + 1,
      );
    });
  });

  const compareCommits = (left: GithubGraphCommit, right: GithubGraphCommit) =>
    githubCommitTimestamp(right) - githubCommitTimestamp(left) ||
    (originalIndex.get(left.sha) ?? 0) - (originalIndex.get(right.sha) ?? 0);
  const available = commits
    .filter((commit) => (remainingChildren.get(commit.sha) ?? 0) === 0)
    .sort(compareCommits);
  const ordered: GithubGraphCommit[] = [];
  const visited = new Set<string>();

  while (available.length > 0) {
    const commit = available.shift()!;
    if (visited.has(commit.sha)) continue;
    visited.add(commit.sha);
    ordered.push(commit);

    commit.parents.forEach((parentSha) => {
      const parent = commitBySha.get(parentSha);
      if (!parent) return;
      const nextCount = Math.max(
        0,
        (remainingChildren.get(parentSha) ?? 0) - 1,
      );
      remainingChildren.set(parentSha, nextCount);
      if (nextCount === 0) {
        available.push(parent);
        available.sort(compareCommits);
      }
    });
  }

  if (ordered.length < commits.length) {
    ordered.push(
      ...commits
        .filter((commit) => !visited.has(commit.sha))
        .sort(compareCommits),
    );
  }

  return ordered;
}

function buildGithubGraphLayout(
  commits: GithubGraphCommit[],
  branches: GithubBranch[],
  selectedBranches: string[],
) {
  const commitBySha = new Map(commits.map((commit) => [commit.sha, commit]));
  const branchByName = new Map(branches.map((branch) => [branch.name, branch]));
  const childCountBySha = new Map<string, number>();
  const lanes: Array<GithubGraphLane | null> = [];
  const nodes = new Map<string, GithubGraphNodeLayout>();
  const edges: GithubGraphEdgeLayout[] = [];
  let nextColorIndex = selectedBranches.length;
  let maxLane = 0;

  commits.forEach((commit) => {
    commit.parents.forEach((parentSha) => {
      if (!commitBySha.has(parentSha)) return;
      childCountBySha.set(parentSha, (childCountBySha.get(parentSha) ?? 0) + 1);
    });
  });

  selectedBranches.forEach((branchName, colorIndex) => {
    const sha = branchByName.get(branchName)?.sha;
    if (!sha || !commitBySha.has(sha)) return;
    if (lanes.some((lane) => lane?.sha === sha)) return;
    lanes.push({ colorIndex, sha });
  });

  const openLane = (lane: GithubGraphLane, afterLane = -1) => {
    for (
      let index = Math.max(0, afterLane + 1);
      index < lanes.length;
      index += 1
    ) {
      if (lanes[index] !== null) continue;
      lanes[index] = lane;
      maxLane = Math.max(maxLane, index);
      return index;
    }
    lanes.push(lane);
    maxLane = Math.max(maxLane, lanes.length - 1);
    return lanes.length - 1;
  };

  commits.forEach((commit) => {
    const matchingLanes = lanes.flatMap((lane, index) =>
      lane?.sha === commit.sha ? [index] : [],
    );
    let nodeLane = matchingLanes[0];

    if (nodeLane === undefined) {
      nodeLane = openLane({
        colorIndex: nextColorIndex,
        sha: commit.sha,
      });
      nextColorIndex += 1;
    }

    const nodeColorIndex = lanes[nodeLane]?.colorIndex ?? 0;
    const joinLanes = matchingLanes.slice(1).map((lane) => ({
      colorIndex: lanes[lane]?.colorIndex ?? nodeColorIndex,
      lane,
    }));
    matchingLanes.slice(1).forEach((lane) => {
      lanes[lane] = null;
    });
    nodes.set(commit.sha, {
      colorIndex: nodeColorIndex,
      joinLanes,
      lane: nodeLane,
    });
    maxLane = Math.max(
      maxLane,
      nodeLane,
      ...joinLanes.map((item) => item.lane),
    );

    const [firstParent, ...mergeParents] = commit.parents;
    if (firstParent && commitBySha.has(firstParent)) {
      const existingParentLane = lanes.findIndex(
        (lane, index) => index !== nodeLane && lane?.sha === firstParent,
      );
      if (existingParentLane >= 0) {
        lanes[nodeLane] = null;
      } else {
        lanes[nodeLane] = { colorIndex: nodeColorIndex, sha: firstParent };
      }
      edges.push({
        colorIndex: nodeColorIndex,
        kind: (childCountBySha.get(firstParent) ?? 0) > 1 ? "fork" : "direct",
        parentSha: firstParent,
        sourceSha: commit.sha,
      });
    } else {
      lanes[nodeLane] = null;
    }

    mergeParents.forEach((parentSha) => {
      if (!commitBySha.has(parentSha)) return;
      const existingParentLane = lanes.findIndex(
        (lane) => lane?.sha === parentSha,
      );
      let colorIndex: number;
      if (existingParentLane >= 0) {
        colorIndex = lanes[existingParentLane]?.colorIndex ?? nodeColorIndex;
      } else {
        colorIndex = nextColorIndex;
        nextColorIndex += 1;
        openLane({ colorIndex, sha: parentSha }, nodeLane);
      }
      edges.push({
        colorIndex,
        kind: "merge",
        parentSha,
        sourceSha: commit.sha,
      });
    });
  });

  return { edges, maxLane, nodes };
}

function GithubCommitGraph({
  branches,
  commits,
  contributorFilter,
  detailError,
  detailLoadingSha,
  expandedCommitSha,
  onSelectCommit,
  selectedBranches,
}: {
  branches: GithubBranch[];
  commits: GithubGraphCommit[];
  contributorFilter: string;
  detailError: string | null;
  detailLoadingSha: string | null;
  expandedCommitSha: string | null;
  onSelectCommit: (commit: GithubGraphCommit) => void;
  selectedBranches: string[];
}) {
  const rowHeight = 48;
  const laneGap = 18;
  const laneStart = 14;
  const graphLayout = buildGithubGraphLayout(
    commits,
    branches,
    selectedBranches,
  );
  const graphWidth = Math.max(
    52,
    laneStart * 2 + (graphLayout.maxLane + 1) * laneGap,
  );
  const totalHeight = commits.length * rowHeight;
  const rowIndexBySha = new Map(
    commits.map((commit, index) => [commit.sha, index]),
  );
  const selectedCommit = commits.find(
    (commit) => commit.sha === expandedCommitSha,
  );
  const laneX = (lane: number) => laneStart + lane * laneGap;
  const rowY = (index: number) => index * rowHeight + rowHeight / 2;
  const graphPaths = graphLayout.edges.flatMap((edge, index) => {
    const sourceRow = rowIndexBySha.get(edge.sourceSha);
    const targetRow = rowIndexBySha.get(edge.parentSha);
    const sourceNode = graphLayout.nodes.get(edge.sourceSha);
    const targetNode = graphLayout.nodes.get(edge.parentSha);
    if (
      sourceRow === undefined ||
      targetRow === undefined ||
      targetRow <= sourceRow ||
      !sourceNode ||
      !targetNode
    ) {
      return [];
    }
    const sourceX = laneX(sourceNode.lane);
    const targetX = laneX(targetNode.lane);
    const sourceY = rowY(sourceRow);
    const targetY = rowY(targetRow);
    const middleY = sourceY + (targetY - sourceY) / 2;
    return [
      {
        color: githubBranchColors[edge.colorIndex % githubBranchColors.length],
        d:
          sourceX === targetX
            ? `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
            : `M ${sourceX} ${sourceY} C ${sourceX} ${middleY}, ${targetX} ${middleY}, ${targetX} ${targetY}`,
        key: `${edge.kind}-${edge.sourceSha}-${edge.parentSha}-${index}`,
        kind: edge.kind,
      },
    ];
  });

  return (
    <div className="github-commit-graph-shell">
      <div className="github-commit-graph" style={{ minHeight: totalHeight }}>
        <svg
          aria-hidden="true"
          className="github-commit-graph__canvas"
          height={totalHeight}
          viewBox={`0 0 ${graphWidth} ${totalHeight}`}
          width={graphWidth}
        >
          {Array.from({ length: graphLayout.maxLane + 1 }, (_, lane) => (
            <line
              className="github-graph-guide"
              key={`guide-${lane}`}
              stroke="var(--separator)"
              x1={laneX(lane)}
              x2={laneX(lane)}
              y1={0}
              y2={totalHeight}
            />
          ))}
          {graphPaths.map((path) => (
            <path
              className={`github-graph-path github-graph-path--${path.kind}`}
              d={path.d}
              key={path.key}
              stroke={path.color}
            />
          ))}
          {commits.map((commit, commitIndex) => {
            const nodeY = rowY(commitIndex);
            const node = graphLayout.nodes.get(commit.sha);
            if (!node) return null;
            const nodeX = laneX(node.lane);
            const color =
              githubBranchColors[node.colorIndex % githubBranchColors.length];
            const isRoot = commit.parents.length === 0;

            return (
              <g key={`nodes-${commit.sha}`}>
                {node.joinLanes.map((joinLane) => {
                  const joinX = laneX(joinLane.lane);
                  const joinColor =
                    githubBranchColors[
                      joinLane.colorIndex % githubBranchColors.length
                    ];
                  return (
                    <g key={`${commit.sha}-join-${joinLane.lane}`}>
                      <path
                        className="github-graph-path github-graph-path--reference"
                        d={`M ${joinX} ${nodeY} C ${joinX} ${nodeY + 8}, ${nodeX} ${nodeY + 8}, ${nodeX} ${nodeY}`}
                        stroke={joinColor}
                      />
                      <circle
                        className="github-graph-reference-node"
                        cx={joinX}
                        cy={nodeY}
                        fill="var(--surface)"
                        r={3.25}
                        stroke={joinColor}
                      />
                    </g>
                  );
                })}
                {isRoot ? (
                  <rect
                    className="github-graph-root-ribbon"
                    fill={color}
                    height={10}
                    rx={1}
                    width={Math.max(12, graphWidth - nodeX - 4)}
                    x={nodeX}
                    y={nodeY - 5}
                  />
                ) : null}
                <circle
                  className="github-graph-node"
                  cx={nodeX}
                  cy={nodeY}
                  fill="var(--surface)"
                  r={commit.parents.length > 1 || isRoot ? 5 : 4.5}
                  stroke={color}
                />
              </g>
            );
          })}
        </svg>

        <div className="github-commit-graph__rows">
          {commits.map((commit) => {
            const selected = commit.sha === expandedCommitSha;
            const authorId = commit.author.login ?? commit.author.name;
            const matchesContributor =
              contributorFilter === "all" || authorId === contributorFilter;
            const tipBranches = selectedBranches.filter((branch) =>
              branches.some(
                (item) => item.name === branch && item.sha === commit.sha,
              ),
            );

            return (
              <button
                aria-expanded={selected}
                aria-label={`Inspect commit ${commit.shortSha}: ${commitTitle(commit.message)}`}
                className="github-commit-graph__row"
                data-context={!matchesContributor || undefined}
                data-selected={selected || undefined}
                key={commit.sha}
                onClick={() => onSelectCommit(commit)}
                style={{
                  gridTemplateColumns: `${graphWidth}px minmax(0, 1fr) auto`,
                  height: rowHeight,
                }}
                type="button"
              >
                <span aria-hidden="true" />
                <span className="min-w-0 py-1.5 text-left">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {commit.parents.length > 1 ? (
                      <GitMerge className="h-3.5 w-3.5 shrink-0 text-muted" />
                    ) : null}
                    <span className="truncate text-[11px] font-semibold text-foreground">
                      {commitTitle(commit.message)}
                    </span>
                    {tipBranches.map((branch) => {
                      const colorIndex = selectedBranches.indexOf(branch);
                      return (
                        <span
                          className="github-branch-tip"
                          key={branch}
                          style={{
                            borderColor:
                              githubBranchColors[
                                colorIndex % githubBranchColors.length
                              ],
                            color:
                              githubBranchColors[
                                colorIndex % githubBranchColors.length
                              ],
                          }}
                        >
                          {branch}
                        </span>
                      );
                    })}
                  </span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-2 text-[9px] text-muted">
                    <span className="truncate font-semibold text-foreground/80">
                      {authorId}
                    </span>
                    <span className="shrink-0">
                      {formatCommitTime(commit.authoredAt)}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2 pr-3 text-[9px] text-muted">
                  <span className="font-mono">{commit.shortSha}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${selected ? "rotate-180" : ""}`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {contributorFilter !== "all" ? (
        <p className="github-graph-context-note">
          Other contributors remain dimmed so branch and merge paths stay
          continuous.
        </p>
      ) : null}

      {selectedCommit ? (
        <article className="github-commit-detail">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                Commit detail
              </p>
              <h4 className="mt-1 truncate text-sm font-semibold">
                {commitTitle(selectedCommit.message)}
              </h4>
            </div>
            <a
              className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-accent hover:underline"
              href={selectedCommit.htmlUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open on GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {detailLoadingSha === selectedCommit.sha ? (
            <div className="mt-3 space-y-2">
              <div className="skeleton h-8 rounded-lg" />
              <div className="skeleton h-8 rounded-lg" />
            </div>
          ) : detailError ? (
            <p className="mt-3 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
              {detailError}
            </p>
          ) : selectedCommit.detailsLoaded ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-semibold">
                <span className="text-muted">
                  {selectedCommit.changedFiles} changed files
                </span>
                <span className="text-success">
                  +{selectedCommit.additions}
                </span>
                <span className="text-danger">-{selectedCommit.deletions}</span>
                {selectedCommit.parents.length > 1 ? (
                  <span className="inline-flex items-center gap-1 text-muted">
                    <GitMerge className="h-3 w-3" />
                    {selectedCommit.parents.length} parents
                  </span>
                ) : null}
              </div>
              {selectedCommit.files.length ? (
                <div className="mt-3 space-y-1">
                  {selectedCommit.files.map((file) => (
                    <div className="github-commit-file-row" key={file.path}>
                      <span
                        className="github-file-status"
                        data-status={file.status}
                      >
                        {fileStatusLabel(file.status).slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-foreground">
                        {file.path}
                      </span>
                      <span className="text-success">+{file.additions}</span>
                      <span className="text-danger">-{file.deletions}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted">
                  This commit has no changed-file details available.
                </p>
              )}
            </>
          ) : null}
        </article>
      ) : null}
    </div>
  );
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

type GithubResizeAxis = "repositories" | "tasks";

function GithubResizeHandle({
  active,
  axis,
  onChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  value,
}: {
  active: boolean;
  axis: GithubResizeAxis;
  onChange: (value: number) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  value: number;
}) {
  const label =
    axis === "repositories"
      ? "Resize repository rail"
      : "Resize linked tasks rail";

  function resizeWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 4 : 1;
    const direction = axis === "repositories" ? 1 : -1;
    let nextValue: number | null = null;

    if (event.key === "ArrowLeft") nextValue = value - step * direction;
    if (event.key === "ArrowRight") nextValue = value + step * direction;
    if (event.key === "Home") nextValue = 10;
    if (event.key === "End") nextValue = 30;
    if (nextValue === null) return;

    event.preventDefault();
    onChange(nextValue);
  }

  return (
    <div
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemax={30}
      aria-valuemin={10}
      aria-valuenow={Math.round(value)}
      aria-valuetext={`${Math.round(value)} percent`}
      className="github-workspace-divider task-resize-handle task-resize-handle--vertical hidden xl:block"
      data-resizing={active || undefined}
      onDoubleClick={() => onChange(15)}
      onKeyDown={resizeWithKeyboard}
      onLostPointerCapture={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="separator"
      tabIndex={0}
      title={`${label}. Drag, use arrow keys, or double-click to reset.`}
    />
  );
}

export function GithubRepositoryExplorer({
  githubLayout,
  repositories,
  repositoryError,
  setGithubLayout,
  signedIn,
  tasks,
}: {
  githubLayout: GithubWorkspaceLayout;
  repositories: Repository[];
  repositoryError?: string;
  setGithubLayout: Dispatch<SetStateAction<GithubWorkspaceLayout>>;
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
  const [activeTab, setActiveTab] = useState<GithubPanelTab>("overview");
  const [branches, setBranches] = useState<GithubBranch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(
    repositories[0]?.defaultBranch ? [repositories[0].defaultBranch] : [],
  );
  const [commits, setCommits] = useState<GithubGraphCommit[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [commitDetailError, setCommitDetailError] = useState<string | null>(
    null,
  );
  const [loadingCommitDetailSha, setLoadingCommitDetailSha] = useState<
    string | null
  >(null);
  const [contributorFilter, setContributorFilter] = useState("all");
  const [expandedCommitSha, setExpandedCommitSha] = useState<string | null>(
    null,
  );
  const [pullRequests, setPullRequests] = useState<GithubPullRequest[]>([]);
  const [loadingPullRequests, setLoadingPullRequests] = useState(false);
  const [pullRequestError, setPullRequestError] = useState<string | null>(null);
  const [activeResize, setActiveResize] = useState<GithubResizeAxis | null>(
    null,
  );
  const githubLayoutRef = useRef<HTMLDivElement>(null);
  const githubResizeRef = useRef<{
    axis: GithubResizeAxis;
    pointerId: number;
    startRepositories: number;
    startTasks: number;
    startX: number;
  } | null>(null);
  const selectedRepo =
    repositories.find((repo) => repo.fullName === selectedRepoName) ??
    repositories[0] ??
    null;
  const selectedRepoFullName = selectedRepo?.fullName ?? "";
  const defaultBranch = selectedRepo?.defaultBranch ?? "main";
  const branch = selectedBranches[0] ?? defaultBranch;
  const selectedBranchKey = selectedBranches.join("\u0000");
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
  const contributorActivity = useMemo(() => {
    const counts = new Map<string, { count: number; name: string }>();
    commits.forEach((commit) => {
      const id = commit.author.login ?? commit.author.name;
      const current = counts.get(id);
      counts.set(id, {
        count: (current?.count ?? 0) + 1,
        name: commit.author.login ?? commit.author.name,
      });
    });
    return Array.from(counts.entries())
      .map(([id, value]) => ({ id, ...value }))
      .sort((left, right) => right.count - left.count);
  }, [commits]);

  useEffect(
    () => () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    },
    [],
  );

  function setRepositoryRailWidth(nextWidth: number) {
    setGithubLayout((current) => ({
      ...current,
      repositories: Math.min(
        30,
        Math.max(10, Math.min(nextWidth, 50 - current.tasks)),
      ),
    }));
  }

  function setTaskRailWidth(nextWidth: number) {
    setGithubLayout((current) => ({
      ...current,
      tasks: Math.min(
        30,
        Math.max(10, Math.min(nextWidth, 50 - current.repositories)),
      ),
    }));
  }

  function startGithubResize(
    event: ReactPointerEvent<HTMLDivElement>,
    axis: GithubResizeAxis,
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    githubResizeRef.current = {
      axis,
      pointerId: event.pointerId,
      startRepositories: githubLayout.repositories,
      startTasks: githubLayout.tasks,
      startX: event.clientX,
    };
    setActiveResize(axis);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function moveGithubResize(event: ReactPointerEvent<HTMLDivElement>) {
    const resize = githubResizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    const width = githubLayoutRef.current?.getBoundingClientRect().width ?? 1200;
    const delta = ((event.clientX - resize.startX) / width) * 100;

    if (resize.axis === "repositories") {
      setRepositoryRailWidth(resize.startRepositories + delta);
      return;
    }
    setTaskRailWidth(resize.startTasks - delta);
  }

  function finishGithubResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    githubResizeRef.current = null;
    setActiveResize(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  function selectRepository(fullName: string) {
    const nextRepository = repositories.find(
      (repository) => repository.fullName === fullName,
    );
    setSelectedRepoName(fullName);
    setEntries([]);
    setCommits([]);
    setPullRequests([]);
    setBranches([]);
    setSelectedPath(null);
    setSelectedBranches([nextRepository?.defaultBranch ?? "main"]);
    setContributorFilter("all");
    setExpandedCommitSha(null);
  }

  function toggleBranch(nextBranch: string) {
    setSelectedBranches((current) => {
      if (current.includes(nextBranch)) {
        return current.length > 1
          ? current.filter((branch) => branch !== nextBranch)
          : current;
      }
      return current.length < 5 ? [...current, nextBranch] : current;
    });
    setEntries([]);
    setCommits([]);
    setSelectedPath(null);
    setContributorFilter("all");
    setExpandedCommitSha(null);
    setCommitDetailError(null);
  }

  useEffect(() => {
    if (!selectedRepoFullName) return;

    const controller = new AbortController();
    const [owner, repo] = selectedRepoFullName.split("/");

    async function loadBranches() {
      setLoadingBranches(true);
      setBranchError(null);

      try {
        const response = await fetch(
          `/api/github/branches?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as {
          branches?: GithubBranch[];
          ok?: boolean;
          reason?: string;
        };

        if (!response.ok || !data.ok) {
          throw new Error(data.reason ?? "Unable to load branches.");
        }
        const nextBranches = data.branches ?? [];
        setBranches(nextBranches);
        setSelectedBranches((current) => {
          const available = new Set(nextBranches.map((item) => item.name));
          const retained = current.filter((branch) => available.has(branch));
          return retained.length
            ? retained.slice(0, 5)
            : [
                nextBranches.find((item) => item.name === defaultBranch)
                  ?.name ??
                  nextBranches[0]?.name ??
                  defaultBranch,
              ];
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setBranches([]);
        setBranchError(
          error instanceof Error ? error.message : "Unable to load branches.",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingBranches(false);
      }
    }

    void loadBranches();
    return () => controller.abort();
  }, [defaultBranch, selectedRepoFullName]);

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
    if (!selectedRepoFullName) return;

    const controller = new AbortController();
    const [owner, repo] = selectedRepoFullName.split("/");

    async function loadCommits() {
      setLoadingCommits(true);
      setCommitError(null);

      try {
        const branchesForHistory = selectedBranchKey
          ? selectedBranchKey.split("\u0000")
          : [defaultBranch];
        const historyByBranch = await Promise.all(
          branchesForHistory.map(async (selectedBranch) => {
            const response = await fetch(
              `/api/github/commits?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&ref=${encodeURIComponent(selectedBranch)}&maxResults=40&includeDetails=false`,
              { signal: controller.signal },
            );
            const data = (await response.json()) as {
              commits?: GithubCommit[];
              ok?: boolean;
              reason?: string;
            };

            if (!response.ok || !data.ok) {
              throw new Error(
                data.reason ??
                  `Unable to load commit history for ${selectedBranch}.`,
              );
            }
            return {
              branch: selectedBranch,
              commits: data.commits ?? [],
            };
          }),
        );
        const commitMap = new Map<string, GithubGraphCommit>();
        historyByBranch.forEach((history) => {
          history.commits.forEach((commit) => {
            const existing = commitMap.get(commit.sha);
            if (existing) {
              if (!existing.branchNames.includes(history.branch)) {
                existing.branchNames.push(history.branch);
              }
              return;
            }
            commitMap.set(commit.sha, {
              ...commit,
              branchNames: [history.branch],
            });
          });
        });
        setCommits(orderGithubGraphCommits(Array.from(commitMap.values())));
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
  }, [defaultBranch, selectedBranchKey, selectedRepoFullName]);

  useEffect(() => {
    if (
      !selectedRepoFullName ||
      (activeTab !== "pullRequests" && activeTab !== "overview")
    )
      return;

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

  async function selectCommit(commit: GithubGraphCommit) {
    if (expandedCommitSha === commit.sha) {
      setExpandedCommitSha(null);
      setCommitDetailError(null);
      return;
    }

    setExpandedCommitSha(commit.sha);
    setCommitDetailError(null);
    if (commit.detailsLoaded || !selectedRepoFullName) return;

    const [owner, repo] = selectedRepoFullName.split("/");
    setLoadingCommitDetailSha(commit.sha);
    try {
      const response = await fetch(
        `/api/github/commits?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&commitSha=${encodeURIComponent(commit.sha)}`,
      );
      const data = (await response.json()) as {
        commit?: GithubCommit;
        ok?: boolean;
        reason?: string;
      };
      if (!response.ok || !data.ok || !data.commit) {
        throw new Error(data.reason ?? "Unable to load commit details.");
      }
      setCommits((current) =>
        current.map((item) =>
          item.sha === commit.sha
            ? { ...data.commit!, branchNames: item.branchNames }
            : item,
        ),
      );
    } catch (error) {
      setCommitDetailError(
        error instanceof Error
          ? error.message
          : "Unable to load commit details.",
      );
    } finally {
      setLoadingCommitDetailSha(null);
    }
  }

  const selectedFileUrl =
    selectedRepo && selectedNode?.type === "blob"
      ? `${selectedRepo.htmlUrl}/blob/${encodeURIComponent(branch)}/${selectedNode.path
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`
      : null;

  return (
    <div
      className="github-workspace-grid grid h-full min-h-0 gap-0 overflow-y-auto xl:overflow-hidden"
      ref={githubLayoutRef}
      style={
        {
          "--github-repository-width": `${githubLayout.repositories}%`,
          "--github-task-width": `${githubLayout.tasks}%`,
        } as CSSProperties
      }
    >
      <section className="github-workspace-section flex min-h-[360px] flex-col overflow-hidden xl:min-h-0">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-separator p-4">
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

      <GithubResizeHandle
        active={activeResize === "repositories"}
        axis="repositories"
        onChange={setRepositoryRailWidth}
        onPointerDown={(event) => startGithubResize(event, "repositories")}
        onPointerMove={moveGithubResize}
        onPointerUp={finishGithubResize}
        value={githubLayout.repositories}
      />

      <section className="github-workspace-section flex min-h-[480px] flex-col overflow-hidden xl:min-h-0">
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
          <Tabs.ListContainer className="github-tabs-list-container shrink-0 rounded-none border-b border-separator bg-transparent">
            <Tabs.List
              aria-label="Repository sections"
              className={githubTabsListClassName}
            >
              <Tabs.Tab id="overview">
                <Activity className="h-3.5 w-3.5" />
                Overview
                <Tabs.Indicator />
              </Tabs.Tab>
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

          <Tabs.Panel className="min-h-0 flex-1 overflow-hidden" id="overview">
            {selectedRepo ? (
              <ScrollShadow
                className="h-full p-4"
                hideScrollBar={false}
                offset={8}
                size={56}
              >
                <div className="github-overview space-y-4">
                  <section className="github-overview-hero">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                        Repository pulse
                      </p>
                      <h3 className="mt-1 text-base font-semibold">
                        {commits[0]
                          ? commitTitle(commits[0].message)
                          : loadingCommits
                            ? "Reading the latest changes"
                            : "No recent commit loaded"}
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        {commits[0]
                          ? `${commits[0].author.login ?? commits[0].author.name} · ${relativeTime(commits[0].authoredAt)} on ${commits[0].branchNames.join(", ")}`
                          : (commitError ?? `Tracking activity on ${branch}.`)}
                      </p>
                    </div>
                    <span className="github-overview-pulse" aria-hidden="true">
                      <Activity className="h-5 w-5" />
                    </span>
                  </section>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="github-overview-stat">
                      <GitBranch className="h-4 w-4 text-accent" />
                      <div>
                        <p className="text-lg font-semibold tabular-nums">
                          {loadingBranches ? "—" : Math.max(branches.length, 1)}
                        </p>
                        <p className="text-[10px] text-muted">
                          {branchError ? "Default branch loaded" : "Branches"}
                        </p>
                      </div>
                    </div>
                    <div className="github-overview-stat">
                      <GitPullRequest className="h-4 w-4 text-violet-500" />
                      <div>
                        <p className="text-lg font-semibold tabular-nums">
                          {loadingPullRequests ? "—" : pullRequests.length}
                        </p>
                        <p className="text-[10px] text-muted">
                          Open pull requests
                        </p>
                      </div>
                    </div>
                    <div className="github-overview-stat">
                      <UserRound className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-lg font-semibold tabular-nums">
                          {loadingCommits ? "—" : contributors.length}
                        </p>
                        <p className="text-[10px] text-muted">
                          Recent contributors
                        </p>
                      </div>
                    </div>
                    <div className="github-overview-stat">
                      <ListTodo className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-lg font-semibold tabular-nums">
                          {
                            linkedTasks.filter(
                              (task) => task.status !== "completed",
                            ).length
                          }
                        </p>
                        <p className="text-[10px] text-muted">
                          Open linked tasks
                        </p>
                      </div>
                    </div>
                  </div>

                  <section className="rounded-xl border border-separator bg-surface-secondary/55 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-semibold">
                          Contributor activity
                        </h3>
                        <p className="mt-0.5 text-[10px] text-muted">
                          Share of the latest {commits.length} commits across{" "}
                          {selectedBranches.length || 1} selected branch
                          {(selectedBranches.length || 1) === 1 ? "" : "es"}
                        </p>
                      </div>
                      <GitFork className="h-4 w-4 text-muted" />
                    </div>
                    <div className="mt-3 space-y-2.5">
                      {contributorActivity.slice(0, 4).map((contributor) => (
                        <div key={contributor.id}>
                          <div className="flex items-center justify-between gap-3 text-[11px]">
                            <span className="truncate font-semibold">
                              {contributor.name}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted">
                              {contributor.count}
                            </span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-default">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{
                                width: `${Math.max(
                                  8,
                                  (contributor.count /
                                    Math.max(commits.length, 1)) *
                                    100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      {!loadingCommits && contributorActivity.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-separator px-3 py-5 text-center text-xs text-muted">
                          Contributor activity will appear after the first
                          commit.
                        </p>
                      ) : null}
                    </div>
                  </section>
                </div>
              </ScrollShadow>
            ) : (
              <EmptyPanel
                detail="Choose a repository from the rail to see its delivery pulse."
                icon={<Activity className="h-5 w-5" />}
                title="Select a repository"
              />
            )}
          </Tabs.Panel>

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
              {selectedRepo ? (
                <div className="github-commit-filters shrink-0 border-b border-separator px-3 py-2.5">
                  <details className="github-branch-picker">
                    <summary aria-label="Select branches to compare">
                      <span className="github-branch-picker__label">
                        <GitBranch className="h-3.5 w-3.5" />
                        Branches
                      </span>
                      <span className="github-branch-picker__value">
                        {selectedBranches[0] ?? defaultBranch}
                        {selectedBranches.length > 1
                          ? ` +${selectedBranches.length - 1}`
                          : ""}
                      </span>
                      <ChevronDown className="github-branch-picker__chevron h-3.5 w-3.5" />
                    </summary>
                    <div className="github-branch-picker__menu">
                      <div className="flex items-center justify-between gap-3 border-b border-separator px-3 py-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                          Compare branches
                        </span>
                        <span className="text-[9px] text-muted">
                          {selectedBranches.length}/5
                        </span>
                      </div>
                      <div className="max-h-52 overflow-y-auto p-1.5">
                        {loadingBranches ? (
                          <p className="px-2 py-6 text-center text-xs text-muted">
                            Loading branches…
                          </p>
                        ) : branchError ? (
                          <p className="px-2 py-6 text-center text-xs text-danger">
                            {branchError}
                          </p>
                        ) : null}
                        {branches.map((item, index) => {
                          const selected = selectedBranches.includes(item.name);
                          const limitReached =
                            !selected && selectedBranches.length >= 5;
                          const colorIndex = selected
                            ? selectedBranches.indexOf(item.name)
                            : index;
                          return (
                            <label
                              className="github-branch-picker__option"
                              data-disabled={limitReached || undefined}
                              key={item.name}
                            >
                              <input
                                checked={selected}
                                disabled={limitReached}
                                onChange={() => toggleBranch(item.name)}
                                type="checkbox"
                              />
                              <span
                                className="github-branch-picker__swatch"
                                style={{
                                  backgroundColor:
                                    githubBranchColors[
                                      Math.max(0, colorIndex) %
                                        githubBranchColors.length
                                    ],
                                }}
                              />
                              <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                                {item.name}
                              </span>
                              {item.protected ? (
                                <span className="text-[9px] text-muted">
                                  Protected
                                </span>
                              ) : null}
                              {selected ? (
                                <Check className="h-3.5 w-3.5 text-accent" />
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                      <p className="border-t border-separator px-3 py-2 text-[9px] leading-4 text-muted">
                        Keep at least one branch selected. Up to five lanes can
                        be compared at once.
                      </p>
                    </div>
                  </details>
                  <label className="github-filter-field">
                    <span>
                      <UserRound className="h-3.5 w-3.5" />
                      Contributor
                    </span>
                    <select
                      aria-label="Filter commits by contributor"
                      disabled={loadingCommits || contributors.length === 0}
                      onChange={(event) =>
                        setContributorFilter(event.target.value)
                      }
                      value={contributorFilter}
                    >
                      <option value="all">Everyone</option>
                      {contributors.map((contributor) => (
                        <option key={contributor.id} value={contributor.id}>
                          {contributor.login ?? contributor.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              {loadingCommits ? (
                <div className="space-y-px p-3">
                  {Array.from({ length: 7 }, (_, index) => (
                    <div
                      className="skeleton h-16 rounded-lg"
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
              ) : commits.length > 0 ? (
                <ScrollShadow
                  className="min-h-0 flex-1"
                  hideScrollBar={false}
                  offset={8}
                  size={56}
                >
                  <GithubCommitGraph
                    branches={branches}
                    commits={commits}
                    contributorFilter={contributorFilter}
                    detailError={commitDetailError}
                    detailLoadingSha={loadingCommitDetailSha}
                    expandedCommitSha={expandedCommitSha}
                    onSelectCommit={(commit) => void selectCommit(commit)}
                    selectedBranches={
                      selectedBranches.length
                        ? selectedBranches
                        : [defaultBranch]
                    }
                  />
                </ScrollShadow>
              ) : (
                <EmptyPanel
                  detail={
                    contributorFilter === "all"
                      ? "No commits were returned for the selected branches."
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

      <GithubResizeHandle
        active={activeResize === "tasks"}
        axis="tasks"
        onChange={setTaskRailWidth}
        onPointerDown={(event) => startGithubResize(event, "tasks")}
        onPointerMove={moveGithubResize}
        onPointerUp={finishGithubResize}
        value={githubLayout.tasks}
      />

      <section className="github-workspace-section flex min-h-[360px] flex-col overflow-hidden xl:min-h-0">
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
