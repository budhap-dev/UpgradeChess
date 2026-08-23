export type Track = 'tactics' | 'endgames' | 'openings' | 'strategy'
export type Band = 'foundation' | 'club' | 'strong'
export type NodeKind = 'lesson' | 'themed-set' | 'endgame' | 'opening'

export interface LessonTask { fen: string; prompt: string; solution: string[]; accept?: string[]; explain: string }
export interface LessonStep { text: string; fen?: string; task?: LessonTask; highlight?: string[] }
export interface PathNode {
  id: string; track: Track; band: Band; kind: NodeKind
  title: string; blurb: string; xp: number
  requires?: string[]
  steps?: LessonStep[]                         // lesson
  theme?: string; target?: { count: number; accuracy: number } // themed-set
  endgameId?: string                           // endgame
  repertoireId?: string                        // opening
}
