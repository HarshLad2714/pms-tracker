import { useCallback, useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import DOMPurify from 'isomorphic-dompurify';
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import api from '../api/client';

const ALLOWED = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'h1', 'h2', 'h3', 'h4',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'colgroup', 'col', 'hr', 'code', 'pre', 'span',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'colspan', 'rowspan', 'class'],
};

export function sanitizeHtml(html = '') {
  return DOMPurify.sanitize(html, ALLOWED);
}

export function toEditorHtml(value = '') {
  if (!value) return '';
  if (/<[a-z][\s\S]*>/i.test(value)) return sanitizeHtml(value);
  return `<p>${value.replace(/\n/g, '<br>')}</p>`;
}

export function isEmptyHtml(html = '') {
  const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  return !text && !/<img|<table/i.test(html);
}

async function uploadImage(file) {
  const fd = new FormData();
  fd.append('files', file);
  const { data } = await api.post('/uploads', fd);
  return data.files?.[0]?.url;
}

function ToolBtn({ active, disabled, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg text-xs ${
        active ? 'bg-copper-500 text-ink-950' : 'text-paper-200/70 hover:bg-ink-700 hover:text-paper-50'
      } disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

export default function RichEditor({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Write the requirement — headings, bullets, tables, images…',
  minHeight = '16rem',
}) {
  const fileRef = useRef(null);
  const editorRef = useRef(null);
  const lastEmitted = useRef(toEditorHtml(value));

  const insertUploaded = useCallback(async (files) => {
    const images = [...files].filter((f) => f.type.startsWith('image/'));
    const editor = editorRef.current;
    if (!editor || !images.length) return;
    for (const file of images) {
      const src = await uploadImage(file);
      if (src) editor.chain().focus().setImage({ src }).run();
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: toEditorHtml(value),
    editorProps: {
      attributes: { class: 'rich-doc outline-none' },
      handlePaste(_view, event) {
        const files = event.clipboardData?.files;
        if (files?.length && [...files].some((f) => f.type.startsWith('image/'))) {
          event.preventDefault();
          insertUploaded(files);
          return true;
        }
        return false;
      },
      handleDrop(_view, event, _slice, moved) {
        if (moved) return false;
        const files = event.dataTransfer?.files;
        if (files?.length && [...files].some((f) => f.type.startsWith('image/'))) {
          event.preventDefault();
          insertUploaded(files);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: next }) => {
      const html = sanitizeHtml(next.getHTML());
      lastEmitted.current = html;
      onChange?.(html);
    },
  });

  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    const incoming = toEditorHtml(value);
    if (incoming === lastEmitted.current) return;
    lastEmitted.current = incoming;
    editor.commands.setContent(incoming, false);
  }, [value, editor]);

  if (!editor) return <div className="field min-h-32 animate-pulse" />;

  function setLink() {
    const prev = editor.getAttributes('link').href || '';
    const href = window.prompt('Link URL', prev);
    if (href === null) return;
    if (!href) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  return (
    <div
      className="overflow-hidden rounded-xl border border-ink-600 bg-ink-900 focus-within:border-copper-500"
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        onBlur?.(sanitizeHtml(editor.getHTML()));
      }}
    >
      <div className="flex flex-wrap gap-1 border-b border-ink-600 p-2">
        <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={14} />
        </ToolBtn>
        <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={14} />
        </ToolBtn>
        <span className="mx-1 w-px self-stretch bg-ink-600" />
        <ToolBtn title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={14} />
        </ToolBtn>
        <ToolBtn title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={14} />
        </ToolBtn>
        <ToolBtn title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={14} />
        </ToolBtn>
        <span className="mx-1 w-px self-stretch bg-ink-600" />
        <ToolBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={14} />
        </ToolBtn>
        <ToolBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={14} />
        </ToolBtn>
        <ToolBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={14} />
        </ToolBtn>
        <ToolBtn title="Strike" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={14} />
        </ToolBtn>
        <span className="mx-1 w-px self-stretch bg-ink-600" />
        <ToolBtn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={14} />
        </ToolBtn>
        <ToolBtn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={14} />
        </ToolBtn>
        <ToolBtn title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={14} />
        </ToolBtn>
        <ToolBtn title="Link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 size={14} />
        </ToolBtn>
        <span className="mx-1 w-px self-stretch bg-ink-600" />
        <ToolBtn title="Insert image" onClick={() => fileRef.current?.click()}>
          <ImagePlus size={14} />
        </ToolBtn>
        <ToolBtn title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Table2 size={14} />
        </ToolBtn>
        {editor.isActive('table') && (
          <>
            <ToolBtn title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <Plus size={14} />
            </ToolBtn>
            <ToolBtn title="Remove column" onClick={() => editor.chain().focus().deleteColumn().run()}>
              <Minus size={14} />
            </ToolBtn>
            <ToolBtn title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
              <span className="text-[10px]">+R</span>
            </ToolBtn>
            <ToolBtn title="Remove row" onClick={() => editor.chain().focus().deleteRow().run()}>
              <span className="text-[10px]">−R</span>
            </ToolBtn>
          </>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (e.target.files?.length) insertUploaded(e.target.files);
          e.target.value = '';
        }}
      />
      <div style={{ minHeight }} className="px-3 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
