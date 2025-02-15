import type { Parser as ParserType, Pin } from ".././dsn-pcb/types"
import Debug from "debug"
import { getPinNum } from "lib/utils/get-pin-number"

const debug = Debug("dsn-converter:get-pin-details")
export function getPinDetails(nodes: any[]): Pin | null {
  try {
    const pin: any = {}

    // Check if the node structure matches the provided format
    if (
      nodes.length === 6 &&
      nodes[0]?.type === "Atom" &&
      nodes[0]?.value === "pin" &&
      nodes[1]?.type === "Atom" &&
      nodes[2]?.type === "List" &&
      Array.isArray(nodes[2]?.children) &&
      nodes[2]?.children.length === 2 &&
      nodes[2]?.children[0]?.type === "Atom" &&
      nodes[2]?.children[0]?.value === "rotate" &&
      typeof nodes[2]?.children[1]?.value === "number" &&
      nodes[3]?.type === "Atom" &&
      typeof nodes[3]?.value === "number" &&
      nodes[4]?.type === "Atom" &&
      typeof nodes[4]?.value === "number" &&
      nodes[5]?.type === "Atom" &&
      typeof nodes[5]?.value === "number"
    ) {
      // New structure handling
      pin.padstack_name = String(nodes[1].value)
      pin.rotation = nodes[2].children[1].value as number
      pin.pin_number = nodes[3].value as number
      pin.x = nodes[4].value as number
      pin.y = nodes[5].value as number

      return pin as Pin
    }

    // Fallback to original logic
    if (nodes[1]?.type !== "Atom") {
      debug(`Unsupported pin padstack_name format: ${JSON.stringify(nodes)}`)
      return null
    }
    pin.padstack_name = String(nodes[1].value)

    // check if pin number is in a List structure
    const pinNumber = getPinNum(nodes)
    if (pinNumber === null) return null

    pin.pin_number = pinNumber

    // Parse coordinates
    let xValue: number | undefined
    let yValue: number | undefined
    let rotationValue: number | undefined

    for (let i = 3; i < nodes.length; i++) {
      const node = nodes[i]
      const nextNode = nodes[i + 1]

      if (node.type === "Atom") {
        if (xValue === undefined) {
          // Try to parse X coordinate
          if (typeof node.value === "number") {
            if (
              nextNode?.type === "Atom" &&
              String(nextNode.value).toLowerCase().startsWith("e")
            ) {
              // Handle scientific notation
              xValue = Number(`${node.value}${nextNode.value}`)
              i++ // Skip the exponent part
            } else {
              xValue = node.value
            }
          }
        } else if (yValue === undefined) {
          // Try to parse Y coordinate
          if (typeof node.value === "number") {
            if (
              nextNode?.type === "Atom" &&
              String(nextNode.value).toLowerCase().startsWith("e")
            ) {
              // Handle scientific notation
              yValue = Number(`${node.value}${nextNode.value}`)
              i++ // Skip the exponent part
            } else {
              yValue = node.value
            }
          }
        } else if (rotationValue === undefined) {
          // Try to parse rotation
          if (typeof node.value === "number") {
            rotationValue = node.value
          }
        }
      }
    }

    if (typeof xValue !== "number" || typeof yValue !== "number") {
      throw new Error(`Invalid coordinates: x=${xValue}, y=${yValue}`)
    }

    pin.x = xValue
    pin.y = yValue
    pin.rotation = rotationValue ? rotationValue : 0

    return pin as Pin
  } catch (error) {
    console.error("Pin processing error:", error)
    console.error("Problematic nodes:", JSON.stringify(nodes, null, 2))
    throw error
  }
}
