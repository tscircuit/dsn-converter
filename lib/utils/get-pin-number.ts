import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  // DSN pin grammar: (pin <padstack_name> [(rotate <angle>)] <pin_name> <x> <y>)
  // When the optional (rotate ...) group is present it sits at nodes[2] and
  // the pin name shifts to nodes[3]. Reading nodes[2] unconditionally used to
  // return the string "rotate" as the pin name for every rotated pin.
  let nameNodeIndex = 2
  const maybeRotateNode = nodes[2]
  if (
    maybeRotateNode?.type === "List" &&
    maybeRotateNode.children?.[0]?.type === "Atom" &&
    maybeRotateNode.children[0].value === "rotate"
  ) {
    nameNodeIndex = 3
  }

  // Extract pin number from AST nodes
  let pinNumber
  const nameNode = nodes[nameNodeIndex]

  if (nameNode?.type === "List" && nameNode.children) {
    // Pin number is in a List structure
    pinNumber = nameNode.children[0]?.value
  } else if (nameNode?.type === "Atom") {
    // Pin number is direct value
    pinNumber = nameNode.value
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
