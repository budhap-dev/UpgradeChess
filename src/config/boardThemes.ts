export interface BoardTheme { id: string; name: string; light: string; dark: string }
export const BOARD_THEMES: BoardTheme[] = [
  { id: 'tournament', name: 'Tournament green', light: '#e9e0c2', dark: '#7a9a6a' },
  { id: 'walnut', name: 'Walnut', light: '#f0d9b5', dark: '#b58863' },
  { id: 'blue', name: 'Blue', light: '#dee3e6', dark: '#8ca2ad' },
  { id: 'slate', name: 'Slate', light: '#e6e8ea', dark: '#7d8796' },
  { id: 'purple', name: 'Purple', light: '#e8e2f2', dark: '#8f7bb8' },
  { id: 'coral', name: 'Coral', light: '#f6e8de', dark: '#c88a70' },
  { id: 'ice', name: 'Ice', light: '#eef3f6', dark: '#a5b6c4' },
  { id: 'olive', name: 'Olive', light: '#ece9d3', dark: '#9a9a6a' },
]
export const DEFAULT_BOARD_THEME = 'tournament'

export interface PieceSet { id: string; name: string; kind: 'builtin' | 'svg'; credit?: string }
export const PIECE_SETS: PieceSet[] = [
  { id: 'default', name: 'Standard', kind: 'builtin' },
  { id: 'cburnett', name: 'Cburnett', kind: 'svg', credit: 'Colin M.L. Burnett · GPLv2+' },
  { id: 'merida', name: 'Merida', kind: 'svg', credit: 'Armando H. Marroquin · GPLv2+' },
  { id: 'chessnut', name: 'Chessnut', kind: 'svg', credit: 'Alexis Luengas · Apache 2.0' },
  { id: 'fantasy', name: 'Fantasy', kind: 'svg', credit: 'Maurizio Monge · MIT' },
  { id: 'kiwen-suwi', name: 'Kiwen-suwi', kind: 'svg', credit: 'neverRare · CC BY 4.0' },
]
export const DEFAULT_PIECE_SET = 'default'
export const PIECE_CODES = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'] as const
export const pieceUrl = (set: string, code: string) => `/pieces/${set}/${code}.svg`
