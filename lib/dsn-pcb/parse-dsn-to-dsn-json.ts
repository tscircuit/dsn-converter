import type {
  Boundary,
  CircleShape,
  Circuit,
  Class,
  Clearance,
  Component,
  Image,
  Layer,
  Library,
  Net,
  Network,
  Outline,
  DsnPcb,
  Padstack,
  Parser as ParserType,
  Path,
  Pin,
  Place,
  Placement,
  PolygonShape,
  Resolution,
  Rule,
  Shape,
  Structure,
  Wire,
  Wiring,
} from "./types"
import {
  parseSexprToAst,
  tokenizeDsn,
  type ASTNode,
} from "../common/parse-sexpr"

// **Process AST into TypeScript Interfaces**
export function parseDsnToDsnJson(dsnString: string): DsnPcb {
  const tokens = tokenizeDsn(dsnString)
  const ast = parseSexprToAst(tokens)

  // Process the AST into PCB object
  const pcb = processNode(ast) as DsnPcb

  return pcb
}

// **Helper Functions to Process AST Nodes**
// The following functions map the AST nodes to the defined TypeScript interfaces.

function processNode(node: ASTNode): any {
  if (node.type === "List") {
    const [head, ...tail] = node.children!
    if (head.type === "Atom" && typeof head.value === "string") {
      switch (head.value) {
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
  const pcb: Partial<DsnPcb> = {}

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
            pcb.structure = processStructure(element.children!.slice(1))
            break
          case "placement":
            pcb.placement = processPlacement(element.children!.slice(1))
            break
          case "library":
            pcb.library = processLibrary(element.children!.slice(1))
            break
          case "network":
            pcb.network = processNetwork(element.children!.slice(1))
            break
          case "wiring":
            pcb.wiring = processWiring(element.children!.slice(1))
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
    if (node.type === "List") {
      const [keyNode, valueNode] = node.children!
      if (
        keyNode.type === "Atom" &&
        typeof keyNode.value === "string" &&
        valueNode.type === "Atom" &&
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
    if (
      node.type === "List" &&
      node.children![0].type === "Atom" &&
      node.children![0].value === "path"
    ) {
      boundary.path = processPath(node.children!)
    }
  })
  return boundary as Boundary
}

function processPath(nodes: ASTNode[]): Path {
  const path: Partial<Path> = {}
  if (
    nodes[1].type === "Atom" &&
    typeof nodes[1].value === "string" &&
    nodes[2].type === "Atom" &&
    typeof nodes[2].value === "number"
  ) {
    path.layer = nodes[1].value
    path.width = nodes[2].value
    path.coordinates = []
    for (let i = 3; i < nodes.length; i++) {
      const coordNode = nodes[i]
      if (coordNode.type === "Atom" && typeof coordNode.value === "number") {
        path.coordinates.push(coordNode.value)
      } else {
        throw new Error("Invalid coordinate in path")
      }
    }
    return path as Path
  } else {
    throw new Error("Invalid path format")
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
    const [shapeTypeNode, ...shapeRest] = shapeContentNode.children!
    if (
      shapeTypeNode.type === "Atom" &&
      typeof shapeTypeNode.value === "string"
    ) {
      const shapeType = shapeTypeNode.value
      if (shapeType === "polygon") {
        return processPolygonShape(shapeContentNode.children!)
      } else if (shapeType === "circle") {
        return processCircleShape(shapeContentNode.children!)
      }
    }
  }

  throw new Error("Unknown shape type")
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
    typeof nodes[i].value === "string"
  ) {
    classObj.net_names.push(nodes[i].value)
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
        if (key === "path") {
          wire.path = processPath(node.children!)
        } else if (key === "net") {
          if (rest[0].type === "Atom" && typeof rest[0].value === "string") {
            wire.net = rest[0].value
          }
        } else if (key === "type") {
          if (rest[0].type === "Atom" && typeof rest[0].value === "string") {
            wire.type = rest[0].value
          }
        }
      }
    }
  })

  return wire as Wire
}
