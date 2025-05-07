"use client"

import { ReactNode } from "react"
import { TooltipProps } from "recharts"
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent"

export type ChartConfig = Record<
  string,
  {
    label: string
    color: string
  }
>

interface ChartContainerProps {
  config: ChartConfig
  children: ReactNode
}

export function ChartContainer({ config, children }: ChartContainerProps) {
  return (
    <div
      className="w-full"
      style={
        {
          "--chart-1": "var(--primary)",
          "--chart-2": "var(--primary-foreground)",
          "--chart-3": "var(--muted)",
          "--chart-4": "var(--muted-foreground)",
          "--chart-5": "var(--accent)",
          "--chart-6": "var(--accent-foreground)",
          "--chart-7": "var(--secondary)",
          "--chart-8": "var(--secondary-foreground)",
          ...Object.fromEntries(
            Object.entries(config).map(([key, value], index) => [
              `--color-${key}`,
              value.color,
            ])
          ),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: {
      [key: string]: any
    }
  }>
  label?: string
  config?: ChartConfig
  indicator?: "dot" | "line"
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  config,
  indicator = "dot",
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        <div className="flex items-center gap-1">
          <div className="font-medium">{label}</div>
        </div>
        <div className="grid gap-1">
          {payload.map((item, index) => {
            const color = `var(--color-${item.name})`
            return (
              <div key={index} className="flex items-center gap-2">
                {indicator === "dot" ? (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ) : (
                  <div
                    className="h-1 w-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                <div className="flex items-center gap-1">
                  <div>{config?.[item.name]?.label ?? item.name}</div>
                  <div className="font-medium">{item.value}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ChartTooltip({
  children,
  ...props
}: TooltipProps<ValueType, NameType> & {
  children: ReactNode
}) {
  return children
}
