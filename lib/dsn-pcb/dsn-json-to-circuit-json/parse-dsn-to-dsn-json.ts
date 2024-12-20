import {
  type ASTNode,
  parseSexprToAst,
  tokenizeDsn,
} from "../../common/parse-sexpr"
import type {
  Boundary,
  CircleShape,
  Circuit,
  Class,
  Clearance,
  Component,
  ComponentPlacement,
  DsnJson,
  DsnPcb,
  DsnSession,
  Image,
  Layer,
  Library,
  Net,
  Network,
  Outline,
  Padstack,
  Parser as ParserType,
  Path,
  PathShape,
  Pin,
  Placement,
  Places,
  PolygonShape,
  RectShape,
  Resolution,
  Rule,
  Shape,
  Structure,
  Wire,
  Wiring,
} from "../types"
import Debug from "debug"

const debug = Debug("dsn-converter:parse-dsn-to-dsn-json")

// **Process AST into TypeScript Interfaces**
export function parseDsnToDsnJson(dsnString: string): DsnJson {
  const tokens = tokenizeDsn(dsnString)
  const ast = parseSexprToAst(tokens)

  // Check if this is a session file or PCB file
  if (ast.type === "List" && ast.children && ast.children[0].type === "Atom") {
    const rootNode = ast.children[0].value
    if (rootNode === "session") {
      const session = processSessionNode(ast)
      return session
    } else if (rootNode === "pcb") {
      // Regular PCB file processing
      const pcb = processPcbNode(ast) as DsnPcb
      return pcb
    }
  }

  throw new Error("Invalid DSN file format")
}

// **Helper Functions to Process AST Nodes**
// The following functions map the AST nodes to the defined TypeScript interfaces.

function processPcbNode(node: ASTNode): any {
  if (node.type === "List") {
    const [head, ...tail] = node.children!
    if (head.type === "Atom" && typeof head.value === "string") {
      switch (head.value) {
        case "session":
          return processSessionNode(node)
        case "pcb":
          return processPCB(tail)
        case "parser":
          return processParser(tail)
        case "resolution":
          return processResolution(node.children!)
        case "unit":
          return node.children![1].value
        case "structure":
          return processStructure(tail)
        case "placement":
          return processPlacement(tail)
        case "library":
          return processLibrary(tail)
        case "network":
          return processNetwork(tail)
        case "wiring":
          return processWiring(tail)
        default:
          return null
      }
    }
  }
  return null
}

export function processPCB(nodes: ASTNode[]): DsnPcb {
  const pcb: Partial<DsnPcb> = {
    is_dsn_pcb: true,
    wiring: { wires: [] },
  }

  // The first element is the filename
  const filenameNode = nodes[0]
  if (filenameNode.type === "Atom" && typeof filenameNode.value === "string") {
    pcb.filename = filenameNode.value
  } else {
    throw new Error("Expected filename in pcb definition")
  }

  for (let i = 1; i < nodes.length; i++) {
    const element = nodes[i]
    if (element.type === "List") {
      const [keyNode, ...rest] = element.children!
      if (keyNode.type === "Atom" && typeof keyNode.value === "string") {
        const key = keyNode.value
        switch (key) {
          case "parser":
            pcb.parser = processParser(element.children!.slice(1))
            break
          case "resolution":
            pcb.resolution = processResolution(element.children!)
            break
          case "unit":
            if (
              element.children![1].type === "Atom" &&
              typeof element.children![1].value === "string"
            ) {
              pcb.unit = element.children![1].value
            }
            break
          case "structure":
            pcb.structure = processStructure(element.children!.slice(1)) as any
            break
          case "placement":
            pcb.placement = processPlacement(element.children!.slice(1)) as any
            break
          case "library":
            pcb.library = processLibrary(element.children!.slice(1))
            break
          case "network":
            pcb.network = processNetwork(element.children!.slice(1)) as any
            break
          case "wiring":
            pcb.wiring = processWiring(element.children!.slice(1)) as any
            break
        }
      }
    }
  }

  return pcb as DsnPcb
}

export function processParser(nodes: ASTNode[]): ParserType {
  const parser: Partial<ParserType> = {}
  nodes.forEach((node) => {
    if (node.type === "List" && node.children && node.children.length >= 2) {
      const [keyNode, valueNode] = node.children
      if (
        keyNode?.type === "Atom" &&
        typeof keyNode.value === "string" &&
        valueNode?.type === "Atom" &&
        (typeof valueNode.value === "string" ||
          typeof valueNode.value === "number")
      ) {
        const key = keyNode.value
        const value = valueNode.value
        switch (key) {
          case "string_quote":
            if (typeof value === "string") parser.string_quote = value
            break
          case "space_in_quoted_tokens":
            if (typeof value === "string") parser.space_in_quoted_tokens = value
            break
          case "host_cad":
            if (typeof value === "string") parser.host_cad = value
            break
          case "host_version":
            if (typeof value === "string") parser.host_version = value
            break
        }
      }
    }
  })
  return parser as ParserType
}

export function processResolution(nodes: ASTNode[]): Resolution {
  const [_, unitNode, valueNode] = nodes
  if (
    unitNode.type === "Atom" &&
    typeof unitNode.value === "string" &&
    valueNode.type === "Atom" &&
    typeof valueNode.value === "number"
  ) {
    return {
      unit: unitNode.value,
      value: valueNode.value,
    }
  } else {
    throw new Error("Invalid resolution format")
  }
}

export function processStructure(nodes: ASTNode[]): Structure {
  const structure: Partial<Structure> = {
    layers: [],
  }

  nodes.forEach((node) => {
    if (node.type === "List") {
      const [keyNode, ...rest] = node.children!
      if (keyNode.type === "Atom" && typeof keyNode.value === "string") {
        const key = keyNode.value
        switch (key) {
          case "layer":
            structure.layers!.push(processLayer(node.children!))
            break
          case "boundary":
            structure.boundary = processBoundary(node.children!.slice(1))
            break
          case "via":
            if (
              node.children![1].type === "Atom" &&
              typeof node.children![1].value === "string"
            ) {
              structure.via = node.children![1].value
            }
            break
          case "rule":
            structure.rule = processRule(node.children!.slice(1))
            break
        }
      }
    }
  })

  return structure as Structure
}

function processLayer(nodes: ASTNode[]): Layer {
  const layer: Partial<Layer> = {}
  if (nodes[1].type === "Atom" && typeof nodes[1].value === "string") {
    layer.name = nodes[1].value
  }

  nodes.slice(2).forEach((node) => {
    if (node.type === "List") {
      const [keyNode, ...rest] = node.children!
      if (keyNode.type === "Atom" && typeof keyNode.value === "string") {
        const key = keyNode.value
        switch (key) {
          case "type":
            if (rest[0].type === "Atom" && typeof rest[0].value === "string") {
              layer.type = rest[0].value
            }
            break
          case "property":
            layer.property = processProperty(rest)
            break
        }
      }
    }
  })

  return layer as Layer
}

function processProperty(nodes: ASTNode[]): { index: number } {
  const property: any = {}
  nodes.forEach((node) => {
    if (node.type === "List") {
      const [keyNode, valueNode] = node.children!
      if (
        keyNode.type === "Atom" &&
        typeof keyNode.value === "string" &&
        valueNode.type === "Atom" &&
        typeof valueNode.value === "number"
      ) {
        if (keyNode.value === "index") {
          property.index = valueNode.value
        }
      }
    }
  })
  return property
}

function processBoundary(nodes: ASTNode[]): Boundary {
  const boundary: Partial<Boundary> = {}
  nodes.forEach((node) => {
    if (node.type === "List" && node.children![0].type === "Atom") {
      boundary.path = processPath(node.children!)
    }
  })
  // Ensure boundary.path is defined
  if (!boundary.path) {
    boundary.path = { layer: "", width: 0, coordinates: [] }
  }
  return boundary as Boundary
}

function processPath(nodes: ASTNode[]): Path {
  // Find the path node which contains layer, width and coordinates
  const pathNode = nodes.find(
    (node) =>
      node.type === "List" &&
      node.children?.[0]?.type === "Atom" &&
      node.children[0].value === "path",
  )

  if (!pathNode) {
    // If no path node found, use the nodes directly
    // This handles the case where nodes is already the path content
    return {
      layer: nodes[1]?.type === "Atom" ? (nodes[1].value as string) : "F.Cu",
      width: nodes[2]?.type === "Atom" ? (nodes[2].value as number) : 200,
      coordinates: nodes
        .slice(3)
        .filter(
          (node) => node.type === "Atom" && typeof node.value === "number",
        )
        .map((node) => node.value as number),
    }
  }

  // Process the path node children
  const pathChildren = pathNode.children!
  return {
    layer:
      pathChildren[1]?.type === "Atom"
        ? (pathChildren[1].value as string)
        : "F.Cu",
    width:
      pathChildren[2]?.type === "Atom"
        ? (pathChildren[2].value as number)
        : 200,
    coordinates: pathChildren
      .slice(3)
      .filter((node) => node.type === "Atom" && typeof node.value === "number")
      .map((node) => node.value as number),
  }
}

function processRule(nodes: ASTNode[]): Rule {
  const rule: Partial<Rule> = {}
  rule.clearances = []

  nodes.forEach((node) => {
    if (node.type === "List") {
      const [keyNode, ...rest] = node.children!
      if (keyNode.type === "Atom" && typeof keyNode.value === "string") {
        const key = keyNode.value
        switch (key) {
          case "width":
            if (rest[0].type === "Atom" && typeof rest[0].value === "number") {
              rule.width = rest[0].value
            }
            break
          case "clearance":
            rule.clearances!.push(processClearance(node.children!))
            break
        }
      }
    }
  })

  return rule as Rule
}

function processClearance(nodes: ASTNode[]): Clearance {
  const clearance: Partial<Clearance> = {}
  if (nodes[1].type === "Atom" && typeof nodes[1].value === "number") {
    clearance.value = nodes[1].value
  }

  for (let i = 2; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === "List") {
      const [keyNode, valueNode] = node.children!
      if (
        keyNode.type === "Atom" &&
        keyNode.value === "type" &&
        valueNode.type === "Atom" &&
        typeof valueNode.value === "string"
      ) {
        clearance.type = valueNode.value
      }
    }
  }

  return clearance as Clearance
}

export function processPlacement(nodes: ASTNode[]): Placement {
  const placement: Partial<Placement> = {
    components: [],
  }

  nodes.forEach((node) => {
    if (
      node.type === "List" &&
      node.children![0].type === "Atom" &&
      node.children![0].value === "component"
    ) {
      placement.components!.push(processComponent(node.children!))
    }
  })

  return placement as Placement
}

function processComponent(nodes: ASTNode[]): ComponentPlacement {
  const component: Partial<Component> = {
    name:
      nodes[1].type === "Atom" && typeof nodes[1].value === "string"
        ? nodes[1].value
        : "",
    places: [],
  }

  nodes.slice(2).forEach((node) => {
    if (
      node.type === "List" &&
      node.children![0].type === "Atom" &&
      node.children![0].value === "place"
    ) {
      component.places!.push(processPlace(node.children!))
    }
  })

  return component as ComponentPlacement
}

function processPlace(nodes: ASTNode[]): Places {
  const places: Partial<Places> = {}

  // Ensure we have at least the basic required nodes
  if (
    nodes.length < 2 ||
    nodes[0].type !== "Atom" ||
    nodes[0].value !== "place"
  ) {
    throw new Error("Invalid place format: missing basic structure")
  }

  // Process refdes (component reference designator)
  if (nodes[1].type === "Atom" && typeof nodes[1].value === "string") {
    places.refdes = nodes[1].value
  } else {
    throw new Error("Invalid place format: invalid refdes")
  }

  // Process coordinates and rotation
  const coordIndex = 2
  if (coordIndex + 3 < nodes.length) {
    if (
      nodes[coordIndex].type === "Atom" &&
      typeof nodes[coordIndex].value === "number" &&
      nodes[coordIndex + 1].type === "Atom" &&
      typeof nodes[coordIndex + 1].value === "number" &&
      nodes[coordIndex + 2].type === "Atom" &&
      typeof nodes[coordIndex + 2].value === "string" &&
      nodes[coordIndex + 3].type === "Atom" &&
      typeof nodes[coordIndex + 3].value === "number"
    ) {
      places.x = nodes[coordIndex].value as number
      places.y = nodes[coordIndex + 1].value as number
      places.side = nodes[coordIndex + 2].value as string
      places.rotation = nodes[coordIndex + 3].value as number
    }
  }

  // Process optional PN (part number) if present
  for (let i = coordIndex + 4; i < nodes.length; i++) {
    const node = nodes[i]
    if (
      node.type === "List" &&
      node.children &&
      node.children[0].type === "Atom" &&
      node.children[0].value === "PN" &&
      node.children[1] &&
      node.children[1].type === "Atom"
    ) {
      places.PN = String(node.children[1].value)
      break
    }
  }

  // Set default values if not present
  places.PN = places.PN || ""
  places.side = places.side || "front"
  places.rotation = places.rotation || 0

  return places as Places
}

export function processLibrary(nodes: ASTNode[]): Library {
  const library: Partial<Library> = {
    images: [],
    padstacks: [],
  }

  nodes.forEach((node) => {
    if (node.type === "List") {
      const [keyNode, ...rest] = node.children!
      if (keyNode.type === "Atom" && typeof keyNode.value === "string") {
        const key = keyNode.value
        switch (key) {
          case "image":
            library.images!.push(processImage(node.children!))
            break
          case "padstack":
            library.padstacks!.push(processPadstack(node.children!))
            break
        }
      }
    }
  })

  return library as Library
}

function processImage(nodes: ASTNode[]): Image {
  const image: Partial<Image> = {}
  if (nodes[1].type === "Atom" && typeof nodes[1].value === "string") {
    image.name = nodes[1].value
  }
  image.outlines = []
  image.pins = []

  nodes.slice(2).forEach((node) => {
    if (node.type === "List") {
      const [keyNode, ...rest] = node.children!
      if (keyNode.type === "Atom" && typeof keyNode.value === "string") {
        const key = keyNode.value
        if (key === "outline") {
          image.outlines!.push(processOutline(node.children!))
        } else if (key === "pin") {
          image.pins!.push(processPin(node.children!))
        }
      }
    }
  })

  return image as Image
}

function processOutline(nodes: ASTNode[]): Outline {
  const outline: Partial<Outline> = {}
  nodes.forEach((node) => {
    if (
      node.type === "List" &&
      node.children![0].type === "Atom" &&
      node.children![0].value === "path"
    ) {
      outline.path = processPath(node.children!)
    }
  })
  return outline as Outline
}

function processPin(nodes: ASTNode[]): Pin {
  const pin: Partial<Pin> = {}
  // default pin
  pin.padstack_name = "default"
  pin.pin_number = 1
  pin.x = 0
  pin.y = 0

  try {
    // Get padstack name
    // Get padstack name
    if (nodes[1]?.type === "Atom") {
      pin.padstack_name = String(nodes[1].value)
    } else {
      throw new Error("Missing padstack name")
    }

    // Helper function to parse pin number
    const parsePinNumber = (value: any): number | string => {
      if (typeof value === "number") {
        return value
      }
      const parsed = parseInt(String(value), 10)
      return Number.isNaN(parsed) ? String(value) : parsed
    }

    // Get pin number
    if (nodes[2]?.type === "Atom") {
      pin.pin_number = parsePinNumber(nodes[2].value)
    } else {
      console.warn("Warning: Missing pin number")
      console.error("Missing pin number")
    }

    //   if (nodes[1]?.type === "Atom") {
    //     pin.padstack_name = String(nodes[1].value)
    //   } else {
    //     throw new Error("Missing padstack name")
    //   }

    //   // Get pin number
    //   if (nodes[2]?.type === "Atom") {
    //     if (typeof nodes[2].value === "number") {
    //       pin.pin_number = nodes[2].value
    //     } else {
    //       const parsed = parseInt(String(nodes[2].value), 10)
    //       pin.pin_number = Number.isNaN(parsed) ? String(nodes[2].value) : parsed
    //     }
    //   } else if (nodes[2]?.type === "List") {
    //   nodes[2].children?.forEach((node) => {
    //     if (typeof node.value === "number") {
    //       pin.pin_number =node.value
    //     } else {
    //       const parsed = parseInt(String(node.value), 10)
    //       pin.pin_number = Number.isNaN(parsed) ? String(node.value) : parsed
    //     }
    // })

    // }else{
    //     throw new Error("Missing pin number")
    //   }

    // Check for rotate property

    // if (nodes[1]?.type === "Atom") {
    //   pin.padstack_name = String(nodes[1].value)
    // } else {
    //   throw new Error("Missing padstack name")
    // }

    // // Get pin number
    // if (nodes[2]?.type === "Atom") {
    //   console.log("nodes[2].value", nodes[2].value)
    //   if (typeof nodes[2].value === "number") {
    //     pin.pin_number = nodes[2].value
    //   } else {
    //     const parsed = parseInt(String(nodes[2].value), 10)
    //     pin.pin_number = Number.isNaN(parsed) ? String(nodes[2].value) : parsed
    //   }
    // } else {
    //   console.log("nodes[1]",nodes[1],"nodes[2]", nodes[2])
    //   throw new Error("Missing pin number")
    // }

    // Handle coordinates, accounting for scientific notation
    let xValue: number | undefined
    let yValue: number | undefined

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
        }
      }
    }

    if (typeof xValue !== "number") {
      throw new Error(`Invalid x coordinate: ${xValue}`)
    }
    if (typeof yValue !== "number") {
      throw new Error(`Invalid y coordinate: ${yValue}`)
    }

    pin.x = xValue
    pin.y = yValue

    return pin as Pin
  } catch (error) {
    console.error("Pin processing error:", error)
    console.error("Problematic nodes:", JSON.stringify(nodes, null, 2))
    throw error
  }
}

function processPadstack(nodes: ASTNode[]): Padstack {
  const padstack: Partial<Padstack> = {}
  if (nodes[1].type === "Atom" && typeof nodes[1].value === "string") {
    padstack.name = nodes[1].value
  }
  padstack.shapes = []
  padstack.attach = "off" // default value

  nodes.slice(2).forEach((node) => {
    if (node.type === "List") {
      const [keyNode, ...rest] = node.children!
      if (keyNode.type === "Atom" && typeof keyNode.value === "string") {
        const key = keyNode.value
        if (key === "shape") {
          padstack.shapes!.push(processShape(node.children!))
        } else if (key === "attach") {
          if (rest[0].type === "Atom" && typeof rest[0].value === "string") {
            padstack.attach = rest[0].value
          }
        }
      }
    }
  })

  return padstack as Padstack
}

function processShape(nodes: ASTNode[]): Shape {
  const [_, shapeContentNode, ...rest] = nodes

  if (shapeContentNode.type === "List") {
    const [shapeTypeNode, layerNode, ...shapeData] = shapeContentNode.children!

    if (
      shapeTypeNode.type === "Atom" &&
      typeof shapeTypeNode.value === "string"
    ) {
      const shapeType = shapeTypeNode.value

      switch (shapeType) {
        case "polygon":
          return processPolygonShape(shapeContentNode.children!)
        case "circle":
          return processCircleShape(shapeContentNode.children!)
        case "rect":
          return processRectShape(shapeContentNode.children!)
        case "path":
          return processPathShape(shapeContentNode.children!)
      }
    }
  }

  console.error("Shape processing error for nodes:", nodes)
  throw new Error(`Unknown shape type for nodes: ${JSON.stringify(nodes)}`)
}

function processRectShape(nodes: ASTNode[]): RectShape {
  // Shape format: (rect F.Cu x1 y1 x2 y2)
  if (nodes.length < 6) {
    throw new Error("Invalid rect shape format: insufficient nodes")
  }

  if (
    nodes[0].type === "Atom" &&
    nodes[0].value === "rect" &&
    nodes[1].type === "Atom" &&
    typeof nodes[1].value === "string" &&
    nodes[2].type === "Atom" &&
    typeof nodes[2].value === "number" &&
    nodes[3].type === "Atom" &&
    typeof nodes[3].value === "number" &&
    nodes[4].type === "Atom" &&
    typeof nodes[4].value === "number" &&
    nodes[5].type === "Atom" &&
    typeof nodes[5].value === "number"
  ) {
    return {
      shapeType: "rect",
      layer: nodes[1].value,
      coordinates: [
        nodes[2].value,
        nodes[3].value,
        nodes[4].value,
        nodes[5].value,
      ],
    }
  }

  throw new Error("Invalid rect shape format")
}

function processPolygonShape(nodes: ASTNode[]): PolygonShape {
  const polygon: Partial<PolygonShape> = {
    shapeType: "polygon",
  }

  if (
    nodes[1].type === "Atom" &&
    typeof nodes[1].value === "string" &&
    nodes[2].type === "Atom" &&
    typeof nodes[2].value === "number"
  ) {
    polygon.layer = nodes[1].value
    polygon.width = nodes[2].value
    polygon.coordinates = []
    for (let i = 3; i < nodes.length; i++) {
      const coordNode = nodes[i]
      if (coordNode.type === "Atom" && typeof coordNode.value === "number") {
        polygon.coordinates.push(coordNode.value)
      } else {
        throw new Error("Invalid coordinate in polygon shape")
      }
    }
    return polygon as PolygonShape
  } else {
    throw new Error("Invalid polygon shape format")
  }
}

function processCircleShape(nodes: ASTNode[]): CircleShape {
  const circle: Partial<CircleShape> = {
    shapeType: "circle",
  }

  // Handle both direct circle nodes and nested shape nodes
  const shapeNodes = nodes[0].value === "shape" ? nodes[1].children! : nodes

  if (
    shapeNodes[1]?.type === "Atom" &&
    typeof shapeNodes[1].value === "string" &&
    shapeNodes[2]?.type === "Atom" &&
    typeof shapeNodes[2].value === "number"
  ) {
    circle.layer = shapeNodes[1].value
    circle.diameter = shapeNodes[2].value
    return circle as CircleShape
  } else {
    // Try to extract coordinates if they exist
    const coords = shapeNodes
      .slice(2)
      .filter((n) => n.type === "Atom" && typeof n.value === "number")
    if (coords.length >= 3) {
      if (shapeNodes[1]?.type === "Atom") {
        circle.layer = String(shapeNodes[1].value)
        circle.diameter = Number(coords[2].value)
        return circle as CircleShape
      }
      throw new Error("Invalid circle shape format: missing layer")
    }
    throw new Error("Invalid circle shape format")
  }
}

export function processNetwork(nodes: ASTNode[]): Network {
  const network: Partial<Network> = {
    nets: [],
    classes: [],
  }

  nodes.forEach((node) => {
    if (node.type === "List") {
      const [keyNode, ...rest] = node.children!
      if (keyNode.type === "Atom" && typeof keyNode.value === "string") {
        const key = keyNode.value
        if (key === "net") {
          network.nets!.push(processNet(node.children!))
        } else if (key === "class") {
          network.classes!.push(processClass(node.children!))
        }
      }
    }
  })
  return network as Network
}

function processNet(nodes: ASTNode[]): Net {
  const net: Partial<Net> = {}
  if (nodes[1].type === "Atom") {
    net.name = nodes[1].value?.toString()
  }

  nodes.slice(2).forEach((node) => {
    if (
      node.type === "List" &&
      node.children![0].type === "Atom" &&
      node.children![0].value === "pins"
    ) {
      net.pins = node.children!.slice(1).map((pinNode) => {
        if (pinNode.type === "Atom" && typeof pinNode.value === "string") {
          return pinNode.value
        } else {
          throw new Error("Invalid pin in net")
        }
      })
    }
  })
  return net as Net
}

function processClass(nodes: ASTNode[]): Class {
  const classObj: Partial<Class> = {}
  if (
    nodes[1].type === "Atom" &&
    typeof nodes[1].value === "string" &&
    nodes[2].type === "Atom" &&
    typeof nodes[2].value === "string"
  ) {
    classObj.name = nodes[1].value
    classObj.description = nodes[2].value
  }

  // The next nodes until 'circuit' are net names
  let i = 3
  classObj.net_names = []
  while (
    i < nodes.length &&
    nodes[i].type === "Atom" &&
    typeof nodes[i].value === "string" &&
    nodes[i].value !== undefined
  ) {
    classObj.net_names.push(nodes[i].value as string)
    i++
  }

  // Now process 'circuit' and 'rule'
  while (i < nodes.length) {
    const node = nodes[i]
    if (node.type === "List") {
      const [keyNode, ...rest] = node.children!
      if (keyNode.type === "Atom" && typeof keyNode.value === "string") {
        const key = keyNode.value
        if (key === "circuit") {
          classObj.circuit = processCircuit(node.children!.slice(1))
        } else if (key === "rule") {
          classObj.rule = processRule(node.children!.slice(1))
        }
      }
    }
    i++
  }

  return classObj as Class
}

function processCircuit(nodes: ASTNode[]): Circuit {
  const circuit: Partial<Circuit> = {}
  nodes.forEach((node) => {
    if (
      node.type === "List" &&
      node.children![0].type === "Atom" &&
      node.children![0].value === "use_via"
    ) {
      if (
        node.children![1].type === "Atom" &&
        typeof node.children![1].value === "string"
      ) {
        circuit.use_via = node.children![1].value
      }
    }
  })
  return circuit as Circuit
}

export function processWiring(nodes: ASTNode[]): Wiring {
  const wiring: Partial<Wiring> = {
    wires: [],
  }

  nodes.forEach((node) => {
    if (
      node.type === "List" &&
      node.children![0].type === "Atom" &&
      node.children![0].value === "wire"
    ) {
      wiring.wires!.push(processWire(node.children!))
    }
    if (
      node.type === "List" &&
      node.children![0].type === "Atom" &&
      node.children![0].value === "via"
    ) {
      wiring.wires!.push(processVia(node.children!))
    }
  })

  return wiring as Wiring
}

function processVia(nodes: ASTNode[]): Wire {
  const wire: Partial<Wire> = {
    type: "via",
    path: {
      layer: "all", // Default: vias connect all layers
      width: 0, // Default width
      coordinates: [], // Fallback to empty if coordinates are missing
    },
  }

  // Find the path node which contains coordinates
  const pathNode = nodes.find(
    (node) =>
      node.type === "List" &&
      node.children?.[0]?.type === "Atom" &&
      node.children[0].value === "path",
  )

  if (pathNode?.children) {
    const coords = pathNode.children
      .filter((node) => node.type === "Atom" && typeof node.value === "number")
      .slice(-2) // Take last two numbers as x, y coordinates

    if (coords.length === 2) {
      wire.path!.coordinates = coords.map((node) => node.value as number)
    } else {
      console.warn("Warning: Missing or incomplete coordinates for via")
      console.error("problematic node", nodes)
    }
  } else {
    console.warn("Warning: Missing path node for via")
    console.error("problematic node", nodes)
  }

  // Find net name if present
  const netNode = nodes.find(
    (node) =>
      node.type === "List" &&
      node.children?.[0]?.type === "Atom" &&
      node.children[0].value === "net",
  )
  if (netNode?.children?.[1]?.type === "Atom") {
    wire.net = String(netNode.children[1].value)
  } else {
    console.warn("Warning: Missing net information for via")
    console.error("problematic node", nodes)
  }

  return wire as Wire
}

// function processVia(nodes: ASTNode[]): Wire {
//   const wire: Partial<Wire> = {}

//   // Find the path node which contains coordinates
//   const pathNode = nodes.find(
//     (node) =>
//       node.type === "List" &&
//       node.children?.[0]?.type === "Atom" &&
//       node.children[0].value === "path",
//   )

//   if (pathNode?.children) {
//     const coords = pathNode.children
//       .filter((node) => node.type === "Atom" && typeof node.value === "number")
//       .slice(-2) // Take last two numbers as x,y coordinates

//     if (coords.length === 2) {
//       wire.path = {
//         layer: "all", // vias connect all layers
//         width: 0, // width is defined by the padstack
//         coordinates: coords.map((node) => node.value as number),
//       }
//       wire.type = "via"

//       // Find net name if present
//       const netNode = nodes.find(
//         (node) =>
//           node.type === "List" &&
//           node.children?.[0]?.type === "Atom" &&
//           node.children[0].value === "net",
//       )
//       if (netNode?.children?.[1]?.type === "Atom") {
//         wire.net = String(netNode.children[1].value)
//       }

//       return wire as Wire
//     }
//   }

//   console.log("nodes", nodes)
//   throw new Error("Invalid via format")
// }

function processWire(nodes: ASTNode[]): Wire {
  const wire: Partial<Wire> = {}

  nodes.forEach((node) => {
    if (node.type === "List") {
      const [keyNode, ...rest] = node.children!
      if (keyNode.type === "Atom" && typeof keyNode.value === "string") {
        const key = keyNode.value
        switch (key) {
          case "path":
            wire.path = processPath(node.children!)
            break
          case "polyline_path":
            // Handle polyline path similar to regular path
            if (
              rest.length >= 2 &&
              rest[0].type === "Atom" &&
              typeof rest[0].value === "string" &&
              rest[1].type === "Atom" &&
              typeof rest[1].value === "number"
            ) {
              wire.polyline_path = {
                layer: rest[0].value,
                width: rest[1].value,
                coordinates: rest
                  .slice(2)
                  .filter(
                    (n) => n.type === "Atom" && typeof n.value === "number",
                  )
                  .map((n) => n.value as number),
              }
            }
            break
          case "net":
            if (rest[0].type === "Atom" && typeof rest[0].value === "string") {
              wire.net = rest[0].value
            }
            break
          case "clearance_class":
            if (rest[0].type === "Atom" && typeof rest[0].value === "string") {
              wire.clearance_class = rest[0].value
            }
            break
          case "type":
            if (rest[0].type === "Atom" && typeof rest[0].value === "string") {
              wire.type = rest[0].value
            }
            break
        }
      }
    }
  })

  return wire as Wire
}

function processSessionNode(ast: ASTNode): DsnSession {
  const session: DsnSession = {
    is_dsn_session: true,
    filename:
      ast.children![1].type === "Atom"
        ? (ast.children![1].value as string)
        : "session",
    placement: {
      resolution: { unit: "um", value: 10 },
      components: [],
    },
    routes: {
      resolution: { unit: "um", value: 10 },
      parser: {
        string_quote: "",
        host_version: "",
        space_in_quoted_tokens: "",
        host_cad: "",
      },
      network_out: {
        nets: [],
      },
    },
  }

  // Extract placement section
  const placementNode = ast.children!.find(
    (child) =>
      child.type === "List" &&
      child.children?.[0].type === "Atom" &&
      child.children[0].value === "placement",
  )
  if (placementNode) {
    const resolutionNode = placementNode.children!.find(
      (child) =>
        child.type === "List" &&
        child.children?.[0].type === "Atom" &&
        child.children[0].value === "resolution",
    )
    if (resolutionNode) {
      session.placement.resolution = processResolution(resolutionNode.children!)
    }
    session.placement.components = processPlacement(
      placementNode.children!.slice(1),
    ).components
  }

  // Extract routes section
  const routesNode = ast.children!.find(
    (child) =>
      child.type === "List" &&
      child.children?.[0].type === "Atom" &&
      child.children[0].value === "routes",
  )
  if (routesNode) {
    // Extract library_out section
    const libraryNode = routesNode.children!.find(
      (child) =>
        child.type === "List" &&
        child.children?.[0].type === "Atom" &&
        child.children[0].value === "library_out",
    )
    if (libraryNode) {
      session.routes.library_out = {
        images: [],
        padstacks: libraryNode
          .children!.filter(
            (child) =>
              child.type === "List" &&
              child.children?.[0].type === "Atom" &&
              child.children[0].value === "padstack",
          )
          .map((padstackNode) => processPadstack(padstackNode.children!)),
      }
    }

    // Extract network_out section
    const networkNode = routesNode.children!.find(
      (child) =>
        child.type === "List" &&
        child.children?.[0].type === "Atom" &&
        child.children[0].value === "network_out",
    )
    if (networkNode) {
      const netNodes = networkNode.children!.filter(
        (child) =>
          child.type === "List" &&
          child.children?.[0].type === "Atom" &&
          child.children[0].value === "net",
      )

      session.routes.network_out.nets = netNodes.map((netNode) => {
        const netName = netNode.children![1].value as string
        const wireNodes = netNode.children!.filter(
          (child) =>
            child.type === "List" &&
            child.children?.[0].type === "Atom" &&
            child.children[0].value === "wire",
        )

        const viaNodes = netNode.children!.filter(
          (child) =>
            child.type === "List" &&
            child.children?.[0].type === "Atom" &&
            child.children[0].value === "via",
        )

        const net = {
          name: netName,
          wires: wireNodes.map((wireNode) => ({
            path: processPath(wireNode.children!.slice(1)),
            net: netName,
            type: "route",
          })),
          vias: viaNodes.map((viaNode) => ({
            x: viaNode.children![2].value as number,
            y: viaNode.children![3].value as number,
          })),
        }

        return net
      })
    }
  }

  return session
}

function processPathShape(nodes: ASTNode[]): PathShape {
  if (
    nodes[1]?.type === "Atom" &&
    typeof nodes[1].value === "string" &&
    nodes[2]?.type === "Atom" &&
    typeof nodes[2].value === "number"
  ) {
    return {
      shapeType: "path",
      layer: nodes[1].value,
      width: nodes[2].value,
      coordinates: nodes
        .slice(3)
        .filter(
          (node) => node.type === "Atom" && typeof node.value === "number",
        )
        .map((node) => node.value as number),
    }
  }
  throw new Error("Invalid path shape format")
}
