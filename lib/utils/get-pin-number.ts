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

  if (
    nodes[2]?.type === "List" &&
    nodes[2].children?.[0]?.type === "Atom" &&
    nodes[2].children[0].value === "rotate"
  ) {
    if (nodes[3]?.type !== "Atom") {
      debug("Unsupported pin number after rotate modifier:", nodes)
      return null
    }
    pinNumber = nodes[3].value
  } else if (nodes[2]?.type === "List" && nodes[2].children) {
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
  // Try parsing as number first
  const pinNumberString = String(pinNumber)
  return /^-?\d+(?:\.\d+)?$/.test(pinNumberString)
    ? Number(pinNumberString)
    : pinNumberString
}
