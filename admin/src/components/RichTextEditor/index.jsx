import { Color } from "@tiptap/extension-color"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import Underline from "@tiptap/extension-underline"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { memo, useEffect, useMemo, useRef } from "react"

const EMPTY_HTML = new Set(["", "<p></p>", "<p><br></p>"])

const normalizeHtml = (html) => {
    const t = (html || "").trim()
    if (EMPTY_HTML.has(t)) return ""
    return t
}

/** True when HTML has visible text (for react-hook-form validate — must return boolean, not string). */
export const hasRichTextContent = (html) => {
    const raw = String(html || "").trim()
    if (!raw || EMPTY_HTML.has(raw)) return false
    const text = raw.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim()
    return text.length > 0
}

const safeGetHtml = (editor) => {
    if (!editor || editor.isDestroyed) return ""
    try {
        return editor.getHTML()
    } catch {
        return ""
    }
}

const htmlForForm = (editor) => normalizeHtml(safeGetHtml(editor))

const applyEditorContent = (editor, html, skipUpdateRef) => {
    if (!editor || editor.isDestroyed) return
    skipUpdateRef.current = true
    try {
        const next = normalizeHtml(html) || "<p></p>"
        editor.commands.setContent(next, false)
    } catch {
        // Editor not ready
    } finally {
        skipUpdateRef.current = false
    }
}

const ToolbarButton = ({ active, onClick, title, children }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        className={`px-2 py-1 text-xs font-medium rounded border cursor-pointer transition-colors ${
            active
                ? "bg-primary text-white border-primary"
                : "bg-white text-secondary border-gray-300 hover:bg-primary/10"
        }`}
    >
        {children}
    </button>
)

const MenuBar = ({ editor }) => {
    if (!editor || editor.isDestroyed) return null

    const setLink = () => {
        const prev = editor.getAttributes("link").href
        const url = window.prompt("Enter URL", prev || "https://")
        if (url === null) return
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }

    const colors = [
        "#000000",
        "#0118FF",
        "#DC2626",
        "#16A34A",
        "#CA8A04",
        "#9333EA",
    ]

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
            <ToolbarButton
                title="Bold"
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
            >
                B
            </ToolbarButton>
            <ToolbarButton
                title="Italic"
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            >
                I
            </ToolbarButton>
            <ToolbarButton
                title="Underline"
                active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
                U
            </ToolbarButton>
            <ToolbarButton
                title="Strike"
                active={editor.isActive("strike")}
                onClick={() => editor.chain().focus().toggleStrike().run()}
            >
                S
            </ToolbarButton>
            <span className="w-px h-6 bg-gray-300 self-center mx-1" />
            <ToolbarButton
                title="Heading 2"
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
                H2
            </ToolbarButton>
            <ToolbarButton
                title="Heading 3"
                active={editor.isActive("heading", { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
                H3
            </ToolbarButton>
            <span className="w-px h-6 bg-gray-300 self-center mx-1" />
            <ToolbarButton
                title="Bullet list"
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
                • List
            </ToolbarButton>
            <ToolbarButton
                title="Numbered list"
                active={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
                1. List
            </ToolbarButton>
            <ToolbarButton
                title="Align left"
                active={editor.isActive({ textAlign: "left" })}
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
            >
                Left
            </ToolbarButton>
            <ToolbarButton
                title="Align center"
                active={editor.isActive({ textAlign: "center" })}
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
            >
                Center
            </ToolbarButton>
            <ToolbarButton
                title="Align right"
                active={editor.isActive({ textAlign: "right" })}
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
            >
                Right
            </ToolbarButton>
            <span className="w-px h-6 bg-gray-300 self-center mx-1" />
            {colors.map((color) => (
                <button
                    key={color}
                    type="button"
                    title={`Text color ${color}`}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                    style={{ backgroundColor: color }}
                />
            ))}
            <input
                type="color"
                title="Custom text color"
                className="w-8 h-7 cursor-pointer border border-gray-300 rounded"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
            <span className="w-px h-6 bg-gray-300 self-center mx-1" />
            <ToolbarButton title="Link" onClick={setLink}>
                Link
            </ToolbarButton>
            <ToolbarButton
                title="Blockquote"
                active={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
                Quote
            </ToolbarButton>
            <ToolbarButton
                title="Clear formatting"
                onClick={() =>
                    editor.chain().focus().clearNodes().unsetAllMarks().run()
                }
            >
                Clear
            </ToolbarButton>
        </div>
    )
}

const RichTextEditor = ({
    label,
    required,
    value,
    onChange,
    onBlur,
    error,
    placeholder,
    initialHtml,
}) => {
    const skipUpdate = useRef(false)
    const appliedHtml = useRef(null)

    const extensions = useMemo(
        () => [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            Link.configure({ openOnClick: false }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
        ],
        []
    )

    const seedHtml = useMemo(
        () => normalizeHtml(initialHtml ?? value) || "",
        [initialHtml]
    )

    const editor = useEditor({
        extensions,
        content: seedHtml || "<p></p>",
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "tiptap-editor__content",
                "data-placeholder": placeholder || "Write service description…",
            },
        },
        onCreate: ({ editor: ed }) => {
            applyEditorContent(ed, seedHtml || value, skipUpdate)
            appliedHtml.current = seedHtml
            const html = htmlForForm(ed)
            if (html) onChange?.(html)
        },
        onUpdate: ({ editor: ed }) => {
            if (skipUpdate.current || ed.isDestroyed) return
            onChange?.(htmlForForm(ed))
        },
    })

    // Prefill when edit data arrives (only when initialHtml changes, not on each keystroke)
    useEffect(() => {
        if (!editor || editor.isDestroyed) return
        if (appliedHtml.current === seedHtml) return
        appliedHtml.current = seedHtml
        applyEditorContent(editor, seedHtml, skipUpdate)
        const html = htmlForForm(editor)
        if (html) onChange?.(html)
    }, [editor, seedHtml, onChange])

    useEffect(() => {
        if (!editor || editor.isDestroyed) return
        const syncOnBlur = () => {
            if (skipUpdate.current) return
            onChange?.(htmlForForm(editor))
            onBlur?.()
        }
        editor.on("blur", syncOnBlur)
        return () => {
            editor.off("blur", syncOnBlur)
        }
    }, [editor, onChange, onBlur])

    return (
        <div className="rich-text-editor">
            {label ? (
                <label className="text-sm font-medium text-secondary">
                    {label}{" "}
                    {required ? <span className="text-red-500">*</span> : null}
                </label>
            ) : null}
            <div className="mt-2 rounded-md border border-gray-300 overflow-hidden bg-white">
                <MenuBar editor={editor} />
                <EditorContent editor={editor} />
            </div>
            {error ? (
                <p className="text-red-500 mt-1 text-sm px-1">{error}</p>
            ) : null}
        </div>
    )
}

export default memo(RichTextEditor)
