import { useQuery } from '@tanstack/react-query'
import { fetchLichessUser } from '@/shared/api/lichess'
import { fetchChesscomStats } from '@/shared/api/chesscom'
import { db, DAY_KEY } from '@/shared/db/db'

export interface PerfRow { platform: 'lichess' | 'chesscom'; perf: string; rating: number; rd?: number; games?: number; prov?: boolean; prog?: number }

const LICHESS_ORDER = ['rapid', 'blitz', 'bullet', 'classical', 'puzzle', 'correspondence']

async function snapshot(rows: PerfRow[]) {
  const day = DAY_KEY()
  for (const r of rows) {
    const existing = await db.externalRatings.where('[platform+perf]').equals([r.platform, r.perf]).and((e) => e.day === day).first()
    if (existing) await db.externalRatings.update(existing.id!, { rating: r.rating, rd: r.rd, games: r.games, ts: Date.now() })
    else await db.externalRatings.add({ platform: r.platform, perf: r.perf, rating: r.rating, rd: r.rd, games: r.games, ts: Date.now(), day })
  }
}

export function useLichessRatings(username: string) {
  return useQuery({
    queryKey: ['lichess', username.toLowerCase()],
    enabled: !!username,
    queryFn: async () => {
      const u = await fetchLichessUser(username)
      if (!u) return { notFound: true as const, rows: [] as PerfRow[], games: 0 }
      const rows: PerfRow[] = Object.entries(u.perfs)
        .filter(([k, v]) => (v.games ?? 0) > 0 && !['ultraBullet', 'storm', 'racer', 'streak'].includes(k))
        .map(([perf, v]) => ({ platform: 'lichess' as const, perf, rating: v.rating, rd: v.rd, games: v.games, prov: v.prov, prog: v.prog }))
        .sort((a, b) => (LICHESS_ORDER.indexOf(a.perf) + 1 || 99) - (LICHESS_ORDER.indexOf(b.perf) + 1 || 99))
      await snapshot(rows)
      return { notFound: false as const, rows, games: u.count?.all ?? 0 }
    },
  })
}

export function useChesscomRatings(username: string) {
  return useQuery({
    queryKey: ['chesscom', username.toLowerCase()],
    enabled: !!username,
    queryFn: async () => {
      const perfs = await fetchChesscomStats(username)
      if (!perfs) return { notFound: true as const, rows: [] as PerfRow[] }
      const rows: PerfRow[] = perfs.map((p) => ({ platform: 'chesscom' as const, perf: p.perf, rating: p.rating, rd: p.rd, games: p.games }))
      await snapshot(rows)
      return { notFound: false as const, rows }
    },
  })
}
