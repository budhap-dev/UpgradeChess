import { describe, it, expect } from 'vitest'
import { BOARD_THEMES, PIECE_SETS, DEFAULT_BOARD_THEME, DEFAULT_PIECE_SET } from './boardThemes'
describe('appearance config', () => {
  it('themes have unique ids and valid colours', () => {
    expect(new Set(BOARD_THEMES.map((t) => t.id)).size).toBe(BOARD_THEMES.length)
    for (const t of BOARD_THEMES) { expect(t.light).toMatch(/^#[0-9a-f]{6}$/i); expect(t.dark).toMatch(/^#[0-9a-f]{6}$/i) }
    expect(BOARD_THEMES.some((t) => t.id === DEFAULT_BOARD_THEME)).toBe(true)
  })
  it('piece sets have unique ids and a default', () => {
    expect(new Set(PIECE_SETS.map((p) => p.id)).size).toBe(PIECE_SETS.length)
    expect(PIECE_SETS.find((p) => p.id === DEFAULT_PIECE_SET)?.kind).toBe('builtin')
  })
})
