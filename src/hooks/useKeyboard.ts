import { useEffect, useCallback } from 'react'

type KeyHandler = (event: KeyboardEvent) => void
type KeyMap = Record<string, KeyHandler>

/**
 * Bind keyboard shortcuts declaratively.
 * Keys are case-insensitive. Supports modifier combos: 'ctrl+k', 'shift+enter', etc.
 *
 * @example
 * useKeyboard({
 *   'escape': () => closeModal(),
 *   'ctrl+enter': () => submit(),
 * })
 */
export function useKeyboard(keyMap: KeyMap, deps: React.DependencyList = []): void {
  const handler = useCallback(
    (event: KeyboardEvent) => {
      // Build key string with modifiers
      const parts: string[] = []
      if (event.ctrlKey || event.metaKey) parts.push('ctrl')
      if (event.shiftKey) parts.push('shift')
      if (event.altKey) parts.push('alt')
      parts.push(event.key.toLowerCase())
      const combo = parts.join('+')

      const fn = keyMap[combo] ?? keyMap[event.key.toLowerCase()]
      if (fn) {
        // Don't fire when typing in inputs
        const tag = (event.target as HTMLElement).tagName.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return
        fn(event)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  )

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}
