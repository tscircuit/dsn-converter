      nodes[coordIndex + 1]?.type === "Atom" &&
      typeof nodes[coordIndex + 1].value === "number" &&
      nodes[coordIndex + 2]?.type === "Atom" &&
      typeof nodes[coordIndex + 2].value === "string" &&
      nodes[coordIndex + 3]?.type === "Atom" &&
      typeof nodes[coordIndex + 3].value === "number"
    ) {
      places.x = nodes[coordIndex].value as number;
      places.y = nodes[coordIndex + 1].value as number;
      const sideValue = nodes[coordIndex + 2].value as string;
      if (sideValue === "front" || sideValue === "back") {
        places.side = sideValue as "front" | "back";
      }
      places.rotation = nodes[coordIndex + 3].value as number;

      for (let i = coordIndex + 4; i < nodes.length; i++) {
        const node = nodes[i];
        if (
          node?.type === "List" &&
          node.children?.[0]?.type === "Atom" &&
          node.children[0].value === "PN" &&
          node.children?.[1]?.type === "Atom"
        ) {
          places.PN = String(node.children[1].value);
          break;
        }
      }
    }
  }
  return places as Places;
}

// --- Library ---
export function processLibrary(nodes: ASTNode[]): Library {
  const library: Library = {
    images: [],
    padstacks: [],
  } as unknown as Library;

  nodes.forEach((node) => {
    if (node.type === "List" && node.children && node.children.length > 0) {
      const [keyNode, ...rest] = node.children;
      if (keyNode?.type === "Atom" && typeof keyNode.value === "string") {
        switch (keyNode.value) {
          case "image":
            // safe
            break;
          case "padstack":
            library.padstacks.push(processPadstack(node.children));
            break;
        }
      }
    }
  });
  return library as Library;
}

function processImage(nodes: ASTNode[]): Image {
  const image: Partial<Image> = { outlines: [], pins: [] } as unknown as Partial<Image>;
  if (nodes[1]?.type === "Atom" && typeof nodes[1].value === "string") {
    (image as any).name = nodes[1].value;
  }
  image.outlines = [];
  image.pins = [];
  nodes.slice(2).forEach((node) => {
    if (node.type === "List" && node.children && node.children.length > 0) {
      const [keyNode, ...rest] = node.children;
      if (keyNode?.type === "Atom" && typeof keyNode.value === "string") {
        if (keyNode.value === "outline") {
          image.outlines!.push(processOutline(node.children));
        } else if (keyNode.value === "pin") {
          const pin = processPin(node.children);
          if (pin) image.pins!.push(pin);
        }
      }
    }
  });
  return image as Image;
}

function processOutline(nodes: ASTNode[]): Outline {
  const outline: Partial<Outline> = {};
  nodes.forEach((node) => {
    if (
      node.type === "List" &&
      node.children &&
      node.children[0]?.type === "Atom" &&
      node.children[0]?.value === "path"
    ) {
      outline.path = processPath(node.children);
    }
  });
  return outline as Outline;
}

function processPin(nodes: ASTNode[]): Pin | null {
  if (nodes[1]?.type !== "Atom") {
    console.debug("Unsupported pin padstack_name format:", nodes);
    return null;
  }
  const pin: Partial<Pin> = {
    padstack: atomString(nodes[1]),
    id: atomString(nodes[2]),
    x: 0,
    y: 0,
  };
  if (nodes.length >= 5) {
    pin.x = atomNumber(nodes[3], 0);
    pin.y = atomNumber(nodes[4], 0);
  }
  return pin as Pin;
}

function processPadstack(nodes: ASTNode[]): Padstack {
  const padstack: Padstack = {
    name: atomString(nodes[1], ""),
    shapes: [],
    attach: "off",
  } as unknown as Padstack;

  for (let i = 2; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type !== "List" || !node.children) continue;
    const key = atomString(node.children[0]);
    if (key === "shape") {
      padstack.shapes.push(processShape(node.children));
    } else if (key === "attach") {
      padstack.attach = atomString(node.children[1], "off") as Padstack["attach"];
    }
  }
  return padstack;
}

function processShape(nodes: ASTNode[]): Shape {
  // (shape (path F.Cu ...) ) or (shape (circle ...))
  let layer = "F.Cu";
  let shapeType = "path";
  for (const child of nodes) {
    if (child.type === "List" && child.children) {
      const innerKey = atomString(child.children[0]);
      if (innerKey === "path") {
        const p = processPath(child.children);
        layer = p.layer;
        return { type: "path", path: p, layer } as unknown as Shape;
      }
      if (innerKey === "circle") {
        // simplified
        return { type: "circle", layer, diameter: atomNumber(child.children[2], 0) } as unknown as Shape;
      }
    }
  }
  return { type: shapeType, layer } as unknown as Shape;
}

// --- Stubs to make compiler happy (keep your existing impl if different) ---
function processNetwork(nodes: ASTNode[]): Network {
  return { nets: [], classes: [] } as unknown as Network;
}
function processWiring(nodes: ASTNode[]): Wiring {
  const wiring: Wiring = { wires: [] } as unknown as Wiring;
  for (const node of nodes) {
    if (node.type === "List" && node.children && node.children[0]?.value === "wire") {
      // wiring.wires.push(processWire(node.children.slice(1)));
    }
  }
  return wiring;
}

export { processPcbNode };
