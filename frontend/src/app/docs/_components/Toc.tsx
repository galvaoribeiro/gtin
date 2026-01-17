import * as React from "react"

import { cn } from "@/lib/utils"

export type TocItem = {
  id: string
  label: string
}

type TocProps = {
  items: TocItem[]
  className?: string
  onNavigate?: () => void
}

export function Toc({ items, className, onNavigate }: TocProps) {
  return (
    <nav aria-label="Nesta página" className={cn("space-y-2", className)}>
      <div className="text-sm font-semibold text-foreground">Nesta página</div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={onNavigate}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

