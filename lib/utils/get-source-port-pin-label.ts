import type { SourcePort } from "circuit-json"

export function getSourcePortPinLabel(
  sourcePort: SourcePort | undefined,
): string | number | undefined {
  if (!sourcePort) return undefined

  const numericHint = sourcePort.port_hints?.find(
    (hint) => !Number.isNaN(Number(hint)),
  )
  if (numericHint !== undefined) return numericHint

  return (
    sourcePort.port_hints?.[0] ??
    sourcePort.name ??
    sourcePort.pin_number?.toString() ??
    sourcePort.source_port_id
  )
}
