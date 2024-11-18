import type { PcbSmtPad } from "circuit-json"

export interface DsnPcb {
  is_dsn_pcb: true
  is_dsn_session?: false
  filename: string
  parser: {
    string_quote: string
    host_version: string
    space_in_quoted_tokens: string
    host_cad: string
  }
  resolution: {
    unit: string
    value: number
  }
  unit: string
  structure: {
    layers: Array<{
      name: string
      type: string
      property: {
        index: number
      }
    }>
    boundary: {
      path: {
        layer: string
        width: number
        coordinates: number[]
      }
    }
    via: string
    rule: {
      clearances: Array<{
        value: number
        type?: string
      }>
      width: number
    }
  }
  placement: {
    components: Array<{
      name: string
      place: {
        refdes: string
        PN?: string
        x: number
        y: number
        side: "front" | "back"
        rotation: number
      }
    }>
  }
  library: {
    images: Image[]
    padstacks: Padstack[]
  }
  network: {
    nets: Array<{
      name: string
      pins: string[]
    }>
    classes: Array<{
      name: string
      description: string
      net_names: string[]
      circuit: {
        use_via: string
      }
      rule: {
        clearances: Array<{
          type: any
          value: number
        }>
        width: number
      }
    }>
  }
  wiring: {
    wires: Array<{
      path: {
        layer: string
        width: number
        /**
         * TODO UNIT?
         */
        coordinates: number[]
      }
      net: string
      type: string
    }>
  }
}

export interface Parser {
  string_quote: string
  space_in_quoted_tokens: string
  host_cad: string
  host_version: string
}

export interface Resolution {
  unit: string
  value: number
}

export interface Structure {
  layers: Layer[]
  boundary: Boundary
  via: string
  rule: Rule
}

export interface Layer {
  name: string
  type: string
  property: {
    index: number
  }
}

export interface Boundary {
  rect?: {
    type: string
    coordinates: number[] // [x1, y1, x2, y2]
  }
  polygon?: {
    type: string
    width: number
    coordinates: number[]
  }
  path?: {
    layer: string
    width: number
    coordinates: number[]
  }
}

export interface Path {
  layer: string
  width: number
  coordinates: number[]
}

export interface Rule {
  width: number
  clearances: Clearance[]
}

export interface Clearance {
  value: number
  type?: string
}

export interface Placement {
  components: Component[]
}

export interface Component {
  name: string
  place: Place
}

export interface Place {
  refdes: string
  x: number
  y: number
  side: string
  rotation: number
  PN: string
}

export interface Library {
  images: Image[]
  padstacks: Padstack[]
}

export interface Image {
  name: string
  outlines: Outline[]
  pins: Pin[]
}

export interface Outline {
  path: Path
}

export interface Pin {
  padstack_name: string
  pin_number: number
  x: number
  y: number
}

export interface Padstack {
  name: string
  shapes: Shape[]
  attach: string
}

export interface PadDimensions {
  width: number
  height: number
  radius?: number
}

export type Shape = PolygonShape | CircleShape | RectShape

export interface BaseShape {
  shapeType: string // Added shapeType to base export interface
  layer: string
}

export interface PolygonShape extends BaseShape {
  shapeType: "polygon"
  width: number
  coordinates: number[]
}

export interface CircleShape extends BaseShape {
  shapeType: "circle"
  diameter: number
}

export interface RectShape extends BaseShape {
  shapeType: "rect"
  coordinates: number[]
}

export interface Network {
  nets: Net[]
  classes: Class[]
}

export interface Net {
  name: string
  pins: string[]
}

export interface Class {
  name: string
  description: string
  net_names: string[]
  circuit: Circuit
  rule: Rule
}

export interface Circuit {
  use_via: string
}

export interface Wiring {
  wires: Wire[]
}

export interface Wire {
  polyline_path?: {
    layer: string
    width: number
    coordinates: number[]
  }
  path?: {
    layer: string
    width: number
    coordinates: number[]
  }
  net: string
  clearance_class?: string
  type?: string
}

export interface DsnSession {
  is_dsn_session: true
  is_dsn_pcb?: false
  filename: string
  placement: {
    resolution: Resolution
    components: Array<{
      name: string
      place: Place
    }>
  }
  routes: {
    resolution: Resolution
    parser: Parser
    library_out?: {
      padstacks: Padstack[]
    }
    network_out: {
      nets: Array<{
        name: string
        wires: Wire[]
      }>
    }
  }
}

export interface ComponentGroup {
  pcb_component_id: string
  pcb_smtpads: PcbSmtPad[]
}

export type DsnJson = DsnPcb | DsnSession
