import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  // Extract pin number from AST nodes
  let pinNumber: number | string | undefined

  const pinNumberNodeIndex = (() => {
    for (let i = 2; i < nodes.length; i++) {
      const node = nodes[i]
      if (
        node?.type === "List" &&
        node.children?.[0]?.type === "Atom" &&
        ["rotate", "mirror"].includes(String(node.children[0].value))
      ) {
        continue
      }
      return i
    }
    return -1
  })()

  const pinNumberNode = nodes[pinNumberNodeIndex]

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

  // Now process the extracted/direct value
  if (typeof pinNumber === "number") {
    return pinNumber
  }
  const pinNumberString = String(pinNumber)
  if (/^-?\d+$/.test(pinNumberString)) {
    return Number.parseInt(pinNumberString, 10)
  }
  return pinNumberString
}
