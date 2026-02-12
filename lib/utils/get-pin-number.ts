import type { ASTNode } from "../common/parse-sexpr"
import Debug from "debug"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 *
 * DSN pin format:
 *   (pin <padstack_name> [optional (rotate <degrees>)] <pin_number> <x> <y>)
 *
 * nodes[0] = "pin"
 * nodes[1] = padstack_name
 * nodes[2] = pin_number OR (rotate N) list
 * nodes[3] = pin_number (if nodes[2] was rotate) OR x coordinate
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  let pinNumber

  // Check if nodes[2] is a (rotate N) list
  if (
    nodes[2]?.type === "List" &&
    nodes[2].children &&
    nodes[2].children[0]?.type === "Atom" &&
    nodes[2].children[0].value === "rotate"
  ) {
    // Pin number is at nodes[3], after the (rotate N) list
    if (nodes[3]?.type === "Atom") {
      pinNumber = nodes[3].value
    } else {
      debug("Unsupported pin number format after rotate:", nodes)
      return null
    }
  } else if (nodes[2]?.type === "List" && nodes[2].children) {
    // Pin number is in some other List structure
    pinNumber = nodes[2].children[0]?.value
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

/**
 * Extract pin rotation from AST nodes, if present.
 * Returns the rotation angle in degrees or 0 if no rotation is specified.
 */
export function getPinRotation(nodes: ASTNode[]): number {
  if (
    nodes[2]?.type === "List" &&
    nodes[2].children &&
    nodes[2].children[0]?.type === "Atom" &&
    nodes[2].children[0].value === "rotate"
  ) {
    const rotValue = nodes[2].children[1]?.value
    if (typeof rotValue === "number") {
      return rotValue
    }
  }
  return 0
}

/**
 * Check if pin nodes contain a (rotate N) list, which shifts the index
 * of subsequent elements (pin_number, x, y) by 1.
 */
export function hasPinRotation(nodes: ASTNode[]): boolean {
  return (
    nodes[2]?.type === "List" &&
    nodes[2].children !== undefined &&
    nodes[2].children[0]?.type === "Atom" &&
    nodes[2].children[0].value === "rotate"
  )
}
