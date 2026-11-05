import { motion, type HTMLMotionProps } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'

export const EASE = [0.23, 1, 0.32, 1] as const

/**
 * A section or card, drawn as it is: content no longer fades or rises into view (a stats page is read, not
 * revealed). Kept as a component so the call sites stay the same; `delay` / `y` are accepted and ignored.
 */
export function Reveal({ delay: _delay, y: _y, as = 'div', ...rest }: HTMLMotionProps<'div'> & { delay?: number; y?: number; as?: 'div' | 'section' }) {
  void _delay; void _y
  const Tag = as === 'section' ? motion.section : motion.div
  return <Tag {...rest} />
}

/** Route-level transition: content fades and rises when the page changes. */
export function PageTransition({ id, children }: { id: string; children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion()
  const cls = 'flex flex-col gap-5 md:gap-6'
  if (reduced) return <div className={cls}>{children}</div>
  return (
    <motion.div key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: EASE }} className={cls}>
      {children}
    </motion.div>
  )
}
