import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

import Button from "../Button/Button";
import { useTranslation } from "../../hooks/useTranslation";

import "./TextEditor.scss";

import {
  BoldRusIcon,
  BoldEngIcon,
  ItalicRusIcon,
  ItalicEngIcon,
  UnderlineEngIcon,
  UnderlineRusIcon,
  ListBulletIcon,
  LinkIcon,
} from "@icons";

interface TextEditorProps {
  onContentChange: (html: string) => void;
  initialContent?: string;
}

export default function TextEditor({
  onContentChange,
  initialContent = "",
}: TextEditorProps) {
  const { t, language } = useTranslation();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Placeholder.configure({
        placeholder: t("body_placeholder"),
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("Enter URL");
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      <EditorContent editor={editor} className="tiptap-wrapper" />

      {/* Toolbar */}
      <div className="w-fit shrink-0 flex flex-row gap-0.5 p-2 py-1 bg-button-background-second rounded-[20px]">
        <Button
          icon={language === "ru" ? BoldRusIcon : BoldEngIcon}
          iconSize="24"
          className="bg-transparent hover:bg-transparent h-auto p-2 text-slate-700"
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <Button
          icon={language === "ru" ? ItalicRusIcon : ItalicEngIcon}
          className="bg-transparent hover:bg-transparent h-auto p-2 text-slate-700"
          iconSize="24"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{ fontStyle: editor.isActive("italic") ? "italic" : "normal" }}
        ></Button>
        <Button
          icon={language === "ru" ? UnderlineRusIcon : UnderlineEngIcon}
          iconSize="24"
          className="bg-transparent hover:bg-transparent h-auto p-2 text-slate-700"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <Button
          icon={ListBulletIcon}
          iconSize="24"
          className="bg-transparent hover:bg-transparent h-auto p-2 text-slate-700"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <Button
          icon={LinkIcon}
          iconSize="24"
          className="bg-transparent hover:bg-transparent h-auto p-2 text-slate-700"
          onClick={addLink}
        />
      </div>
    </div>
  );
}
