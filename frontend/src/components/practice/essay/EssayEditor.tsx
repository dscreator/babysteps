import { useEffect, useRef } from 'react'

interface EssayEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

interface ToolbarButton {
  label: string
  command: string
  icon: string
}

const toolbarButtons: ToolbarButton[] = [
  { label: 'Bold', command: 'bold', icon: 'B' },
  { label: 'Italic', command: 'italic', icon: 'I' },
  { label: 'Underline', command: 'underline', icon: 'U' },
  { label: 'Bullet list', command: 'insertUnorderedList', icon: '•' },
  { label: 'Numbered list', command: 'insertOrderedList', icon: '1.' },
  { label: 'Quote', command: 'formatBlock', icon: '❝' },
]

function extractText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function EssayEditor({ value, onChange, disabled, placeholder }: EssayEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastValueRef = useRef<string>('')

  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      editorRef.current.innerHTML = value
      lastValueRef.current = value
    }
  }, [value])

  useEffect(() => {
    if (disabled && editorRef.current) {
      editorRef.current.blur()
    }
  }, [disabled])

  const handleInput = () => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    lastValueRef.current = html
    onChange(html)
  }

  const handleCommand = (command: string) => {
    if (disabled) return

    if (command === 'formatBlock') {
      document.execCommand(command, false, 'blockquote')
    } else {
      document.execCommand(command)
    }

    if (editorRef.current) {
      editorRef.current.focus()
    }
  }

  const isEmpty = extractText(value).length === 0

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-3 py-2">
        {toolbarButtons.map((button) => (
          <button
            key={button.label}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleCommand(button.command)}
            disabled={disabled}
            className="px-2 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            aria-label={button.label}
          >
            {button.icon}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleCommand('removeFormat')}
          disabled={disabled}
          className="px-2 py-1 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
        >
          Clear
        </button>
      </div>
      <div className="relative">
        {isEmpty && !disabled && (
          <div className="pointer-events-none absolute inset-0 px-4 py-3 text-sm text-gray-400">
            {placeholder || 'Start writing your essay here...'}
          </div>
        )}
        <div
          ref={editorRef}
          className="prose prose-sm max-w-none px-4 py-3 min-h-[320px] focus:outline-none"
          contentEditable={!disabled}
          onInput={handleInput}
          onBlur={handleInput}
          suppressContentEditableWarning
        />
      </div>
    </div>
  )
}
