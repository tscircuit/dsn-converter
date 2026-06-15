import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Detect if nodes[2] is a (rotate <angle>) list.
 * DSN pin format: (pin <padstack> [(rotate <angle>)] <pin_number> <x> <y>)
 * When (rotate ...) is present at index 2, pin_number shifts to index 3.
 */
export function getPinRotation(nodes: ASTNode[]): number | null {
  if (
    nodes[2]?.type === "List" &&
    nodes[2].children &&
    nodes[2].children[0]?.value === "rotate"
  ) {
    const angle = nodes[2].children[1]?.value
    return typeof angle === "number" ? angle : null
  }
  return null
}

/**
 * Get the index offset for pin_number based on whether (rotate ...) is present.
 * Returns 0 if no rotate, 1 if rotate is at index 2 (shifting everything by 1).
 */
export function getPinIndexOffset(nodes: ASTNode[]): number {
  return getPinRotation(nodes) !== null ? 1 : 0
}

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step.
 * Correctly handles optional (rotate <angle>) sub-expression at index 2.
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  // Extract pin number from AST nodes
  let pinNumber
  const offset = getPinIndexOffset(nodes)
  const pinIndex = 2 + offset

  if (nodes[pinIndex]?.type === "List" && nodes[pinIndex].children) {
    // Pin number is in a List structure (unusual but handle it)
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
