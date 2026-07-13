import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 */
export function getPinNum(
  nodes: ASTNode[],
  pinNameIndex = 2,
): number | string | null {
  // Extract pin number from AST nodes
  let pinNumber

  if (nodes[pinNameIndex]?.type === "List" && nodes[pinNameIndex].children) {
    // Pin number is in a List structure
    pinNumber = nodes[pinNameIndex].children[0]?.value
  } else if (nodes[pinNameIndex]?.type === "Atom") {
    // Pin number is direct value
    pinNumber = nodes[pinNameIndex].value
  } else {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  // Now process the extracted/direct value
  if (typeof pinNumber === "number") {
    return pinNumber
  }
  // Only treat fully-numeric strings as pin numbers; named pins like
  // "GND2", "2@1", "A", "-" must be preserved as strings (parseInt would
  // silently truncate them, e.g. parseInt("2@1") === 2)
  const pinNumberString = String(pinNumber)
  if (/^-?\d+$/.test(pinNumberString)) {
    return Number.parseInt(pinNumberString, 10)
  }
  return pinNumberString
}

/**
 * Extracts the optional per-pin rotation from a `(pin padstack (rotate N) ...)`
 * clause. Returns the rotation in degrees, or undefined when absent.
 */
export function getPinRotation(nodes: ASTNode[]): number | undefined {
  const maybeRotate = nodes[2]
  if (
    maybeRotate?.type === "List" &&
    maybeRotate.children?.[0]?.type === "Atom" &&
    maybeRotate.children[0].value === "rotate"
  ) {
    const angleNode = maybeRotate.children[1]
    if (angleNode?.type === "Atom" && typeof angleNode.value === "number") {
      return angleNode.value
    }
  }
  return undefined
}
