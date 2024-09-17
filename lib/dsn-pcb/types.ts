export interface PCB {
  filename: string;
  parser: Parser;
  resolution: Resolution;
  unit: string;
  structure: Structure;
  placement: Placement;
  library: Library;
  network: Network;
  wiring: Wiring;
}

export interface Parser {
  string_quote: string;
  space_in_quoted_tokens: string;
  host_cad: string;
  host_version: string;
}

export interface Resolution {
  unit: string;
  value: number;
}

export interface Structure {
  layers: Layer[];
  boundary: Boundary;
  via: string;
  rule: Rule;
}

export interface Layer {
  name: string;
  type: string;
  property: {
    index: number;
  };
}

export interface Boundary {
  path: Path;
}

export interface Path {
  layer: string;
  width: number;
  coordinates: number[];
}

export interface Rule {
  width: number;
  clearances: Clearance[];
}

export interface Clearance {
  value: number;
  type?: string;
}

export interface Placement {
  components: Component[];
}

export interface Component {
  name: string;
  place: Place;
}

export interface Place {
  refdes: string;
  x: number;
  y: number;
  side: string;
  rotation: number;
  PN: string;
}

export interface Library {
  images: Image[];
  padstacks: Padstack[];
}

export interface Image {
  name: string;
  outlines: Outline[];
  pins: Pin[];
}

export interface Outline {
  path: Path;
}

export interface Pin {
  padstack_name: string;
  pin_number: number;
  x: number;
  y: number;
}

export interface Padstack {
  name: string;
  shapes: Shape[];
  attach: string;
}

export type Shape = PolygonShape | CircleShape;

export interface BaseShape {
  shapeType: string; // Added shapeType to base export interface
  layer: string;
}

export interface PolygonShape extends BaseShape {
  shapeType: 'polygon';
  width: number;
  coordinates: number[];
}

export interface CircleShape extends BaseShape {
  shapeType: 'circle';
  diameter: number;
}

export interface Network {
  nets: Net[];
  classes: Class[];
}

export interface Net {
  name: string;
  pins: string[];
}

export interface Class {
  name: string;
  description: string;
  net_names: string[];
  circuit: Circuit;
  rule: Rule;
}

export interface Circuit {
  use_via: string;
}

export interface Wiring {
  wires: Wire[];
}

export interface Wire {
  path: Path;
  net: string;
  type: string;
}
