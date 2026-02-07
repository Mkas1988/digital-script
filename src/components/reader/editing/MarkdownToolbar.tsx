'use client'

import { useCallback } from 'react'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link,
  Code,
  Quote,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onContentChange: (content: string) => void
  className?: string
  disabled?: boolean
}

interface ToolbarAction {
  icon: typeof Bold
  label: string
  shortcut?: string
  action: (
    text: string,
    selectionStart: number,
    selectionEnd: number
  ) => { newText: string; newSelectionStart: number; newSelectionEnd: number }
}

/**
 * Toolbar for Markdown formatting in the section editor
 */
export function MarkdownToolbar({
  textareaRef,
  onContentChange,
  className,
  disabled = false,
}: MarkdownToolbarProps) {

  // Execute a toolbar action
  const executeAction = useCallback((action: ToolbarAction['action']) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const text = textarea.value
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd

    const result = action(text, selectionStart, selectionEnd)

    // Update the content
    onContentChange(result.newText)

    // Restore focus and selection after React re-renders
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd)
    })
  }, [textareaRef, onContentChange])

  // Wrap selection with prefix/suffix
  const wrapSelection = useCallback((prefix: string, suffix: string = prefix) => {
    return (text: string, start: number, end: number) => {
      const selectedText = text.slice(start, end)
      const before = text.slice(0, start)
      const after = text.slice(end)

      // If already wrapped, unwrap
      if (
        before.endsWith(prefix) &&
        after.startsWith(suffix)
      ) {
        return {
          newText: before.slice(0, -prefix.length) + selectedText + after.slice(suffix.length),
          newSelectionStart: start - prefix.length,
          newSelectionEnd: end - prefix.length,
        }
      }

      const newText = before + prefix + selectedText + suffix + after
      return {
        newText,
        newSelectionStart: start + prefix.length,
        newSelectionEnd: end + prefix.length,
      }
    }
  }, [])

  // Prepend line with prefix
  const prependLine = useCallback((prefix: string) => {
    return (text: string, start: number, end: number) => {
      // Find the start of the current line
      const lineStart = text.lastIndexOf('\n', start - 1) + 1
      const lineEnd = text.indexOf('\n', end)
      const actualLineEnd = lineEnd === -1 ? text.length : lineEnd

      const before = text.slice(0, lineStart)
      const line = text.slice(lineStart, actualLineEnd)
      const after = text.slice(actualLineEnd)

      // If line already starts with prefix, remove it
      if (line.startsWith(prefix)) {
        const newText = before + line.slice(prefix.length) + after
        return {
          newText,
          newSelectionStart: Math.max(lineStart, start - prefix.length),
          newSelectionEnd: Math.max(lineStart, end - prefix.length),
        }
      }

      const newText = before + prefix + line + after
      return {
        newText,
        newSelectionStart: start + prefix.length,
        newSelectionEnd: end + prefix.length,
      }
    }
  }, [])

  // Insert link
  const insertLink = useCallback(() => {
    return (text: string, start: number, end: number) => {
      const selectedText = text.slice(start, end) || 'Link-Text'
      const before = text.slice(0, start)
      const after = text.slice(end)

      const linkText = `[${selectedText}](url)`
      const newText = before + linkText + after

      // Select the "url" part
      const urlStart = start + selectedText.length + 3
      const urlEnd = urlStart + 3

      return {
        newText,
        newSelectionStart: urlStart,
        newSelectionEnd: urlEnd,
      }
    }
  }, [])

  // Insert horizontal rule
  const insertRule = useCallback(() => {
    return (text: string, start: number) => {
      const before = text.slice(0, start)
      const after = text.slice(start)

      // Ensure we're on a new line
      const needsNewline = before.length > 0 && !before.endsWith('\n')
      const rule = (needsNewline ? '\n' : '') + '\n---\n\n'

      const newText = before + rule + after
      const newPos = start + rule.length

      return {
        newText,
        newSelectionStart: newPos,
        newSelectionEnd: newPos,
      }
    }
  }, [])

  const actions: ToolbarAction[] = [
    {
      icon: Bold,
      label: 'Fett',
      shortcut: 'Ctrl+B',
      action: wrapSelection('**'),
    },
    {
      icon: Italic,
      label: 'Kursiv',
      shortcut: 'Ctrl+I',
      action: wrapSelection('*'),
    },
    {
      icon: Heading1,
      label: 'Überschrift 1',
      action: prependLine('# '),
    },
    {
      icon: Heading2,
      label: 'Überschrift 2',
      action: prependLine('## '),
    },
    {
      icon: List,
      label: 'Aufzählung',
      action: prependLine('- '),
    },
    {
      icon: ListOrdered,
      label: 'Nummerierte Liste',
      action: prependLine('1. '),
    },
    {
      icon: Quote,
      label: 'Zitat',
      action: prependLine('> '),
    },
    {
      icon: Code,
      label: 'Code',
      action: wrapSelection('`'),
    },
    {
      icon: Link,
      label: 'Link',
      action: insertLink(),
    },
    {
      icon: Minus,
      label: 'Trennlinie',
      action: insertRule(),
    },
  ]

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-1 p-2',
      'bg-muted/50 border-b',
      'rounded-t-lg',
      className
    )}>
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => executeAction(action.action)}
            disabled={disabled}
            title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
          >
            <Icon className="w-4 h-4" />
          </Button>
        )
      })}
    </div>
  )
}

/**
 * Handle keyboard shortcuts for the Markdown editor
 */
export function useMarkdownShortcuts(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  onContentChange: (content: string) => void
) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Ctrl+B = Bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault()
      const text = textarea.value
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = text.slice(start, end)
      const newText = text.slice(0, start) + '**' + selected + '**' + text.slice(end)
      onContentChange(newText)
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(start + 2, end + 2)
      })
    }

    // Ctrl+I = Italic
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault()
      const text = textarea.value
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = text.slice(start, end)
      const newText = text.slice(0, start) + '*' + selected + '*' + text.slice(end)
      onContentChange(newText)
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(start + 1, end + 1)
      })
    }
  }, [textareaRef, onContentChange])

  return { handleKeyDown }
}
