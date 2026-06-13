import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  const result = getPinNumAndIndex(nodes)
  return result ? result.pinNumber : null
}

/**
 * Process pin identifier and return its value and the index where it was found
 */
export function getPinNumAndIndex(nodes: ASTNode[]): { pinNumber: number | string; index: number } | null {
  let i = 2
  while (i < nodes.length) {
    const node = nodes[i]
    if (node.type === "List" && node.children && node.children[0]?.type === "Atom") {
      const headVal = node.children[0].value
      if (headVal === "rotate" || headVal === "clearance_class") {
        i++
        continue
      }
    }
    break
  }

  if (i >= nodes.length) {
    debug("Unsupported pin number format: no pin node found", nodes)
    return null
  }

  const pinNumNode = nodes[i]
  let pinNumber

  if (pinNumNode.type === "List" && pinNumNode.children) {
    // Pin number is in a List structure
    pinNumber = pinNumNode.children[0]?.value
  } else if (pinNumNode.type === "Atom") {
    // Pin number is direct value
    pinNumber = pinNumNode.value
  } else {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  if (pinNumber === undefined || pinNumber === null) {
    return null
  }

  let finalPinNumber: number | string
  if (typeof pinNumber === "number") {
    finalPinNumber = pinNumber
  } else {
    const parsed = parseInt(String(pinNumber), 10)
    finalPinNumber = Number.isNaN(parsed) ? String(pinNumber) : parsed
  }

  return { pinNumber: finalPinNumber, index: i }
}
