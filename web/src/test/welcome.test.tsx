import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useDataStore } from '../store/data'
import { SEED_DATASET } from '../data/seed'
import { EMPTY_DATASET } from '../data/types'
import { OverviewPage } from '../pages/Overview'

const show = () => render(<MemoryRouter><OverviewPage /></MemoryRouter>)

describe('總覽 before the first game', () => {
  afterEach(() => cleanup())

  it('welcomes the team and walks the first steps; a signed-out visitor is sent to sign in, then the roster, then the first game', () => {
    const cloud = useDataStore.getState().cloud
    useDataStore.setState({ base: EMPTY_DATASET, demo: false, cloud: { ...cloud, configured: true, user: null, isEditor: false } })
    useDataStore.getState().resetFilters()
    show()
    expect(screen.getByRole('heading', { name: /歡迎來到/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /去登入/ })).toHaveAttribute('href', '/import')
    expect(screen.getByRole('link', { name: /去匯入/ })).toHaveAttribute('href', '/players')
    expect(screen.getByRole('link', { name: /開始紀錄/ })).toHaveAttribute('href', '/record')
    expect(screen.queryByText('目前篩選條件下沒有比賽')).toBeNull()
    useDataStore.setState({ cloud })
  })

  it('games that a filter hides still get the filter message, not the welcome', () => {
    useDataStore.setState({ base: SEED_DATASET, demo: false })
    useDataStore.getState().resetFilters()
    useDataStore.getState().setFilters({ opponent: '沒有這一隊' })
    show()
    expect(screen.getByText('目前篩選條件下沒有比賽')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /歡迎來到/ })).toBeNull()
    useDataStore.getState().resetFilters()
  })
})
