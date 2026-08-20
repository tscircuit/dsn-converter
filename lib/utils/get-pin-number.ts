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

  if (nodes[2]?.type === "List" && nodes[2].children) {
    const isRotationList =
      nodes[2].children[0]?.type === "Atom" &&
      nodes[2].children[0].value === "rotate"

    // Rotated pins place the actual pin identifier after the rotation list.
    pinNumber = isRotationList ? nodes[3]?.value : nodes[2].children[0]?.value
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
  // Numeric tokens are already numbers after tokenisation. Preserve all
  // symbolic and quoted pin identifiers exactly, including "+", "-", "1A",
  // "G+", "P$1", and other valid DSN names.
  return String(pinNumber)
}
