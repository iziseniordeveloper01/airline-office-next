'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { Iframe } from './tiptapIframe'
import type { EditorView } from '@tiptap/pm/view'

import {
  Bold, Italic, Underline as UIcon, Strikethrough,
  List, ListOrdered, Quote, Link as LinkIcon, ImageIcon,
  Table as TableIcon, Undo, Redo, Heading2, Heading3, Heading4, Code2, Frame,
} from 'lucide-react'
import { uploadImage } from '@/app/admin/upload/actions'

interface PostEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

// Hoisted to module scope — defining these inside PostEditor recreated them on
// every render, remounting the whole toolbar and fighting the React Compiler.
function ToolbarButton({ onClick, active = false, disabled = false, title, children }: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      className={`p-1.5 rounded transition-colors disabled:opacity-30
        ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
      {children}
    </button>
  )
}

function ToolbarSeparator() {
  return <span className="w-px h-4 bg-gray-300 mx-1" />
}

export default function PostEditor({ value, onChange, placeholder }: PostEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      TiptapImage.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full' } }),
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
      Iframe,
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing…' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'prose-content max-w-none p-4 min-h-[420px] focus:outline-none' },
      handleDrop(view, event, _slice, moved) {
        const file = event.dataTransfer?.files?.[0]
        if (!moved && file?.type.startsWith('image/')) {
          event.preventDefault()
          handleFileInsert(file, view, event)
          return true
        }
        return false
      },
      handlePaste(view, event) {
        const item = [...(event.clipboardData?.items ?? [])].find(i => i.type.startsWith('image/'))
        const file = item?.getAsFile()
        if (file) { event.preventDefault(); handleFileInsert(file, view); return true }
        return false
      },
    },
  })

  async function handleFileInsert(file: File, view: EditorView, event?: DragEvent) {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { url } = await uploadImage(fd)
      const pos = event
        ? view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.from
        : view.state.selection.from
      const node = view.state.schema.nodes.image.create({ src: url })
      view.dispatch(view.state.tr.insert(pos, node))
    } catch {
      alert('Image upload failed. Please try again.')
    }
  }

  if (!editor) return null

  const insertLink = () => {
    const url = window.prompt('Link URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const insertImage = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return
      try {
        const fd = new FormData(); fd.append('file', file)
        const { url } = await uploadImage(fd)
        editor.chain().focus().setImage({ src: url }).run()
      } catch {
        alert('Image upload failed. Please try again.')
      }
    }
    input.click()
  }

  const insertEmbed = () => {
    const url = window.prompt('Embed URL (Google Maps, YouTube, etc. — must start with https://):')
    if (!url) return
    if (!url.startsWith('https://')) { alert('Embed URL must start with https://'); return }
    editor.chain().focus().insertContent({ type: 'iframe', attrs: { src: url } }).run()
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <ToolbarButton title="H2" active={editor.isActive('heading',{level:2})} onClick={() => editor.chain().focus().toggleHeading({level:2}).run()}><Heading2 size={15}/></ToolbarButton>
        <ToolbarButton title="H3" active={editor.isActive('heading',{level:3})} onClick={() => editor.chain().focus().toggleHeading({level:3}).run()}><Heading3 size={15}/></ToolbarButton>
        <ToolbarButton title="H4" active={editor.isActive('heading',{level:4})} onClick={() => editor.chain().focus().toggleHeading({level:4}).run()}><Heading4 size={15}/></ToolbarButton>
        <ToolbarSeparator/>
        <ToolbarButton title="Bold"          active={editor.isActive('bold')}      onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15}/></ToolbarButton>
        <ToolbarButton title="Italic"        active={editor.isActive('italic')}    onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15}/></ToolbarButton>
        <ToolbarButton title="Underline"     active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UIcon size={15}/></ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')}    onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={15}/></ToolbarButton>
        <ToolbarSeparator/>
        <ToolbarButton title="Bullet List"  active={editor.isActive('bulletList')}  onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={15}/></ToolbarButton>
        <ToolbarButton title="Ordered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15}/></ToolbarButton>
        <ToolbarButton title="Blockquote"   active={editor.isActive('blockquote')}  onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={15}/></ToolbarButton>
        <ToolbarButton title="Code Block"   active={editor.isActive('codeBlock')}   onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 size={15}/></ToolbarButton>
        <ToolbarSeparator/>
        <ToolbarButton title="Insert Link"  active={editor.isActive('link')} onClick={insertLink}><LinkIcon size={15}/></ToolbarButton>
        <ToolbarButton title="Insert Image" onClick={insertImage}><ImageIcon size={15}/></ToolbarButton>
        <ToolbarButton title="Insert Table" onClick={() => editor.chain().focus().insertTable({rows:3,cols:2,withHeaderRow:true}).run()}><TableIcon size={15}/></ToolbarButton>
        <ToolbarButton title="Insert Embed (map, video, etc.)" onClick={insertEmbed}><Frame size={15}/></ToolbarButton>
        <ToolbarSeparator/>
        <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo size={15}/></ToolbarButton>
        <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo size={15}/></ToolbarButton>
      </div>
      <EditorContent editor={editor}/>
    </div>
  )
}
