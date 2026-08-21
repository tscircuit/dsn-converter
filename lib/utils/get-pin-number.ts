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
  let index = 2

  while (index < nodes.length) {
    const node = nodes[index]

    if (node?.type === "List" && node.children?.length) {
      const listHead = node.children[0]
      if (
        listHead?.type === "Atom" &&
        typeof listHead.value === "string" &&
        ["rotate", "mirror", "flip"].includes(listHead.value)
      ) {
        index += 1
        continue
      }

      pinNumber = node.children[0]?.value
      break
    }

    if (node?.type === "Atom") {
      pinNumber = node.value
      break
    }

    index += 1
  }

  if (pinNumber === undefined) {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  // Now process the extracted/direct value
  if (typeof pinNumber === "number") {
    return pinNumber
  }

  const pinString = String(pinNumber)
  if (/^-?\d+$/.test(pinString)) {
    return Number(pinString)
  }

  return pinString
}
