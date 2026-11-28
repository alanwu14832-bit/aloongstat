import { useSearchParams } from 'react-router-dom'
import type { QualRule } from '../data/qualify'

const KEY = 'bafin.qualRule'
/** 規定打席 since 2026-11-27, like the other two sites: 總覽, 打擊, 投球 and 球員 had named different leaders. */
const DEFAULT_RULE: QualRule = 'college'
const parse = (v: string | null | undefined): QualRule | null => (v === 'college' || v === 'team' ? v : null)
const stored = (): QualRule | null => { try { return parse(localStorage.getItem(KEY)) } catch { return null } }

/**
 * The leaderboards' minimum (隊內 / 大專規程): ?min=college|team in the link first, then what this device picked last
 * (shared by 打擊 and 投球), else 規定打席. Picking one updates both; the default takes the parameter out of the link.
 */
export function useQualRule(): [QualRule, (rule: QualRule) => void] {
  const [params, setParams] = useSearchParams()
  const rule = parse(params.get('min')) ?? stored() ?? DEFAULT_RULE
  const set = (r: QualRule) => {
    try { localStorage.setItem(KEY, r) } catch { /* storage unavailable: the link still carries it */ }
    setParams((prev) => { const n = new URLSearchParams(prev); if (r === DEFAULT_RULE) n.delete('min'); else n.set('min', r); return n }, { replace: true })
  }
  return [rule, set]
}
