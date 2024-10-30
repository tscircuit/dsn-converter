# dsn-converter

A TypeScript library for converting between KiCad DSN (Design) files and Circuit JSON format.

## Overview

dsn-converter is a powerful tool that enables bidirectional conversion between KiCad's DSN format and Circuit JSON. This makes it possible to:

- Parse KiCad PCB designs into a workable JSON format
- Convert Circuit JSON back into KiCad-compatible DSN files
- Visualize PCB designs using SVG rendering
- Integrate KiCad designs with tscircuit components

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
import { parseDSN, dsnJsonToCircuitJson } from "dsn-converter";

// Read your DSN file content
const dsnContent = await Bun.file("your-design.dsn").text();

// Parse DSN to intermediate JSON
const dsnJson = parseDSN(dsnContent);

// Convert to Circuit JSON
const circuitJson = dsnJsonToCircuitJson(dsnJson);
```

### Converting Circuit JSON to DSN

```typescript
import { circuitJsonToDsnJson } from "dsn-converter";

// Convert your Circuit JSON to DSN format
const dsnJson = circuitJsonToDsnJson(circuitJson);
```

### Visualization

The library works seamlessly with `circuit-to-svg` for visualization:

```typescript
import { circuitJsonToPcbSvg } from "circuit-to-svg";

// Generate SVG from Circuit JSON
const svg = circuitJsonToPcbSvg(circuitJson);
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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Bun](https://bun.sh)
- Uses [tscircuit](https://github.com/tscircuit/tscircuit) components
- Compatible with [KiCad](https://www.kicad.org)
