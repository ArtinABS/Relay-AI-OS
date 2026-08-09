"use client";

import {
  SimpleEditor,
  type SimpleEditorDocument,
} from "@/components/tiptap-templates/simple/simple-editor";

export type RichTextDocument = SimpleEditorDocument;
export type TaskRichDocument = RichTextDocument;

type RichTextEditorProps = {
  ariaLabel?: string;
  autoFocus?: boolean;
  className?: string;
  defaultValue?: RichTextDocument | null;
  fallbackText?: string;
  maxLength?: number;
  onChange?: (document: RichTextDocument, plainText: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  value?: string;
};

export function RichTextEditor({
  ariaLabel,
  autoFocus,
  className,
  defaultValue,
  fallbackText = "",
  maxLength,
  onChange,
  placeholder,
  readOnly = false,
  value,
}: RichTextEditorProps) {
  return (
    <SimpleEditor
      ariaLabel={ariaLabel}
      autoFocus={autoFocus}
      className={className}
      editable={!readOnly}
      initialContent={
        defaultValue ?? richDocumentFromText(value ?? fallbackText)
      }
      maxLength={maxLength}
      onChange={(document, plainText) => onChange?.(document, plainText)}
      placeholder={placeholder}
      value={value}
    />
  );
}

export const TaskRichTextEditor = RichTextEditor;

function richDocumentFromText(text: string): RichTextDocument {
  const lines = text ? text.split(/\r?\n/) : [""];
  return {
    content: lines.map((line) => ({
      content: line ? [{ text: line, type: "text" }] : undefined,
      type: "paragraph",
    })),
    type: "doc",
  };
}
