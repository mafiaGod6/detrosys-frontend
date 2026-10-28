import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bold,
  Eraser,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

/**
 * A dependency-free rich text editor built on contentEditable +
 * document.execCommand. Stores content as an HTML string (passed via
 * onChange), which is exactly what you'd feed into createTemplate the
 * same way plain text was used before.
 *
 * Note: document.execCommand is deprecated in the web spec, but it's
 * still supported by every major browser and is the simplest way to
 * get real bold/italic/list formatting without adding a library like
 * Quill or Tiptap. If you later want more advanced formatting (tables,
 * images, custom blocks), swapping in a dedicated library will be an
 * easier upgrade than building all of that manually here.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = 220,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync the initial value into the editable area once. We
  // deliberately don't keep re-syncing on every value change, since
  // that would move the cursor while the user is actively typing.
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleLink = () => {
    const url = window.prompt("Enter a URL");

    if (url) {
      exec("createLink", url);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-300 bg-[#faf9f6] focus-within:border-neutral-950 focus-within:ring-2 focus-within:ring-neutral-950/10 dark:border-white/15 dark:bg-[#101010] dark:focus-within:border-white dark:focus-within:ring-white/10">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-white/60 px-2 py-1.5 dark:border-white/10 dark:bg-white/[0.02]">
        <ToolbarButton
          icon={Bold}
          label="Bold"
          onClick={() => exec("bold")}
        />

        <ToolbarButton
          icon={Italic}
          label="Italic"
          onClick={() => exec("italic")}
        />

        <ToolbarButton
          icon={Underline}
          label="Underline"
          onClick={() => exec("underline")}
        />

        <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-white/10" />

        <ToolbarButton
          icon={List}
          label="Bullet list"
          onClick={() => exec("insertUnorderedList")}
        />

        <ToolbarButton
          icon={ListOrdered}
          label="Numbered list"
          onClick={() => exec("insertOrderedList")}
        />

        <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-white/10" />

        <ToolbarButton
          icon={LinkIcon}
          label="Insert link"
          onClick={handleLink}
        />

        <ToolbarButton
          icon={Eraser}
          label="Clear formatting"
          onClick={() => exec("removeFormat")}
        />
      </div>

      {/* EDITABLE AREA */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="
          px-4 py-3 text-sm leading-6 text-neutral-950 outline-none
          empty:before:pointer-events-none
          empty:before:text-neutral-400
          empty:before:content-[attr(data-placeholder)]
          dark:text-white
          dark:empty:before:text-neutral-600
        "
      />
    </div>
  );
}

/**
 * Returns true if the given HTML string has no visible text content
 * (e.g. an empty editor still contains "<br>" or "<p></p>"). Use this
 * instead of `.trim().length === 0` for validating rich text values.
 */
export function isRichTextEmpty(html: string): boolean {
  const container = document.createElement("div");
  container.innerHTML = html;
  return (container.textContent ?? "").trim().length === 0;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      // Prevent the toolbar button from stealing focus away from the
      // editable area before the command runs.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <Icon size={15} strokeWidth={1.9} />
    </button>
  );
}
