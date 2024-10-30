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

### Converting DSN to Circuit JSON

```typescript
import { parseDSN, dsnJsonToCircuitJson } from "dsn-converter"

// Example 1: Convert DSN file to Circuit JSON
async function convertDsnFile() {
  // Read DSN file content
  const dsnContent = await Bun.file("your-design.dsn").text()

  // Parse DSN to intermediate JSON
  const dsnJson = parseDSN(dsnContent)

  // Convert to Circuit JSON
  const circuitJson = dsnJsonToCircuitJson(dsnJson)
  
  // Use circuitJson with circuit-to-svg or other tools
  console.log(JSON.stringify(circuitJson, null, 2))
}

// Example 2: Convert DSN string directly
function convertDsnString(dsnString: string) {
  const dsnJson = parseDSN(dsnString)
  return dsnJsonToCircuitJson(dsnJson)
}
```

### Converting Circuit JSON to DSN

```typescript
import { circuitJsonToDsnJson, circuitJsonToDsnString } from "dsn-converter"

// Example 1: Convert Circuit JSON to DSN JSON
const dsnJson = circuitJsonToDsnJson(circuitJson)

// Example 2: Convert Circuit JSON directly to DSN string
const dsnString = circuitJsonToDsnString(circuitJson)

// Example 3: Save DSN to file
await Bun.write("output.dsn", dsnString)
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
