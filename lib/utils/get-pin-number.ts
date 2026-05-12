import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

const pinModifierNames = new Set(["rotate", "mirror", "flip"])

export function getPinNumberNodeIndex(nodes: ASTNode[]): number | null {
  let index = 2

  while (isPinModifierNode(nodes[index])) {
    index++
  }

  return nodes[index] ? index : null
}

function isPinModifierNode(node: ASTNode | undefined): boolean {
  if (node?.type !== "List") return false

  const modifierName = node.children?.[0]?.value
  return typeof modifierName === "string" && pinModifierNames.has(modifierName)
}

function normalizePinNumber(pinNumber: string | number): number | string {
  if (typeof pinNumber === "number") {
    return pinNumber
  }

  return /^-?\d+$/.test(pinNumber) ? Number(pinNumber) : pinNumber
}

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  // Extract pin number from AST nodes
  let pinNumber: string | number | undefined
  const pinNumberIndex = getPinNumberNodeIndex(nodes)

  if (pinNumberIndex === null) {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  const pinNumberNode = nodes[pinNumberIndex]

  if (pinNumberNode?.type === "List" && pinNumberNode.children) {
    // Pin number is in a List structure
    pinNumber = pinNumberNode.children[0]?.value
  } else if (pinNumberNode?.type === "Atom") {
    // Pin number is direct value
    pinNumber = pinNumberNode.value
  } else {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  if (typeof pinNumber !== "string" && typeof pinNumber !== "number") {
    debug("Unsupported pin number value:", nodes)
    return null
  }

  return normalizePinNumber(pinNumber)
}
