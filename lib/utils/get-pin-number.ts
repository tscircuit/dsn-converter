import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 */
export function getPinNumberNodeIndex(nodes: ASTNode[]): number {
  let pinNumberIndex = 2

  while (true) {
    const maybeRotateNode = nodes[pinNumberIndex]
    if (
      maybeRotateNode?.type !== "List" ||
      maybeRotateNode.children?.[0]?.type !== "Atom" ||
      maybeRotateNode.children[0].value !== "rotate"
    ) {
      break
    }

    pinNumberIndex++
  }

  return pinNumberIndex
}

export function getPinNum(nodes: ASTNode[]): number | string | null {
  // Extract pin number from AST nodes
  let pinNumber
  const pinNumberIndex = getPinNumberNodeIndex(nodes)

  if (
    nodes[pinNumberIndex]?.type === "List" &&
    nodes[pinNumberIndex].children
  ) {
    // Pin number is in a List structure
    pinNumber = nodes[pinNumberIndex].children[0]?.value
  } else if (nodes[pinNumberIndex]?.type === "Atom") {
    // Pin number is direct value
    pinNumber = nodes[pinNumberIndex].value
  } else {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  // Now process the extracted/direct value
  if (typeof pinNumber === "number") {
    return pinNumber
  }
  // Try parsing as number first
  const pinNumberText = String(pinNumber)
  if (/^-?\d+$/.test(pinNumberText)) {
    return parseInt(pinNumberText, 10)
  }

  return pinNumberText
}
