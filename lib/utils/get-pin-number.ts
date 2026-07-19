import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  // Extract pin number from AST nodes
  let pinNumber

  // Skip List modifiers like (rotate 90) to find the actual pin number
  let pinIndex = 2
  if (
    nodes[2]?.type === "List" &&
    nodes[2].children?.[0]?.type === "Atom" &&
    typeof nodes[2].children[0].value === "string" &&
    nodes[2].children[0].value === "rotate"
  ) {
    pinIndex = 3
  }

  if (nodes[pinIndex]?.type === "List" && nodes[pinIndex].children) {
    // Pin number is in a List structure
    pinNumber = nodes[pinIndex].children[0]?.value
  } else if (nodes[pinIndex]?.type === "Atom") {
    // Pin number is direct value
    pinNumber = nodes[pinIndex].value
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
