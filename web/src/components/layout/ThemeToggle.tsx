import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useUiStore, type ThemeMode } from '../../store/ui'
import { cx } from '../../lib/format'

const MODES: Array<{ value: ThemeMode; label: string; icon: LucideIcon }> = [
  { value: 'system', label: '跟隨系統', icon: Monitor },
  { value: 'light', label: '淺色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
]

/** Three-state theme control. Same segmented style as Tabs. */
export function ThemeToggle({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'md' }) {
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)
  return (
    <div role="radiogroup" aria-label="主題" className={cx('inline-flex items-center gap-0.5 p-0.5 rounded-[var(--radius-sm)] bg-surface-2', size === 'md' && 'flex w-full', className)}>
      {MODES.map(({ value, label, icon: Icon }) => {
        const active = theme === value
        return (
          <button key={value} type="button" role="radio" aria-checked={active} aria-label={label} title={label} onClick={() => setTheme(value)}
            className={cx('rounded-[6px] inline-flex items-center justify-center cursor-pointer transition-colors motion-reduce:transition-none',
              size === 'md' ? 'h-10 flex-1 min-w-[44px]' : 'size-9 pointer-fine:size-7',
              active ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_var(--border)]' : 'text-muted hover:text-ink')}>
            <Icon className={size === 'md' ? 'size-4' : 'size-3.5'} />
          </button>
        )
      })}
    </div>
  )
}
