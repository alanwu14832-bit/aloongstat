import type { CSSProperties } from 'react'
import { teamAsset } from '../../config/team'
import { cx } from '../../lib/format'

/**
 * The cracked dry ground of the team's artwork (霸龍's yellow ground): `public/cracks.png` is white cracks on
 * transparent, used as a mask so any colour can paint it. `fade` lets it die away from one corner, so it sits behind
 * content without fighting it. Put it first inside a `relative overflow-hidden` box.
 */
export function CrackTexture({ color = 'var(--brand-gold)', opacity = 1, fade, size = '1200px auto', position = 'right top', className }: {
  color?: string
  opacity?: number
  /** where it stays strongest; it fades out toward the opposite side */
  fade?: 'top-right' | 'bottom' | 'none'
  size?: string
  position?: string
  className?: string
}) {
  const url = `url(${teamAsset('cracks.png')})`
  const fadeMask = fade === 'top-right' ? 'radial-gradient(120% 140% at 100% 0%, #000 0%, #000 25%, transparent 70%)'
    : fade === 'bottom' ? 'linear-gradient(to top, #000 0%, #000 20%, transparent 85%)' : undefined
  const inner: CSSProperties = {
    backgroundColor: color, opacity,
    WebkitMaskImage: url, maskImage: url,
    WebkitMaskSize: size, maskSize: size,
    WebkitMaskPosition: position, maskPosition: position,
    WebkitMaskRepeat: 'repeat', maskRepeat: 'repeat',
  }
  const outer: CSSProperties | undefined = fadeMask ? { WebkitMaskImage: fadeMask, maskImage: fadeMask } : undefined
  return (
    <div aria-hidden className={cx('pointer-events-none absolute inset-0', className)} style={outer}>
      <div className="absolute inset-0" style={inner} />
    </div>
  )
}

/**
 * The team's square artwork, drawn large and sharp: the pale yellow cracked ground, the mascot, and its navy long
 * shadow running off the panel's bottom-right corner (`public/mascot-shadow.png` is cut out of the artwork; its shadow
 * ends at the picture's edge, so it is pinned to the panel's corner).
 */
export function YellowPanel({ className, mascotClassName }: { className?: string; mascotClassName?: string }) {
  return (
    <div aria-hidden className={cx('relative overflow-hidden bg-[#ffe996]', className)}>
      <CrackTexture color="#ffc700" size="900px auto" position="left top" />
      <img src={teamAsset('mascot-shadow.png')} alt="" className={cx('absolute right-0 bottom-0 h-full max-w-none w-auto select-none', mascotClassName)} />
    </div>
  )
}
