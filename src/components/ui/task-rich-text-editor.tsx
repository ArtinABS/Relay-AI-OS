"use client";

import {
  Bold,
  Code2,
  Heading2,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { CharacterCount } from "@tiptap/extension-character-count";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extension-placeholder";
import { EditorContent, type JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { cn } from "@/lib/utils";

export type TaskRichDocument = JSONContent;

type TaskRichTextEditorProps = {
  className?: string;
  defaultValue?: TaskRichDocument | null;
  fallbackText?: string;
  maxLength?: number;
  onChange?: (document: TaskRichDocument, plainText: string) => void;
  readOnly?: boolean;
};

function createTaskEditorExtensions(maxLength: number) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: {
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
        openOnClick: false,
      },
    }),
    TaskList,
    TaskItem.configure({
      a11y: {
        checkboxLabel: (node, checked) =>
          `${checked ? "Uncheck" : "Check"} ${node.textContent || "task item"}`,
      },
      nested: true,
    }),
    Placeholder.configure({
      placeholder: "Add context, links, decisions, or a checklist...",
    }),
    CharacterCount.configure({ limit: maxLength }),
  ];
}

export function TaskRichTextEditor({
  className,
  defaultValue,
  fallbackText = "",
  maxLength = 5000,
  onChange,
  readOnly = false,
}: TaskRichTextEditorProps) {
  const editor = useEditor({
    content: defaultValue ?? richDocumentFromText(fallbackText),
    editable: !readOnly,
    extensions: createTaskEditorExtensions(maxLength),
    immediatelyRender: false,
    onUpdate: ({ editor: activeEditor }) => {
      onChange?.(
        activeEditor.getJSON(),
        activeEditor.getText({ blockSeparator: "\n" }),
      );
    },
    shouldRerenderOnTransaction: true,
  });

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-24 animate-pulse rounded-xl bg-surface-secondary",
          className,
        )}
      />
    );
  }

  if (readOnly) {
    return (
      <div className={cn("task-rich-text task-rich-text--readonly", className)}>
        <EditorContent editor={editor} />
      </div>
    );
  }

  const characterCount = editor.getText().length;

  return (
    <div className={cn("task-rich-text", className)}>
      <div
        aria-label="Description formatting"
        className="task-rich-text__toolbar"
        role="toolbar"
      >
        <EditorToolbarButton
          active={editor.isActive("bold")}
          icon={Bold}
          label="Bold"
          onPress={() => editor.chain().focus().toggleBold().run()}
        />
        <EditorToolbarButton
          active={editor.isActive("italic")}
          icon={Italic}
          label="Italic"
          onPress={() => editor.chain().focus().toggleItalic().run()}
        />
        <EditorToolbarButton
          active={editor.isActive("underline")}
          icon={Underline}
          label="Underline"
          onPress={() => editor.chain().focus().toggleUnderline().run()}
        />
        <EditorToolbarButton
          active={editor.isActive("strike")}
          icon={Strikethrough}
          label="Strikethrough"
          onPress={() => editor.chain().focus().toggleStrike().run()}
        />
        <span className="task-rich-text__separator" />
        <EditorToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          icon={Heading2}
          label="Heading"
          onPress={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <EditorToolbarButton
          active={editor.isActive("bulletList")}
          icon={List}
          label="Bullet list"
          onPress={() => editor.chain().focus().toggleBulletList().run()}
        />
        <EditorToolbarButton
          active={editor.isActive("orderedList")}
          icon={ListOrdered}
          label="Numbered list"
          onPress={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <EditorToolbarButton
          active={editor.isActive("taskList")}
          icon={ListChecks}
          label="Checklist"
          onPress={() => editor.chain().focus().toggleTaskList().run()}
        />
        <EditorToolbarButton
          active={editor.isActive("blockquote")}
          icon={Quote}
          label="Quote"
          onPress={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <EditorToolbarButton
          active={editor.isActive("code")}
          icon={Code2}
          label="Inline code"
          onPress={() => editor.chain().focus().toggleCode().run()}
        />
        <span className="task-rich-text__separator" />
        <EditorToolbarButton
          disabled={!editor.can().chain().focus().undo().run()}
          icon={Undo2}
          label="Undo"
          onPress={() => editor.chain().focus().undo().run()}
        />
        <EditorToolbarButton
          disabled={!editor.can().chain().focus().redo().run()}
          icon={Redo2}
          label="Redo"
          onPress={() => editor.chain().focus().redo().run()}
        />
        <EditorToolbarButton
          icon={RemoveFormatting}
          label="Clear formatting"
          onPress={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        />
      </div>
      <EditorContent className="task-rich-text__content" editor={editor} />
      <div
        className="task-rich-text__footer"
        data-over-limit={characterCount > maxLength || undefined}
      >
        <span>Markdown shortcuts and checklists are supported</span>
        <span>
          {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function EditorToolbarButton({
  active = false,
  disabled = false,
  icon: Icon,
  label,
  onPress,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className="task-rich-text__toolbar-button"
      disabled={disabled}
      onClick={onPress}
      onMouseDown={(event) => event.preventDefault()}
      title={label}
      type="button"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function richDocumentFromText(text: string): TaskRichDocument {
  const lines = text ? text.split(/\r?\n/) : [""];
  return {
    content: lines.map((line) => ({
      content: line ? [{ text: line, type: "text" }] : undefined,
      type: "paragraph",
    })),
    type: "doc",
  };
}
