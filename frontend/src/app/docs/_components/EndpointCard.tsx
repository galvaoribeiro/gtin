import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { CodeBlock } from "./CodeBlock"

export type EndpointParam = {
  name: string
  description: string
}

export type EndpointStatusCode = {
  code: number
  description: string
}

type EndpointCardProps = {
  method: "GET" | "POST"
  path: string
  title: string
  description: string
  badgeNote?: string
  params?: EndpointParam[]
  requestExample?: string
  responseExample?: string
  statusCodes?: EndpointStatusCode[]
  className?: string
}

function methodBadgeClass(method: EndpointCardProps["method"]) {
  if (method === "GET") return "bg-primary text-primary-foreground"
  return "bg-blue-600 text-white"
}

export function EndpointCard({
  method,
  path,
  title,
  description,
  badgeNote,
  params,
  requestExample,
  responseExample,
  statusCodes,
  className,
}: EndpointCardProps) {
  const hasTabs = Boolean(requestExample || responseExample)

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={methodBadgeClass(method)}>{method}</Badge>
            <code className="text-base font-mono text-foreground">{path}</code>
          </div>
          <div className="text-lg font-semibold text-foreground">{title}</div>
        </div>
        {badgeNote ? (
          <Badge variant="outline" className="self-start">
            {badgeNote}
          </Badge>
        ) : null}
      </div>

      <p className="text-foreground leading-relaxed mt-4">{description}</p>

      {params?.length ? (
        <div className="mt-6">
          <div className="text-sm font-semibold text-foreground mb-2">Parâmetros</div>
          <ul className="space-y-2">
            {params.map((p) => (
              <li key={p.name} className="text-sm text-foreground">
                <code className="bg-muted px-2 py-1 rounded text-xs">{p.name}</code>{" "}
                <span className="text-muted-foreground">—</span> {p.description}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasTabs ? (
        <Tabs defaultValue={requestExample ? "request" : "response"} className="mt-6">
          <TabsList>
            {requestExample ? <TabsTrigger value="request">Requisição</TabsTrigger> : null}
            {responseExample ? <TabsTrigger value="response">Resposta</TabsTrigger> : null}
          </TabsList>

          {requestExample ? (
            <TabsContent value="request" className="mt-4">
              <CodeBlock code={requestExample} />
            </TabsContent>
          ) : null}

          {responseExample ? (
            <TabsContent value="response" className="mt-4">
              <CodeBlock code={responseExample} />
            </TabsContent>
          ) : null}
        </Tabs>
      ) : null}

      {statusCodes?.length ? (
        <div className="mt-6">
          <div className="text-sm font-semibold text-foreground mb-2">Códigos de resposta</div>
          <ul className="space-y-2">
            {statusCodes.map((s) => (
              <li key={s.code} className="flex items-start gap-3 text-sm text-foreground">
                <Badge variant="outline">{s.code}</Badge>
                <span>{s.description}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}

