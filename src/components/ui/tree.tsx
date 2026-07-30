"use client";

import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useId,
  useState,
} from "react";

import { cn } from "@/lib/utils";

type TreeContextType = {
  animateExpand: boolean;
  expandedIds: Set<string>;
  handleSelection: (nodeId: string, ctrlKey: boolean) => void;
  indent: number;
  multiSelect: boolean;
  selectable: boolean;
  selectedIds: string[];
  showIcons: boolean;
  showLines: boolean;
  toggleExpanded: (nodeId: string) => void;
};

const TreeContext = createContext<TreeContextType | undefined>(undefined);

export function useTree() {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error("Tree components must be used within a TreeProvider");
  }
  return context;
}

type TreeNodeContextType = {
  isLast: boolean;
  level: number;
  nodeId: string;
  parentPath: boolean[];
};

const TreeNodeContext = createContext<TreeNodeContextType | undefined>(
  undefined,
);

function useTreeNode() {
  const context = useContext(TreeNodeContext);
  if (!context) {
    throw new Error("TreeNode components must be used within a TreeNode");
  }
  return context;
}

export type TreeProviderProps = {
  animateExpand?: boolean;
  children: ReactNode;
  className?: string;
  defaultExpandedIds?: string[];
  indent?: number;
  multiSelect?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  selectable?: boolean;
  selectedIds?: string[];
  showIcons?: boolean;
  showLines?: boolean;
};

export function TreeProvider({
  animateExpand = true,
  children,
  className,
  defaultExpandedIds = [],
  indent = 20,
  multiSelect = false,
  onSelectionChange,
  selectable = true,
  selectedIds,
  showIcons = true,
  showLines = true,
}: TreeProviderProps) {
  const [expandedIds, setExpandedIds] = useState(
    () => new Set(defaultExpandedIds),
  );
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(
    selectedIds ?? [],
  );
  const isControlled =
    selectedIds !== undefined && onSelectionChange !== undefined;
  const currentSelectedIds = isControlled ? selectedIds : internalSelectedIds;

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const handleSelection = useCallback(
    (nodeId: string, ctrlKey = false) => {
      if (!selectable) return;
      const next =
        multiSelect && ctrlKey
          ? currentSelectedIds.includes(nodeId)
            ? currentSelectedIds.filter((id) => id !== nodeId)
            : [...currentSelectedIds, nodeId]
          : currentSelectedIds.includes(nodeId)
            ? []
            : [nodeId];

      if (isControlled) onSelectionChange?.(next);
      else setInternalSelectedIds(next);
    },
    [
      currentSelectedIds,
      isControlled,
      multiSelect,
      onSelectionChange,
      selectable,
    ],
  );

  return (
    <TreeContext.Provider
      value={{
        animateExpand,
        expandedIds,
        handleSelection,
        indent,
        multiSelect,
        selectable,
        selectedIds: currentSelectedIds,
        showIcons,
        showLines,
        toggleExpanded,
      }}
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={cn("w-full", className)}
        initial={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </TreeContext.Provider>
  );
}

export type TreeViewProps = HTMLAttributes<HTMLDivElement>;

export function TreeView({
  children,
  className,
  ...props
}: TreeViewProps) {
  return (
    <div className={cn("p-2", className)} role="tree" {...props}>
      {children}
    </div>
  );
}

export type TreeNodeProps = HTMLAttributes<HTMLDivElement> & {
  isLast?: boolean;
  level?: number;
  nodeId?: string;
  parentPath?: boolean[];
};

export function TreeNode({
  children,
  className,
  isLast = false,
  level = 0,
  nodeId: providedNodeId,
  parentPath = [],
  ...props
}: TreeNodeProps) {
  const { selectedIds } = useTree();
  const generatedId = useId();
  const nodeId = providedNodeId ?? generatedId;
  const currentPath = level === 0 ? [] : [...parentPath];
  while (level > 0 && currentPath.length < level - 1) {
    currentPath.push(false);
  }
  if (level > 0) currentPath[level - 1] = isLast;

  return (
    <TreeNodeContext.Provider
      value={{ isLast, level, nodeId, parentPath: currentPath }}
    >
      <div
        aria-level={level + 1}
        aria-selected={selectedIds.includes(nodeId)}
        className={cn("select-none", className)}
        role="treeitem"
        {...props}
      >
        {children}
      </div>
    </TreeNodeContext.Provider>
  );
}

export type TreeNodeTriggerProps = ComponentProps<typeof motion.div>;

export function TreeNodeTrigger({
  children,
  className,
  onClick,
  ...props
}: TreeNodeTriggerProps) {
  const { handleSelection, indent, selectedIds, toggleExpanded } = useTree();
  const { level, nodeId } = useTreeNode();
  const isSelected = selectedIds.includes(nodeId);

  return (
    <motion.div
      aria-selected={isSelected}
      className={cn(
        "group relative mx-1 flex cursor-pointer items-center rounded-lg px-2.5 py-2 transition-colors duration-200",
        "hover:bg-accent-soft",
        isSelected && "bg-accent-soft",
        className,
      )}
      onClick={(event) => {
        toggleExpanded(nodeId);
        handleSelection(nodeId, event.ctrlKey || event.metaKey);
        onClick?.(event);
      }}
      style={{ paddingLeft: level * indent + 8 }}
      whileTap={{ scale: 0.99, transition: { duration: 0.08 } }}
      {...props}
    >
      <TreeLines />
      {children as ReactNode}
    </motion.div>
  );
}

export function TreeLines() {
  const { indent, showLines } = useTree();
  const { isLast, level, parentPath } = useTreeNode();
  if (!showLines || level === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-y-0 left-0">
      {Array.from({ length: level }, (_, index) => {
        const hideLine = parentPath[index] === true;
        if (hideLine && index === level - 1) return null;
        return (
          <div
            className="absolute inset-y-0 border-l border-separator"
            key={index}
            style={{
              display: hideLine ? "none" : "block",
              left: index * indent + 12,
            }}
          />
        );
      })}
      <div
        className="absolute top-1/2 border-t border-separator"
        style={{
          left: (level - 1) * indent + 12,
          transform: "translateY(-1px)",
          width: indent - 4,
        }}
      />
      {isLast ? (
        <div
          className="absolute top-0 border-l border-separator"
          style={{
            height: "50%",
            left: (level - 1) * indent + 12,
          }}
        />
      ) : null}
    </div>
  );
}

export type TreeNodeContentProps = ComponentProps<typeof motion.div> & {
  hasChildren?: boolean;
};

export function TreeNodeContent({
  children,
  className,
  hasChildren = false,
  ...props
}: TreeNodeContentProps) {
  const { animateExpand, expandedIds } = useTree();
  const { nodeId } = useTreeNode();
  const isExpanded = expandedIds.has(nodeId);

  return (
    <AnimatePresence initial={false}>
      {hasChildren && isExpanded ? (
        <motion.div
          animate={{ height: "auto", opacity: 1 }}
          className="overflow-hidden"
          exit={{ height: 0, opacity: 0 }}
          initial={{ height: 0, opacity: 0 }}
          transition={{
            duration: animateExpand ? 0.24 : 0,
            ease: "easeInOut",
          }}
        >
          <motion.div
            animate={{ y: 0 }}
            className={className}
            exit={{ y: -6 }}
            initial={{ y: -6 }}
            transition={{ duration: animateExpand ? 0.16 : 0 }}
            {...props}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export type TreeExpanderProps = ComponentProps<typeof motion.div> & {
  hasChildren?: boolean;
};

export function TreeExpander({
  className,
  hasChildren = false,
  onClick,
  ...props
}: TreeExpanderProps) {
  const { expandedIds, toggleExpanded } = useTree();
  const { nodeId } = useTreeNode();
  const isExpanded = expandedIds.has(nodeId);
  if (!hasChildren) return <div className="mr-1 h-4 w-4" />;

  return (
    <motion.div
      animate={{ rotate: isExpanded ? 90 : 0 }}
      className={cn(
        "mr-1 flex h-4 w-4 cursor-pointer items-center justify-center",
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        toggleExpanded(nodeId);
        onClick?.(event);
      }}
      transition={{ duration: 0.18, ease: "easeInOut" }}
      {...props}
    >
      <ChevronRight className="h-3 w-3 text-muted" />
    </motion.div>
  );
}

export type TreeIconProps = ComponentProps<typeof motion.div> & {
  hasChildren?: boolean;
  icon?: ReactNode;
};

export function TreeIcon({
  className,
  hasChildren = false,
  icon,
  ...props
}: TreeIconProps) {
  const { expandedIds, showIcons } = useTree();
  const { nodeId } = useTreeNode();
  const isExpanded = expandedIds.has(nodeId);
  if (!showIcons) return null;

  const defaultIcon = hasChildren ? (
    isExpanded ? (
      <FolderOpen className="h-4 w-4" />
    ) : (
      <Folder className="h-4 w-4" />
    )
  ) : (
    <File className="h-4 w-4" />
  );

  return (
    <motion.div
      className={cn(
        "mr-2 flex h-4 w-4 items-center justify-center text-muted",
        className,
      )}
      transition={{ duration: 0.15 }}
      whileHover={{ scale: 1.1 }}
      {...props}
    >
      {icon ?? defaultIcon}
    </motion.div>
  );
}

export type TreeLabelProps = HTMLAttributes<HTMLSpanElement>;

export function TreeLabel({ className, ...props }: TreeLabelProps) {
  return (
    <span
      className={cn("min-w-0 flex-1 truncate text-sm font-medium", className)}
      {...props}
    />
  );
}
