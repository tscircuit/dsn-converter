import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 *
 * DSN pin syntax:
 *   (pin padstack_name pin_number x y)
 *   (pin padstack_name (rotate angle) pin_number x y)
 *
 * When a rotation specifier is present at nodes[2], the actual pin number
 * is at nodes[3], not inside the rotation list.
 */
export function getPinNum(nodes: ASTNode[]): {
  pinNumber: number | string | null
  hasRotation: boolean
} {
  let pinNumber: number | string | undefined
  let hasRotation = false

  if (nodes[2]?.type === "List" && nodes[2].children) {
    // nodes[2] is a rotation spec like (rotate 90) — pin number is at nodes[3]
    hasRotation = true
    if (nodes[3]?.type === "Atom") {
      pinNumber = nodes[3].value
    } else {
      debug("Unsupported pin number format after rotation spec:", nodes)
      return { pinNumber: null, hasRotation }
    }
  } else if (nodes[2]?.type === "Atom") {
    // Pin number is direct value
    pinNumber = nodes[2].value
  } else {
    debug("Unsupported pin number format:", nodes)
    return { pinNumber: null, hasRotation }
  }

  // Convert to number if possible
  if (typeof pinNumber === "number") {
    return { pinNumber, hasRotation }
  }
  const parsed = parseInt(String(pinNumber), 10)
  return {
    pinNumber: Number.isNaN(parsed) ? String(pinNumber) : parsed,
    hasRotation,
  }
}
