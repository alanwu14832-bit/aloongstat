import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { TEAM } from '../../config/team'
import { ARCHIVE } from '../../config/archive'
import { useDataStore } from '../../store/data'
import { cx } from '../../lib/format'
import type { Game } from '../../data/types'
import { Reveal } from '../motion/Reveal'
import { CrackTexture, YellowPanel } from './BrandArt'
import { AuthDialog } from './AuthDialog'

const STEP_BUTTON = 'press group mt-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-accent text-accent-ink text-[13px] font-semibold hover:brightness-105 transition-[filter]'
const ARROW = 'size-3.5 transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5'
const WEEK = ['日', '一', '二', '三', '四', '五', '六']
const dayText = (iso: string) => { const d = new Date(`${iso}T00:00:00`); return `${d.getMonth() + 1}/${d.getDate()}（${WEEK[d.getDay()]}）` }

/**
 * 總覽 before the first game: the navy board welcomes the team and walks the first steps (someone signs in, the
 * roster goes in, the first game is recorded), ticking each off as it is done. Once a game is played the season hero
 * takes its place.
 */
export function WelcomeBoard({ next }: { next?: Game }) {
  const cloud = useDataStore((s) => s.cloud)
  const rosterCount = useDataStore((s) => s.base.roster.length)
  const [login, setLogin] = useState(false)
  const steps: Array<{ title: string; text: string; to?: string; action: string; done: boolean }> = [
    // (no page to go to: the sign-in box opens right here)
    { title: '登入', text: '點「登入」→「第一次使用」，輸入 email 和管理者給你的邀請碼、設定密碼。', action: '登入', done: !cloud.configured || !!cloud.user },
    { title: '匯入球員名單', text: '「球員」頁 → 編輯名單 → 匯入 Excel，背號、守位、投打慣用一次帶入。', to: '/players', action: '去匯入', done: rosterCount > 0 },
    { title: '紀錄第一場比賽', text: '「紀錄比賽」逐球輸入，送出就自動算好數據；比賽中這裡和「即時比分」同步更新。', to: '/record', action: '開始紀錄', done: false },
  ]
  return (
    <section aria-label={`歡迎來到 ${TEAM.short} 數據平台`} className="brand-board relative overflow-hidden rounded-[var(--radius)] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
      <YellowPanel className="h-[220px] sm:h-[260px] lg:h-auto lg:order-last" />
      <div className="relative p-6 md:p-9 flex flex-col gap-7 min-w-0">
        <CrackTexture opacity={0.10} fade="top-right" />
        <Reveal className="relative min-w-0">
          <div className="text-[12px] text-accent font-semibold tracking-[0.12em]">WELCOME</div>
          <h2 className="mt-1 text-[26px] md:text-[34px] leading-tight text-ink">歡迎來到{TEAM.short}數據平台</h2>
          <p className="mt-2 text-[14px] md:text-[15px] text-ink-2 leading-relaxed max-w-[56ch]">
            逐球紀錄每一場比賽，送出就自動算好打擊、投球、守備數據；比賽進行中，隊友和球迷都能在「即時比分」看到每一球。
          </p>
          {next && (
            <p className="mt-3 text-[14px] text-ink">
              下一場 <span className="figure text-[18px] font-bold text-accent">{dayText(next.date)}{next.time ? ` ${next.time}` : ''}</span> vs <span className="font-bold">{next.opponent}</span>
            </p>
          )}
        </Reveal>
        {!ARCHIVE && (
          <ol className="relative grid grid-cols-1 md:grid-cols-3 border-t border-border">
            {steps.map((s, i) => (
              <li key={s.title} className={cx('py-4 md:pt-5 md:pb-0 md:pr-6 border-b border-border last:border-b-0 md:border-b-0', i > 0 && 'md:pl-6 md:border-l')}>
                <Reveal delay={0.12 + 0.08 * i}>
                <div className="flex items-center gap-2.5">
                  <span className={cx('inline-flex items-center justify-center size-7 rounded-full figure text-[14px] font-bold shrink-0', s.done ? 'bg-accent text-accent-ink' : 'bg-surface-3 text-ink')}>
                    {s.done ? <Check className="size-4" strokeWidth={3} aria-label="已完成" /> : i + 1}
                  </span>
                  <span className={cx('text-[15px] font-bold', s.done ? 'text-ink-2' : 'text-ink')}>{s.title}</span>
                </div>
                <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">{s.text}</p>
                {!s.done && (s.to
                  ? <Link to={s.to} className={STEP_BUTTON}>{s.action}<ArrowRight className={ARROW} /></Link>
                  : <button type="button" onClick={() => setLogin(true)} className={cx(STEP_BUTTON, 'cursor-pointer')}>{s.action}<ArrowRight className={ARROW} /></button>
                )}
                </Reveal>
              </li>
            ))}
          </ol>
        )}
      </div>
      <AuthDialog open={login} onClose={() => setLogin(false)} title="登入" />
    </section>
  )
}
