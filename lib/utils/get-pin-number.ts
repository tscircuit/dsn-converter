import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 *
 * DSN pin formats:
 *   (pin padstack_name pin_id x y)
 *   (pin padstack_name (rotate angle) pin_id x y)
 *
 * Pin IDs can be numeric (1, 2, 100) or named (GND1, A, C)
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  let pinNumber: unknown

  // Check if nodes[2] is a (rotate ...) list — if so, pin ID is at nodes[3]
  const pinIdIndex =
    nodes[2]?.type === "List" &&
    nodes[2].children?.[0]?.type === "Atom" &&
    nodes[2].children[0].value === "rotate"
      ? 3
      : 2

  const pinNode = nodes[pinIdIndex]

  if (!pinNode) {
    debug("No pin number node found at index", pinIdIndex, "in:", nodes)
    return null
  }

  if (pinNode.type === "List" && pinNode.children) {
    // Pin number is in a nested List structure
    pinNumber = pinNode.children[0]?.value
  } else if (pinNode.type === "Atom") {
    // Pin number is a direct value
    pinNumber = pinNode.value
  } else {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  // Convert to appropriate type
  if (typeof pinNumber === "number") {
    return pinNumber
  }
  // Try parsing as number first, keep as string if not numeric
  const parsed = parseInt(String(pinNumber), 10)
  return Number.isNaN(parsed) ? String(pinNumber) : parsed
}
