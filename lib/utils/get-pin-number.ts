import type { ASTNode } from "../common/parse-sexpr"
import Debug from "debug"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Find the index of the pin number node, skipping any (rotate N) list.
 * DSN pin format can be:
 *   (pin padstack_name pin_number x y)
 *   (pin padstack_name (rotate N) pin_number x y)
 */
export function getPinNumberIndex(nodes: ASTNode[]): number {
  // Check if nodes[2] is a (rotate N) list
  if (
    nodes[2]?.type === "List" &&
    nodes[2].children &&
    nodes[2].children[0]?.type === "Atom" &&
    nodes[2].children[0]?.value === "rotate"
  ) {
    return 3
  }
  return 2
}

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  const pinIdx = getPinNumberIndex(nodes)
  // Extract pin number from AST nodes
  let pinNumber

  if (nodes[pinIdx]?.type === "List" && nodes[pinIdx].children) {
    // Pin number is in a List structure
    pinNumber = nodes[pinIdx].children[0]?.value
  } else if (nodes[pinIdx]?.type === "Atom") {
    // Pin number is direct value
    pinNumber = nodes[pinIdx].value
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
