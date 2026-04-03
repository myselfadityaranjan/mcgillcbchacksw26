/**
 * Class name utility — merges Tailwind classes safely.
 * Wraps clsx logic inline to avoid an extra dependency.
 */

type ClassValue = string | undefined | null | boolean | ClassValue[]

function flattenClasses(val: ClassValue): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.map(flattenClasses).filter(Boolean).join(' ')
  return ''
}

/**
 * Merge class names, filtering falsy values.
 * Usage: cn('base', condition && 'conditional', ['array', 'support'])
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs.map(flattenClasses).filter(Boolean).join(' ')
}
