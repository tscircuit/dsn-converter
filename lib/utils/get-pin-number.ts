import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  // Extract pin number from AST nodes
  let pinNumber: string | number | undefined

  if (nodes[2]?.type === "List" && nodes[2].children) {
    // Pin number is in a List structure
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
  const normalizedPinNumber = String(pinNumber)

  // Only treat fully numeric labels as numbers. Labels such as "1A" are
  // distinct DSN pin names and must not be truncated to 1.
  return /^-?\d+$/.test(normalizedPinNumber)
    ? Number(normalizedPinNumber)
    : normalizedPinNumber
}
