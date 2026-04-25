import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type.
 * Handles both extraction from nodes and type conversion in one step.
 *
 * DSN pin syntax:
 *   (pin <padstack> <pin_number> <x> <y>)
 *   (pin <padstack> (rotate <angle>) <pin_number> <x> <y>)
 *
 * When a (rotate ...) modifier is present at nodes[2], the actual pin
 * identifier shifts to nodes[3].
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  let pinNumber: number | string | undefined

  // Check if nodes[2] is a (rotate ...) List — if so, pin id is at nodes[3]
  const isRotateModifier =
    nodes[2]?.type === "List" &&
    nodes[2].children?.[0]?.type === "Atom" &&
    nodes[2].children?.[0]?.value === "rotate"

  if (isRotateModifier) {
    // Pin identifier is at index 3
    if (nodes[3]?.type === "Atom") {
      pinNumber = nodes[3].value as number | string
    } else {
      debug("Unsupported pin number format after rotate modifier:", nodes)
      return null
    }
  } else if (nodes[2]?.type === "List" && nodes[2].children) {
    // Pin number is in a List structure (other list types)
    pinNumber = nodes[2].children[0]?.value as number | string
  } else if (nodes[2]?.type === "Atom") {
    // Pin number is direct value
    pinNumber = nodes[2].value as number | string
  } else {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  // Now process the extracted value
  if (typeof pinNumber === "number") {
    return pinNumber
  }
  // Try parsing as integer first
  const str = String(pinNumber)
  const parsed = parseInt(str, 10)
  // Return as string for non-numeric identifiers (e.g. "GND1", "A", "+", "-")
  return Number.isNaN(parsed) ? str : parsed
}
