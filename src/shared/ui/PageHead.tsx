import type { ReactNode } from 'react'

/** The page header pattern: eyebrow + H1 (+ optional subtitle) on the left, actions on the right. */
export function PageHead({ eyebrow, title, sub, actions }: { eyebrow: ReactNode; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="titles">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  )
}
