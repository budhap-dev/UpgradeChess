export function Sparkline({ values, color = 'var(--accent)', height = 48 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return <svg className="spark" style={{ height }} aria-hidden />
  const w = 200, h = height, pad = 4
  const min = Math.min(...values), max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => [pad + (i / (values.length - 1)) * (w - pad * 2), h - pad - ((v - min) / span) * (h - pad * 2)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${d} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height }} aria-hidden>
      <path d={area} fill={color} opacity=".12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  )
}
