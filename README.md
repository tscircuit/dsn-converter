# dsn-converter

A TypeScript library for converting between DSN files and Circuit JSON format.

## Overview

dsn-converter is a powerful tool that enables bidirectional conversion between Specctr DSN format and Circuit JSON. This makes it possible to:

- Parse Specctra DSN files into a workable JSON format
- Convert Circuit JSON back into KiCad-compatible DSN files
- Visualize PCB designs using SVG rendering

## Installation

```bash
# Using bun
bun add dsn-converter

# Using npm
npm install dsn-converter
```

## Usage

### Basic Usage

#### Converting DSN to Circuit JSON

```typescript
import { parseDsnToCircuitJson } from "dsn-converter"

// Read DSN file
const dsnContent = await Bun.file("your-design.dsn").text()

// Convert to Circuit JSON
const circuitJson = parseDsnToCircuitJson(dsnContent)

// Save the output
await Bun.write("output.circuit.json", JSON.stringify(circuitJson, null, 2))
```

#### Converting Circuit JSON to DSN

```typescript
import { circuitJsonToDsnString } from "dsn-converter"

// Convert Circuit JSON to DSN format
const dsnString = circuitJsonToDsnString(circuitJson)

// Save the DSN file
await Bun.write("output.dsn", dsnString)
```

### Advanced Usage

#### Working with DSN JSON Directly

```typescript
import { 
  parseDsnToDsnJson,
  convertDsnJsonToCircuitJson,
  stringifyDsnJson
} from "dsn-converter"

// Parse DSN to intermediate JSON format
const dsnJson = parseDsnToDsnJson(dsnString)

// Modify the DSN JSON structure
dsnJson.placement.components.push({
  name: "NewComponent",
  place: {
    refdes: "U1",
    x: 1000,
    y: 1000,
    side: "front",
    rotation: 0
  }
})

// Convert to Circuit JSON
const circuitJson = convertDsnJsonToCircuitJson(dsnJson)

// Or convert back to DSN string
const modifiedDsnString = stringifyDsnJson(dsnJson)
```

#### Custom Component Processing

```typescript
import { convertCircuitJsonToDsnJson } from "dsn-converter"

// Create Circuit JSON elements
const elements = [
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    pcb_component_id: "R1",
    shape: "rect",
    x: 0,
    y: 0,
    width: 0.5,
    height: 0.6,
    layer: "top"
  },
  // Add more elements...
]

// Convert to DSN format
const dsnJson = convertCircuitJsonToDsnJson(elements)
```

### Type Support

The library provides comprehensive TypeScript types:

```typescript
import type { 
  DsnPcb,
  Component,
  Padstack,
  Network,
  Wire
} from "dsn-converter"

// Use types for type-safe DSN manipulation
const component: Component = {
  name: "R1",
  place: {
    refdes: "R1",
    x: 1000,
    y: 1000,
    side: "front",
    rotation: 0
  }
}
```

## Features

- **Complete DSN Support**: Handles all major DSN file components including:

  - Component placement
  - PCB layers
  - Traces and wiring
  - Padstacks and SMT pads
  - Net definitions
  - Board boundaries

- **Accurate Conversions**: Maintains precise measurements and positions during conversion

- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Data Structure

### DSN Format

The DSN format is represented as a structured JSON with the following main sections:

- `parser`: Contains file metadata
- `resolution`: Defines measurement units
- `structure`: Describes board layers and rules
- `placement`: Component positions
- `library`: Component and padstack definitions
- `network`: Net connections
- `wiring`: Trace routing

### Circuit JSON

The Circuit JSON format includes:

- PCB traces
- SMT pads
- Component definitions
- Layer information
- Routing data

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run specific test file
bun test tests/dsn-pcb/parse-dsn-pcb.test.ts
```

## Acknowledgments

- Built with [Bun](https://bun.sh)
- Uses [tscircuit](https://github.com/tscircuit/tscircuit)
