import {
  parseSexprToAst,
  tokenizeDsn,
  type ASTNode,
} from "../../common/parse-sexpr"
import type {
  Boundary,
  CircleShape,
  Circuit,
  Class,
  Clearance,
  Component,
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
  Pin,
  Place,
  Placement,
  PolygonShape,
  RectShape,
  Resolution,
  Rule,
  Shape,
  Structure,
  Wire,
  Wiring,
} from "../types"

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
  const path: Partial<Path> = {
    coordinates: [],
    layer: "F.Cu", // Default layer
    width: 200, // Default width
  }

  // Skip the first node which is usually the keyword (e.g., "path", "wire")
  const startIndex = nodes[0]?.type === "Atom" ? 1 : 0

  // Check if we have explicit layer and width
  if (
    nodes.length >= startIndex + 2 &&
    nodes[startIndex]?.type === "Atom" &&
    typeof nodes[startIndex].value === "string" &&
    nodes[startIndex + 1]?.type === "Atom" &&
    typeof nodes[startIndex + 1].value === "number"
  ) {
    path.layer = nodes[startIndex].value
    path.width = nodes[startIndex + 1].value as number

    // Process coordinates after layer and width
    for (let i = startIndex + 2; i < nodes.length; i++) {
      const coordNode = nodes[i]
      if (coordNode?.type === "Atom" && typeof coordNode.value === "number") {
        path.coordinates!.push(coordNode.value)
      }
    }
  } else {
    // Process all valid number nodes as coordinates
    for (let i = startIndex; i < nodes.length; i++) {
      const node = nodes[i]
      if (node?.type === "Atom" && typeof node.value === "number") {
        path.coordinates!.push(node.value)
      }
    }
  }

  // Ensure we have valid coordinates even if empty
  if (!Array.isArray(path.coordinates)) {
    path.coordinates = []
  }

  return path as Path
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

function processComponent(nodes: ASTNode[]): Component {
  const component: Partial<Component> = {}
  if (nodes[1].type === "Atom" && typeof nodes[1].value === "string") {
    component.name = nodes[1].value
  }

  nodes.slice(2).forEach((node) => {
    if (
      node.type === "List" &&
      node.children![0].type === "Atom" &&
      node.children![0].value === "place"
    ) {
      component.place = processPlace(node.children!)
    }
  })

  return component as Component
}

function processPlace(nodes: ASTNode[]): Place {
  const place: Partial<Place> = {}
  if (
    nodes[1].type === "Atom" &&
    typeof nodes[1].value === "string" &&
    nodes[2].type === "Atom" &&
    typeof nodes[2].value === "number" &&
    nodes[3].type === "Atom" &&
    typeof nodes[3].value === "number" &&
    nodes[4].type === "Atom" &&
    typeof nodes[4].value === "string" &&
    nodes[5].type === "Atom" &&
    typeof nodes[5].value === "number"
  ) {
    place.refdes = nodes[1].value
    place.x = nodes[2].value
    place.y = nodes[3].value
    place.side = nodes[4].value
    place.rotation = nodes[5].value

    // The rest may contain (PN value)
    for (let i = 6; i < nodes.length; i++) {
      const node = nodes[i]
      if (
        node.type === "List" &&
        node.children![0].type === "Atom" &&
        node.children![0].value === "PN"
      ) {
        if (
          node.children![1].type === "Atom" &&
          typeof node.children![1].value === "string"
        ) {
          place.PN = node.children![1].value
        }
      }
    }
  } else {
    throw new Error("Invalid place format")
  }

  return place as Place
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
  if (
    nodes[1].type === "Atom" &&
    typeof nodes[1].value === "string" &&
    nodes[2].type === "Atom" &&
    (typeof nodes[2].value === "string" ||
      typeof nodes[2].value === "number") &&
    nodes[3].type === "Atom" &&
    typeof nodes[3].value === "number" &&
    nodes[4].type === "Atom" &&
    typeof nodes[4].value === "number"
  ) {
    pin.padstack_name = nodes[1].value
    if (typeof nodes[2].value === "number") {
      pin.pin_number = nodes[2].value
    } else {
      pin.pin_number = parseInt(nodes[2].value, 10)
    }
    pin.x = nodes[3].value
    pin.y = nodes[4].value
  } else {
    throw new Error("Invalid pin format")
  }
  return pin as Pin
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

  if (
    nodes[1].type === "Atom" &&
    typeof nodes[1].value === "string" &&
    nodes[2].type === "Atom" &&
    typeof nodes[2].value === "number"
  ) {
    circle.layer = nodes[1].value
    circle.diameter = nodes[2].value
    return circle as CircleShape
  } else {
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
  if (nodes[1].type === "Atom" && typeof nodes[1].value === "string") {
    net.name = nodes[1].value
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
  })

  return wiring as Wiring
}

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
        padstacks: libraryNode.children!
          .filter(
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

        return {
          name: netName,
          wires: wireNodes.map((wireNode) => ({
            path: processPath(wireNode.children!.slice(1)),
            net: netName,
            type: "route",
          })),
        }
      })
    }
  }

  return session
}
