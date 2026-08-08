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
        autolink: true,
        defaultProtocol: "https",
        protocols: ["http", "https"],
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        isAllowedUri: (url, ctx) => {
          try {
            const parsedUrl = url.includes(":")
              ? new URL(url)
              : new URL(`${ctx.defaultProtocol}://${url}`);

            if (!ctx.defaultValidate(parsedUrl.href)) {
              return false;
            }

            const disallowedProtocols = ["ftp", "file", "mailto"];
            const protocol = parsedUrl.protocol.replace(":", "");

            if (disallowedProtocols.includes(protocol)) {
              return false;
            }

            const allowedProtocols = ctx.protocols.map((p) =>
              typeof p === "string" ? p : p.scheme,
            );

            if (!allowedProtocols.includes(protocol)) {
              return false;
            }

            // const disallowedDomains = [
            //   "example-phishing.com",
            //   "malicious-site.net",
            // ];
            // const domain = parsedUrl.hostname;

            // if (disallowedDomains.includes(domain)) {
            //   return false;
            // }

            return true;
          } catch {
            return false;
          }
        },
        shouldAutoLink: (url) => {
          try {
            // construct URL
            const parsedUrl = url.includes(":")
              ? new URL(url)
              : new URL(`https://${url}`);

            const disallowedDomains: string[] = [];
            const domain = parsedUrl.hostname;

            return !disallowedDomains.includes(domain);
          } catch {
            return false;
          }
        },
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
