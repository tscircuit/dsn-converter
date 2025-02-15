import type { ASTNode } from "../common/parse-sexpr"
import Debug from "debug"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  // Extract pin number from AST nodes
  let pinNumber

  if (nodes[2]?.type === "List" && nodes[2].children) {
    // Handle Pin number  in different structures
    pinNumber =
      nodes[2].children[1]?.value === "rotate"
        ? nodes[3].value
        : nodes[2].children[0]?.value
  } else if (nodes[2]?.type === "Atom") {
    // Pin number is direct value
    pinNumber = nodes[2].value
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
