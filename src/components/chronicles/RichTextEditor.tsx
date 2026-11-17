import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  List as ListIcon,
  ListOrdered as OrderedListIcon,
  Heading2 as HeadingIcon,
  Palette,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const COLOR_PALETTE = [
  { label: 'Obsidian White', value: '#CCD0CF' },
  { label: 'Gold Amber', value: '#F59E0B' },
  { label: 'Sky Blue', value: '#38BDF8' },
  { label: 'Emerald Green', value: '#34D399' },
  { label: 'Rose Red', value: '#FB7185' },
  { label: 'Arcane Purple', value: '#C084FC' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder,
}) => {
  const [showColorPicker, setShowColorPicker] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'min-h-[220px] max-h-[400px] overflow-y-auto px-4 py-3 text-sm text-[#CCD0CF] leading-relaxed focus:outline-none selection:bg-[#4A5C6A] selection:text-white',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Đồng bộ nội dung khi editingJournal thay đổi từ ngoài
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#253745] bg-[#06141B] overflow-hidden flex flex-col focus-within:border-[#4A5C6A] transition-colors">
      {/* 1. Editor Toolbar */}
      <div className="px-3 py-2 bg-[#06141B] border-b border-[#253745] flex flex-wrap items-center gap-1.5 shrink-0">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center transition-all ${
            editor.isActive('bold')
              ? 'bg-[#253745] text-white border border-[#4A5C6A]'
              : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D]'
          }`}
          title="In đậm (Ctrl+B)"
        >
          <BoldIcon className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center transition-all ${
            editor.isActive('italic')
              ? 'bg-[#253745] text-white border border-[#4A5C6A]'
              : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D]'
          }`}
          title="In nghiêng (Ctrl+I)"
        >
          <ItalicIcon className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center transition-all ${
            editor.isActive('underline')
              ? 'bg-[#253745] text-white border border-[#4A5C6A]'
              : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D]'
          }`}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#253745] mx-1" />

        {/* Heading */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center transition-all ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-[#253745] text-white border border-[#4A5C6A]'
              : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D]'
          }`}
          title="Tiêu đề mục (Heading)"
        >
          <HeadingIcon className="w-4 h-4" />
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center transition-all ${
            editor.isActive('bulletList')
              ? 'bg-[#253745] text-white border border-[#4A5C6A]'
              : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D]'
          }`}
          title="Danh sách gạch đầu dòng"
        >
          <ListIcon className="w-4 h-4" />
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center transition-all ${
            editor.isActive('orderedList')
              ? 'bg-[#253745] text-white border border-[#4A5C6A]'
              : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D]'
          }`}
          title="Danh sách đánh số"
        >
          <OrderedListIcon className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#253745] mx-1" />

        {/* Color Palette dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D] transition-all"
            title="Màu chữ"
          >
            <Palette className="w-4 h-4" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1.5 p-2 bg-[#11212D] border border-[#253745] rounded-xl shadow-2xl flex items-center gap-1.5 z-20">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setColor(c.value).run();
                    setShowColorPicker(false);
                  }}
                  className="w-5 h-5 rounded-full border border-black/40 hover:scale-125 transition-transform"
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>

        {/* Undo / Redo */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-xs text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            title="Hoàn tác (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-xs text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            title="Làm lại (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Editor Body */}
      <div className="relative flex-1">
        {editor.isEmpty && placeholder && (
          <div className="absolute top-3 left-4 text-xs sm:text-sm text-[#4A5C6A] pointer-events-none select-none italic leading-relaxed">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
