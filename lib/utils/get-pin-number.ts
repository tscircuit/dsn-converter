import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Check if a List node is a (rotate N) directive
 */
function isRotateDirective(node: ASTNode): boolean {
  if (node.type !== "List" || !node.children || node.children.length < 2)
    return false
  return (
    node.children[0]?.type === "Atom" &&
    String(node.children[0].value) === "rotate"
  )
}

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step.
 *
 * DSN pin format:
 *   (pin PadstackName PinNumber X Y)
 *   (pin PadstackName (rotate N) PinNumber X Y)
 *
 * When a (rotate N) list appears at position 2, the pin number shifts to position 3.
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  let pinNumber
  let pinIndex = 2

  // Check if nodes[2] is a (rotate N) directive — if so, the pin number is at nodes[3]
  if (nodes[2]?.type === "List" && isRotateDirective(nodes[2])) {
    pinIndex = 3
  }

  if (nodes[pinIndex]?.type === "List" && nodes[pinIndex]?.children) {
    pinNumber = nodes[pinIndex]?.children?.[0]?.value
  } else if (nodes[pinIndex]?.type === "Atom") {
    pinNumber = nodes[pinIndex].value
  } else {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  if (typeof pinNumber === "number") {
    return pinNumber
  }
  const parsed = parseInt(String(pinNumber), 10)
  return Number.isNaN(parsed) ? String(pinNumber) : parsed
}
