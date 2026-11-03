'use client'

import { Mark, mergeAttributes } from '@tiptap/core'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import UnderlineExtension from '@tiptap/extension-underline'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Unlink,
  Maximize2,
  Minimize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Underline as UnderlineIcon,
  Palette,
  Highlighter,
  RemoveFormatting,
  Minus,
  ChevronDown,
} from 'lucide-react'
import { useLocale } from 'next-intl'
import { useCallback, useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/error-handler'
import { cn } from '@/lib/utils'

// ============================================================================
// Custom Tiptap Mark for Font Size, Font Weight, Text Color & Highlight Color
// ============================================================================

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textStyleExtended: {
      setFontSize: (fontSize: string) => ReturnType
      unsetFontSize: () => ReturnType
      setFontWeight: (fontWeight: string) => ReturnType
      unsetFontWeight: () => ReturnType
      setTextColor: (color: string) => ReturnType
      unsetTextColor: () => ReturnType
      setHighlightColor: (color: string) => ReturnType
      unsetHighlightColor: () => ReturnType
      clearCustomFormatting: () => ReturnType
    }
  }
}

export const TextStyleExtended = Mark.create({
  name: 'textStyleExtended',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {}
          return { style: `font-size: ${attributes.fontSize}` }
        },
      },
      fontWeight: {
        default: null,
        parseHTML: (element) => element.style.fontWeight || null,
        renderHTML: (attributes) => {
          if (!attributes.fontWeight) return {}
          return { style: `font-weight: ${attributes.fontWeight}` }
        },
      },
      color: {
        default: null,
        parseHTML: (element) => element.style.color || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {}
          return { style: `color: ${attributes.color}` }
        },
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {}
          return { style: `background-color: ${attributes.backgroundColor}` }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[style]',
        getAttrs: (element) => {
          const el = element as HTMLElement
          const hasStyle =
            el.style.fontSize ||
            el.style.fontWeight ||
            el.style.color ||
            el.style.backgroundColor
          return hasStyle ? {} : false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark(this.name, { fontSize }).run()
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark(this.name, { fontSize: null }).run()
        },
      setFontWeight:
        (fontWeight: string) =>
        ({ chain }) => {
          return chain().setMark(this.name, { fontWeight }).run()
        },
      unsetFontWeight:
        () =>
        ({ chain }) => {
          return chain().setMark(this.name, { fontWeight: null }).run()
        },
      setTextColor:
        (color: string) =>
        ({ chain }) => {
          return chain().setMark(this.name, { color }).run()
        },
      unsetTextColor:
        () =>
        ({ chain }) => {
          return chain().setMark(this.name, { color: null }).run()
        },
      setHighlightColor:
        (color: string) =>
        ({ chain }) => {
          return chain().setMark(this.name, { backgroundColor: color }).run()
        },
      unsetHighlightColor:
        () =>
        ({ chain }) => {
          return chain().setMark(this.name, { backgroundColor: null }).run()
        },
      clearCustomFormatting:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).unsetAllMarks().clearNodes().run()
        },
    }
  },
})

// ============================================================================
// Color Presets & Font Presets
// ============================================================================

const FONT_SIZES = [
  { label: '12px (Nhỏ)', value: '12px', numeric: 12 },
  { label: '14px (Chuẩn)', value: '14px', numeric: 14 },
  { label: '16px (Vừa)', value: '16px', numeric: 16 },
  { label: '18px (Lớn)', value: '18px', numeric: 18 },
  { label: '20px (Tiêu đề nhỏ)', value: '20px', numeric: 20 },
  { label: '24px (Tiêu đề)', value: '24px', numeric: 24 },
  { label: '28px (Tiêu đề lớn)', value: '28px', numeric: 28 },
  { label: '32px (Rất lớn)', value: '32px', numeric: 32 },
]

const FONT_WEIGHTS = [
  { label: '300 (Mảnh / Light)', value: '300' },
  { label: '400 (Bình thường / Regular)', value: '400' },
  { label: '500 (Vừa / Medium)', value: '500' },
  { label: '600 (Hơi đậm / SemiBold)', value: '600' },
  { label: '700 (Đậm / Bold)', value: '700' },
  { label: '800 (Rất đậm / ExtraBold)', value: '800' },
]

const TEXT_COLORS = [
  { label: 'Đen', value: '#000000', bg: '#000000' },
  { label: 'Nâu gốm ƯƠM', value: '#4A4238', bg: '#4A4238' },
  { label: 'Nâu men tro', value: '#8C7E6A', bg: '#8C7E6A' },
  { label: 'Xám đậm', value: '#374151', bg: '#374151' },
  { label: 'Xám tro', value: '#6B7280', bg: '#6B7280' },
  { label: 'Đỏ gạch', value: '#991B1B', bg: '#991B1B' },
  { label: 'Xanh chàm', value: '#1E3A8A', bg: '#1E3A8A' },
  { label: 'Xanh rêu', value: '#166534', bg: '#166534' },
]

const HIGHLIGHT_COLORS = [
  { label: 'Bỏ tô màu', value: '', bg: '#FFFFFF', border: true },
  { label: 'Cát mộc', value: '#F5EBE1', bg: '#F5EBE1' },
  { label: 'Vàng nhạt', value: '#FEF08A', bg: '#FEF08A' },
  { label: 'Xanh ngọc nhạt', value: '#DCFCE7', bg: '#DCFCE7' },
  { label: 'Xanh dương nhạt', value: '#E0F2FE', bg: '#E0F2FE' },
  { label: 'Hồng phấn', value: '#FEE2E2', bg: '#FEE2E2' },
]

// ============================================================================
// Component Implementation
// ============================================================================

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Nhập nội dung mô tả...',
  className,
  disabled = false,
}: RichTextEditorProps) {
  const locale = useLocale()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [textColorOpen, setTextColorOpen] = useState(false)
  const [highlightOpen, setHighlightOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMaximized])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyleExtended,
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'rounded-sm max-w-full h-auto my-4 shadow-sm',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#4A4238] underline cursor-pointer hover:text-[#8C7E6A]',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      UnderlineExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return

    const incoming = content || ''
    const current = editor.getHTML()

    if (incoming !== current) {
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
  }, [content, editor])

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return

      setIsUploading(true)
      try {
        const result = await api.uploadImage(file)
        editor.chain().focus().setImage({ src: result.url }).run()
        toast({
          title: locale === 'vi' ? 'Thành công' : 'Success',
          description: locale === 'vi' ? 'Tải ảnh lên thành công' : 'Image uploaded successfully',
        })
      } catch (error) {
        console.error('Image upload failed:', error)
        toast({
          title: locale === 'vi' ? 'Lỗi' : 'Error',
          description: getApiErrorMessage(
            error,
            locale,
            locale === 'vi' ? 'Tải ảnh lên thất bại' : 'Failed to upload image',
          ),
          variant: 'destructive',
        })
      } finally {
        setIsUploading(false)
      }
    },
    [editor, locale, toast],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleImageUpload(file)
      }
      e.target.value = ''
    },
    [handleImageUpload],
  )

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Nhập đường dẫn liên kết:', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const currentAttrs = editor?.getAttributes('textStyleExtended') || {}
  const currentFontSize = currentAttrs.fontSize || '14px'
  const currentFontWeight = currentAttrs.fontWeight || '400'

  const changeFontSizeStep = (delta: number) => {
    if (!editor) return
    const currentNum = parseInt(currentFontSize, 10) || 14
    const newNum = Math.min(48, Math.max(10, currentNum + delta))
    editor.chain().focus().setFontSize(`${newNum}px`).run()
  }

  if (!editor) {
    return null
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled: btnDisabled = false,
    children,
    title,
    className: btnClassName,
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
    title?: string
    className?: string
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      disabled={btnDisabled || disabled}
      className={cn('h-8 w-8 p-0 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900', isActive && 'bg-neutral-200 text-neutral-950 font-semibold', btnClassName)}
      title={title}
    >
      {children}
    </Button>
  )

  return (
    <div
      className={cn(
        'flex flex-col rounded-md border border-neutral-300 bg-background transition-all duration-200 shadow-xs',
        className,
        isMaximized &&
          'fixed inset-0 z-[100] h-screen w-screen rounded-none border-none bg-stone-100/95 p-4 backdrop-blur-sm',
      )}
    >
      {/* Word-like Professional Toolbar */}
      <div
        className={cn(
          'sticky top-0 z-10 flex w-full flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50/90 p-1.5 text-xs',
          isMaximized &&
            'mx-auto w-full max-w-5xl rounded-t-md border border-neutral-300 bg-white shadow-sm',
        )}
      >
        {/* 1. Font Size Dropdown & Quick A+ / A- */}
        <div className="flex items-center gap-0.5 bg-white border border-neutral-200 rounded px-1 py-0.5">
          <select
            value={currentFontSize}
            onChange={(e) => {
              const val = e.target.value
              if (val) {
                editor.chain().focus().setFontSize(val).run()
              } else {
                editor.chain().focus().unsetFontSize().run()
              }
            }}
            className="h-7 text-xs bg-transparent border-none text-neutral-800 font-medium focus:outline-none cursor-pointer pr-1"
            title="Cỡ chữ (Font Size)"
          >
            {FONT_SIZES.map((sz) => (
              <option key={sz.value} value={sz.value}>
                {sz.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => changeFontSizeStep(2)}
            className="px-1.5 h-6 text-xs font-semibold hover:bg-neutral-100 rounded text-neutral-700"
            title="Tăng cỡ chữ (A+)"
          >
            A+
          </button>
          <button
            type="button"
            onClick={() => changeFontSizeStep(-2)}
            className="px-1.5 h-6 text-xs font-semibold hover:bg-neutral-100 rounded text-neutral-700"
            title="Giảm cỡ chữ (A-)"
          >
            A-
          </button>
        </div>

        {/* 2. Font Weight Dropdown */}
        <div className="flex items-center bg-white border border-neutral-200 rounded px-1 py-0.5">
          <select
            value={currentFontWeight}
            onChange={(e) => {
              const val = e.target.value
              if (val) {
                editor.chain().focus().setFontWeight(val).run()
              } else {
                editor.chain().focus().unsetFontWeight().run()
              }
            }}
            className="h-7 text-xs bg-transparent border-none text-neutral-800 font-medium focus:outline-none cursor-pointer pr-1"
            title="Độ đậm chữ (Font Weight)"
          >
            {FONT_WEIGHTS.map((wt) => (
              <option key={wt.value} value={wt.value}>
                {wt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mx-1 h-5 w-px bg-neutral-300" />

        {/* 3. Basic Formatting: Bold, Italic, Underline, Strikethrough */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="In đậm (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Gạch ngang chữ"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-neutral-300" />

        {/* 4. Text Color Popover */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setTextColorOpen(!textColorOpen)
              setHighlightOpen(false)
            }}
            className={cn('h-8 px-1.5 flex items-center gap-1 text-neutral-700 hover:bg-neutral-100', textColorOpen && 'bg-neutral-200')}
            title="Màu chữ"
          >
            <Palette className="h-4 w-4" />
            <div
              className="w-3 h-3 rounded-full border border-neutral-300"
              style={{ backgroundColor: currentAttrs.color || '#000000' }}
            />
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>

          {textColorOpen && (
            <div className="absolute top-9 left-0 z-30 w-44 bg-white border border-neutral-200 p-2 shadow-lg rounded space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Màu chữ
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {TEXT_COLORS.map((col) => (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setTextColor(col.value).run()
                      setTextColorOpen(false)
                    }}
                    className="w-8 h-8 rounded border border-neutral-200 hover:scale-110 transition-transform flex items-center justify-center cursor-pointer shadow-2xs"
                    style={{ backgroundColor: col.bg }}
                    title={col.label}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetTextColor().run()
                  setTextColorOpen(false)
                }}
                className="w-full text-center text-[11px] text-neutral-600 hover:text-black hover:bg-neutral-100 py-1 rounded"
              >
                Mặc định (Đen)
              </button>
            </div>
          )}
        </div>

        {/* 5. Highlight Color Popover */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setHighlightOpen(!highlightOpen)
              setTextColorOpen(false)
            }}
            className={cn('h-8 px-1.5 flex items-center gap-1 text-neutral-700 hover:bg-neutral-100', highlightOpen && 'bg-neutral-200')}
            title="Màu nền chữ (Highlight)"
          >
            <Highlighter className="h-4 w-4" />
            <div
              className="w-3 h-3 rounded-full border border-neutral-300"
              style={{ backgroundColor: currentAttrs.backgroundColor || 'transparent' }}
            />
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>

          {highlightOpen && (
            <div className="absolute top-9 left-0 z-30 w-44 bg-white border border-neutral-200 p-2 shadow-lg rounded space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Màu nền highlight
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {HIGHLIGHT_COLORS.map((col) => (
                  <button
                    key={col.value || 'none'}
                    type="button"
                    onClick={() => {
                      if (col.value) {
                        editor.chain().focus().setHighlightColor(col.value).run()
                      } else {
                        editor.chain().focus().unsetHighlightColor().run()
                      }
                      setHighlightOpen(false)
                    }}
                    className="w-10 h-7 rounded border border-neutral-300 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer shadow-2xs text-[10px]"
                    style={{ backgroundColor: col.bg }}
                    title={col.label}
                  >
                    {!col.value && 'None'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6. Clear Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().clearCustomFormatting().run()}
          title="Xóa định dạng chữ"
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-neutral-300" />

        {/* 7. Alignments */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Căn trái"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Căn giữa"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Căn phải"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Căn đều 2 bên"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-neutral-300" />

        {/* 8. Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Tiêu đề 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Tiêu đề 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Tiêu đề 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-neutral-300" />

        {/* 9. Lists, Quote & Divider */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Danh sách dấu chấm"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Danh sách số"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Trích dẫn"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Đường kẻ ngang phân cách"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-neutral-300" />

        {/* 10. Links & Images */}
        <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Chèn liên kết">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        {editor.isActive('link') && (
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Gỡ liên kết"
          >
            <Unlink className="h-4 w-4" />
          </ToolbarButton>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Tải ảnh lên"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-neutral-300" />

        {/* 11. Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Làm lại (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <div className="flex-1" />

        {/* 12. Maximize / Fullscreen */}
        <ToolbarButton
          onClick={() => setIsMaximized(!isMaximized)}
          isActive={isMaximized}
          title={isMaximized ? 'Thu nhỏ' : 'Toàn màn hình'}
        >
          {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-stone min-h-[160px] w-full max-w-none flex-1 overflow-y-auto p-4 font-serif text-sm leading-relaxed text-black transition-all duration-300 focus:outline-none',
          '[&_.ProseMirror]:min-h-[140px] [&_.ProseMirror]:outline-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.ProseMirror_hr]:border-neutral-300 [&_.ProseMirror_hr]:my-4',
          '[&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_b]:font-semibold',
          '[&_.ProseMirror]:text-left',
          disabled && 'cursor-not-allowed opacity-50',
          isMaximized &&
            'mx-auto w-full max-w-5xl rounded-b-md border border-neutral-300 bg-white p-8 shadow-md [&_.ProseMirror]:min-h-[calc(100vh-180px)]',
        )}
      />
    </div>
  )
}
