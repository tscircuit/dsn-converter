import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 */
export function getPinNumberNodeIndex(nodes: ASTNode[]): number {
  const candidate = nodes[2]
  if (
    candidate?.type === "List" &&
    candidate.children?.[0]?.type === "Atom" &&
    candidate.children[0].value === "rotate"
  ) {
    return 3
  }
  return 2
}

export function getPinNum(nodes: ASTNode[]): number | string | null {
  // Extract pin number from AST nodes
  let pinNumber: number | string | undefined

  const pinNumberNode = nodes[getPinNumberNodeIndex(nodes)]

  if (pinNumberNode?.type === "List" && pinNumberNode.children) {
    // Pin number is in a List structure
    pinNumber = pinNumberNode.children[0]?.value
  } else if (pinNumberNode?.type === "Atom") {
    // Pin number is direct value
    pinNumber = pinNumberNode.value
  } else {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  // Now process the extracted/direct value
  if (typeof pinNumber === "number") {
    return pinNumber
  }
  // Try parsing as number first
  const parsed = parseInt(String(pinNumber), 10)
  return Number.isNaN(parsed) ? String(pinNumber) : parsed
}
