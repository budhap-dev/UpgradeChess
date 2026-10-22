import { create } from 'zustand'

export interface TrainerResult { id: string; solved: boolean; delta: number | null; ms: number }

/** Results of the current visit per mode (`mode|theme`), kept across navigation like the puzzle session itself. */
export const useTrainerResults = create<{ byKey: Record<string, TrainerResult[]>; add: (key: string, r: TrainerResult) => void }>((set) => ({
  byKey: {},
  add: (key, r) => set((s) => {
    const list = s.byKey[key] ?? []
    if (list.at(-1)?.id === r.id) return s // retries and restored sessions don't count twice
    return { byKey: { ...s.byKey, [key]: [...list, r] } }
  }),
}))

const EMPTY: TrainerResult[] = []
export const useResultsFor = (key: string) => useTrainerResults((s) => s.byKey[key] ?? EMPTY)
export const sessionDelta = (rs: TrainerResult[]) => rs.reduce((a, r) => a + (r.delta ?? 0), 0)
