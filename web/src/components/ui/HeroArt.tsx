import type { ReactNode } from 'react'
import { teamAsset } from '../../config/team'
import { CrackTexture } from './BrandArt'

/**
 * The planes behind 總覽's opening (開場形象區), back to front. Each one moves at its own rate as the page scrolls
 * (`--hp` runs 0 → 1 while the hero leaves the screen; SeasonHero sets it), which is where the depth comes from:
 * far things drift a little, near things travel more. With motion reduced `--hp` stays 0 and this is a still picture.
 *
 * `photo` is the team photo plane when the deployment has one (config/hero.ts); without it the team's own artwork
 * stands in: the navy board, the cracked ground in gold, the yellow slab cut on the diagonal (as on the team's
 * banner) and the mascot, which grows from the slab's bottom-right corner so its long shadow stays pinned there.
 * This file is the team's own art (the shared layout is SeasonHero).
 */
export function HeroPlanes({ photo }: { photo?: ReactNode }) {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {/* far: the cracked ground on the navy board */}
      <div className="absolute -inset-[8%]" style={{ translate: '0 calc(var(--hp, 0) * 16px)' }}><CrackTexture opacity={0.16} fade="top-right" /></div>
      {photo ?? (
        // middle: the yellow slab (across the top on a phone, the right side on a wide screen)
        <div className="hero-slab absolute inset-x-0 top-0 h-[200px] sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-[46%] bg-[#ffe996] overflow-hidden" style={{ translate: '0 calc(var(--hp, 0) * -10px)' }}>
          <div className="absolute -inset-[10%]" style={{ translate: '0 calc(var(--hp, 0) * 22px)' }}><CrackTexture color="#ffc700" size="900px auto" position="left top" /></div>
          {/* near: the mascot */}
          <img src={teamAsset('mascot-shadow.png')} alt="" width={447} height={447} draggable={false}
            className="hero-settle absolute right-0 bottom-0 h-full w-auto max-w-none select-none origin-bottom-right" style={{ scale: 'calc(1 + var(--hp, 0) * 0.07)' }} />
        </div>
      )}
    </div>
  )
}

/** The card the opening sits in: the navy board (white ink, the logo's gold for the big numbers). */
export const HERO_SECTION = 'brand-board'
/** The stage's height without a photo (the slab takes the top 200px on a phone, so the words start under it). */
export const HERO_STAGE_DRAWN = 'min-h-[440px] sm:min-h-[340px] lg:min-h-[380px]'
export const HERO_TITLE_DRAWN = 'sm:max-w-[52%]'
/** The scrim under the words when they sit on the photo (r,g,b): the team's navy. */
export const HERO_SCRIM = '1,20,42'
export const HERO_INK = 'text-white'
export const HERO_INK_SOFT = 'text-[rgba(255,255,255,0.76)]'
/** the team name's small line and the record figure: the logo's gold */
export const HERO_KICKER = 'text-[var(--brand-gold)]'
export const HERO_RECORD = 'text-[var(--brand-gold)]'
