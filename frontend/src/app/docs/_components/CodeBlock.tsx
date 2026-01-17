import * as React from "react"

import { cn } from "@/lib/utils"

type CodeBlockProps = {
  title?: string
  code: string
  className?: string
}

export function CodeBlock({ title, code, className }: CodeBlockProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {title ? (
        <div className="text-sm font-medium text-foreground">{title}</div>
      ) : null}
      <pre className="bg-muted/40 border border-border rounded-lg overflow-x-auto p-4">
        <code className="text-sm text-foreground whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}

