import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { config } from "./config.js";
import {
  readTerrain, writeTerrain, createEmptyTerrain,
  summarizeNode, listConnections,
  addNode, removeNode, connectNodes, disconnectPort, setNodeProperty,
} from "./terrain-io.js";
import { NODE_TYPES, findNodeType } from "./node-types.js";

// ════════════════════════════════════════════
// Server with instructions for LLM clients
// ════════════════════════════════════════════

const SERVER_INSTRUCTIONS = `
You are controlling a Gaea 2.0 terrain generation server.
Gaea is a node-based procedural terrain tool. You can create, edit, and build .terrain files.

## Workflow
1. Use read_terrain_graph to understand an existing terrain, or create_terrain to start fresh.
2. Use add_node to place nodes (e.g. Mountain, Erosion2, Combine, Export).
3. Use connect_nodes to wire them together (output → input). Default ports are "Out" → "In".
4. Use set_node_property to tweak parameters (Seed, Duration, Scale, etc.).
5. Use build_terrain to render the final terrain via Gaea.Swarm.exe.

## Node Categories (120 types total)
- Primitive (17): Perlin, Noise, Voronoi, Cellular, Cellular3D, RadialGradient, LinearGradient, Constant, File, MultiFractal, DriftNoise, WaveShine, DotNoise, LineNoise, RockNoise, Gabor, Draw
- Terrain (14): Mountain, MountainRange, MountainSide, Ridge, Canyon, Plates, Volcano, Island, Crater, CraterField, Uplift, Rugged, Rockscape, Accumulator
- Simulate (16): Erosion, Erosion2, Thermal, Thermal2, Crumble, Weathering, Snowfield, Snow, Glacier, Rivers, Lake, Sea, Trees, Sediments, Anastomosis, HydroFix
- Surface (15): Craggy, Sandstone, Stratify, Terraces, FractalTerraces, Roughen, Outcrops, Slump, Stones, Fold, Pockmarks, Texturizer, Scree, Debris, Distress
- Modify (21): Warp, DirectionalWarp, SlopeWarp, SlopeBlur, Shaper, ThermalShaper, Transform, Blur, Clamp, Curve, Seamless, Repeat, Deflate, Swirl, Dilate, Median, Autolevel, GraphicEQ, Threshold, Filter, Adjust
- Derive (8): Slope, Height, Curvature, FlowMap, Occlusion, RockMap, Distance, DataExtractor
- Colorize (15): SatMap, Synth, CLUTer, ColorErosion, Tint, Shade, SuperColor, WaterColor, Cartography, TextureBase, GroundTexture, LightX, HSL, RGBSplit, RGBMerge
- Utility (10): Combine, Switch, Route, Chokepoint, Mixer, Mask, Transpose, Compare, LoopBegin, LoopEnd
- Output (4): Export, Mesher, Unreal, Unity

## Recommended Properties
- Mountain: Scale(0.5–2.0), Height(1–5), Style("Alpine"|"Rugged"|"Smooth")
- Erosion2: Duration(10–30, higher=deeper channels), Strength(0.2–0.8)
- Thermal2: Duration(5–15), Strength(0.3–0.7)
- Rivers: defaults work well, outputs Rivers/Depth/Surface
- Snow: defaults work well, outputs Snow/Hard/Depth maps
- Crater: Scale(0.3–0.8), Height(0.5–1.0) — useful for caldera/ring shapes
- RadialGradient: Scale(0.3–0.8), Height(0.3–0.6) — circular mask
- Combine: Method("Add"|"Subtract"|"Multiply"|"Max"|"Min"|"Screen"|"Power")
- SatMap: defaults work well for satellite-style coloring
- ColorErosion: use with Erosion2 Flow output for erosion-based color
- Mesher: Format("GLB"|"OBJ"), CreateNormals(true), CreateUVs(true)
- Export: exports heightmap/texture from connected color node

## Common Patterns
- Basic mountain: Mountain → Erosion2 → Export
- Detailed landscape: Mountain → Erosion2 → Snow → SatMap → Export
- Blending: (Mountain + Ridge via Combine) → Erosion2 → Export
- Colored terrain: Mountain → Erosion2 → SatMap → Export (use ColorErosion for erosion-based color)
- Water features: terrain → Rivers/Lake/Sea → Export (each has Water, Depth, Shore outputs)
- Circular mountain valley (caldera):
  RadialGradient + Mountain → Combine(Multiply) + MountainRange → Combine(Max)
  → Erosion2 → Thermal2 → Craggy → Rivers → Snow → SatMap + ColorErosion → Export + Mesher
  Note: Surface nodes (Craggy) should come BEFORE simulation nodes (Rivers), not after.
- Mesh + Texture export:
  terrain chain → split to Mesher (geometry) AND SatMap → Export (color texture)
- Use Erosion2 (newer) over Erosion, Snow over Snowfield, Thermal2 over Thermal when possible.

## Connection Rules
- Connections go from an output port to an input port on another node.
- Each input port accepts only one connection. Connecting replaces any existing connection.
- Port types: PrimaryIn (optional input), PrimaryIn Required (must connect), In (secondary), In Required (required secondary), Out (extra output), PrimaryOut (main output).
- Nodes like Erosion2 have extra outputs: Flow, Wear, Deposits — useful as masks.
- Combine has: In (primary), Input2, Input3, Input4 (more inputs), Mask (blend mask).
- Combine Method modes: Add (sum heights), Max (take higher value, best for blending terrains), Multiply (mask-like, zero×anything=zero), Screen (soft additive, good for color), Subtract (carve valleys/grooves), Min (take lower value), Power (contrast).
- Mixer has: Terrain + Layer1-4 inputs with corresponding Mask1-4 inputs and MaskOut1-4 outputs.
- Always call list_node_types if unsure about available ports.

## Important Notes
- The filename parameter accepts both absolute paths and filenames in the project directory.
- File format constraints (Newtonsoft.Json $id ordering, Gaea 2.2.9 required fields) are handled automatically by the server — no special handling needed from the LLM side.
- When building with build_terrain, the -v (variables) argument must always be last.
`.trim();

const server = new McpServer(
  { name: "gaea-mcp-server", version: "1.0.0" },
  { instructions: SERVER_INSTRUCTIONS },
);

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function run(exe: string, args: string[], timeoutMs = 300_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(exe, args, { timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) reject(new Error(`${error.message}\n${stderr}`));
      else resolve(stdout + (stderr ? `\n${stderr}` : ""));
    });
  });
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

function textResult(data: unknown) {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

function resolveTerrain(filename: string): string {
  if (path.isAbsolute(filename)) return filename;
  return path.join(config.projectDir, filename);
}

// ════════════════════════════════════════════
//  STATUS & BUILD TOOLS
// ════════════════════════════════════════════

server.tool(
  "check_gaea_status",
  "Check if Gaea is installed and report executable paths, project directory, and readiness. Call this first to verify the environment.",
  {},
  async () => {
    return textResult({
      found: !!(config.gaeaExe || config.swarmExe),
      installDir: config.installDir,
      gaeaExe: config.gaeaExe,
      swarmExe: config.swarmExe,
      projectDir: config.projectDir,
      outputDir: config.outputDir,
      hint: config.swarmExe
        ? "Ready. Use create_terrain or read_terrain_graph to get started."
        : 'Gaea not found. Set GAEA_INSTALL_DIR in .env (e.g. "C:/Program Files/QuadSpinner/Gaea")',
    });
  }
);

server.tool(
  "get_gaea_version",
  "Get the installed Gaea version number.",
  {},
  async () => {
    if (!config.gaeaExe) return errorResult("Gaea.exe not found. Set GAEA_INSTALL_DIR in .env.");
    try {
      const output = await run(config.gaeaExe, ["-Version"], 15_000);
      return textResult({ version: output.trim() });
    } catch (err: unknown) {
      return errorResult(`Failed to get version: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
);

server.tool(
  "list_projects",
  "List .terrain files in the project directory. Use absolute paths for files outside this directory.",
  {},
  async () => {
    if (!fs.existsSync(config.projectDir)) {
      fs.mkdirSync(config.projectDir, { recursive: true });
    }
    const files = fs.readdirSync(config.projectDir).filter((f) => f.endsWith(".terrain"));
    return textResult({ projectDir: config.projectDir, files });
  }
);

server.tool(
  "build_terrain",
  `Build a terrain using Gaea.Swarm.exe CLI.
Renders all output nodes in the .terrain file.
The -v (variables) argument is always placed last automatically.
Typical build time: seconds to minutes depending on resolution and node complexity.`,
  {
    filename: z.string().describe("Path to .terrain file (name in project dir or absolute path)"),
    profile: z.string().optional().describe("Build Profile name"),
    region: z.string().optional().describe("Region name to build"),
    seed: z.number().int().optional().describe("Mutation seed (integer) for terrain variations"),
    variables: z.record(z.string(), z.string()).optional()
      .describe('Variable overrides as key-value pairs, e.g. {"erosion": "0.35", "snowline": "0.7"}'),
    varsFile: z.string().optional().describe("Path to a .json or .txt variables file"),
    ignoreCache: z.boolean().optional().default(false).describe("Ignore baked cache and force full rebuild"),
    verbose: z.boolean().optional().default(false).describe("Enable verbose build log"),
  },
  async ({ filename, profile, region, seed, variables, varsFile, ignoreCache, verbose }) => {
    if (!config.swarmExe) {
      return errorResult('Gaea.Swarm.exe not found. Set GAEA_INSTALL_DIR in .env.');
    }
    const terrainPath = resolveTerrain(filename);
    if (!fs.existsSync(terrainPath)) return errorResult(`Terrain file not found: ${terrainPath}`);

    const args: string[] = ["--Filename", terrainPath];
    if (profile) args.push("-p", profile);
    if (region) args.push("-r", region);
    if (seed !== undefined) args.push("--seed", seed.toString());
    if (ignoreCache) args.push("--ignorecache");
    if (verbose) args.push("--verbose");
    if (varsFile) args.push("--vars", path.resolve(varsFile));
    // -v must be LAST per Gaea docs
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        args.push("-v", `${key}=${value}`);
      }
    }

    try {
      const output = await run(config.swarmExe, args);
      return textResult({ status: "success", terrainFile: terrainPath, log: output.trim() });
    } catch (err: unknown) {
      return errorResult(`Build failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
);

// ════════════════════════════════════════════
//  GRAPH READ TOOLS
// ════════════════════════════════════════════

server.tool(
  "list_node_types",
  `List available Gaea node types with their categories and port definitions.
Categories: Primitive, Terrain, Simulate, Surface, Modify, Derive, Colorize, Utility, Output.
Use the "key" value (e.g. "Mountain") as the nodeType parameter in add_node.`,
  {
    category: z.string().optional()
      .describe("Filter by category name (e.g. Terrain, Simulate, Modify, Output)"),
  },
  async ({ category }) => {
    let types = NODE_TYPES;
    if (category) {
      const lower = category.toLowerCase();
      types = types.filter((t) => t.category.toLowerCase() === lower);
    }
    return textResult(
      types.map((t) => ({
        key: t.key,
        category: t.category,
        ports: t.ports.map((p) => `${p.name} (${p.type})`),
      }))
    );
  }
);

server.tool(
  "read_terrain_graph",
  `Read a .terrain file and return a complete summary: all nodes, their properties, ports, and connections.
Call this first when working with an existing terrain to understand the current graph structure.
Each node has an "id" that you use in connect_nodes, set_node_property, remove_node, etc.`,
  {
    filename: z.string().describe("Path to .terrain file (name in project dir or absolute path)"),
  },
  async ({ filename }) => {
    try {
      const tf = readTerrain(resolveTerrain(filename));
      const nodeSummaries = Object.values(tf.nodes)
        .filter((n) => n && n.$id !== undefined)
        .map(summarizeNode);
      const connections = listConnections(tf);
      return textResult({
        file: tf.filePath,
        terrainSize: { width: tf.terrain.Width, height: tf.terrain.Height },
        buildResolution: tf.asset.BuildDefinition?.Resolution,
        nodeCount: nodeSummaries.length,
        nodes: nodeSummaries,
        connections,
      });
    } catch (err: unknown) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.tool(
  "get_node_details",
  "Get all properties and port connections of a specific node. Use read_terrain_graph first to find node IDs.",
  {
    filename: z.string().describe("Path to .terrain file"),
    nodeId: z.number().int().describe("Node ID (from read_terrain_graph output)"),
  },
  async ({ filename, nodeId }) => {
    try {
      const tf = readTerrain(resolveTerrain(filename));
      const node = tf.nodes[String(nodeId)];
      if (!node) return errorResult(`Node ${nodeId} not found. Use read_terrain_graph to see available node IDs.`);
      return textResult(summarizeNode(node));
    } catch (err: unknown) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

// ════════════════════════════════════════════
//  GRAPH WRITE TOOLS
// ════════════════════════════════════════════

server.tool(
  "create_terrain",
  `Create a new empty .terrain file compatible with Gaea 2.2.9.
The file is saved in the project directory. After creation, use add_node to populate the graph.
A typical workflow: create_terrain → add_node (generators: Mountain, RadialGradient)
→ add_node (processors: Erosion2, Thermal2, Rivers, Craggy, Snow)
→ add_node (colorizers: SatMap, ColorErosion) → add_node (outputs: Export, Mesher)
→ connect_nodes to wire the chain.`,
  {
    name: z.string().describe("Filename without extension (e.g. 'my_mountain' creates my_mountain.terrain)"),
  },
  async ({ name }) => {
    try {
      if (!fs.existsSync(config.projectDir)) fs.mkdirSync(config.projectDir, { recursive: true });
      const filePath = path.join(config.projectDir, `${name}.terrain`);
      if (fs.existsSync(filePath)) return errorResult(`File already exists: ${filePath}`);
      const tf = createEmptyTerrain(filePath);
      writeTerrain(tf);
      return textResult({
        status: "success",
        filePath,
        message: `Created ${name}.terrain. Next: use add_node to add nodes to the graph.`,
      });
    } catch (err: unknown) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.tool(
  "add_node",
  `Add a node to the terrain graph. Use list_node_types to see available types and their ports.
Common types: Mountain, Erosion2, Combine, SatMap, Export.
Set initial properties for best results, e.g. Mountain: {Scale: 1.5, Height: 3},
Erosion2: {Duration: 15}, Combine: {Method: "Multiply"}, Mesher: {Format: "GLB"}.
Position nodes left-to-right by increasing X (spacing ~300-500). Y=26250 for a single row.
After adding, use connect_nodes to wire it into the graph.`,
  {
    filename: z.string().describe("Path to .terrain file"),
    nodeType: z.string().describe("Node type key from list_node_types (e.g. Mountain, Erosion2, Combine, Export)"),
    name: z.string().optional().describe("Custom display name (defaults to the type name)"),
    x: z.number().optional().describe("X position on graph canvas (default: 26500, increase by ~300 per node)"),
    y: z.number().optional().describe("Y position on graph canvas (default: 26250)"),
    properties: z.record(z.string(), z.unknown()).optional()
      .describe("Initial property values, e.g. {Seed: 12345, Duration: 10}"),
  },
  async ({ filename, nodeType, name, x, y, properties }) => {
    try {
      const typeDef = findNodeType(nodeType);
      if (!typeDef) {
        const suggestions = NODE_TYPES
          .filter((t) => t.key.toLowerCase().includes(nodeType.toLowerCase()))
          .map((t) => t.key);
        return errorResult(
          `Unknown node type "${nodeType}".` +
          (suggestions.length ? ` Did you mean: ${suggestions.join(", ")}?` : "") +
          " Use list_node_types to see all available types."
        );
      }

      const tf = readTerrain(resolveTerrain(filename));
      const nodeId = addNode(tf, typeDef.dotnetType, typeDef.ports, {
        name,
        position: x !== undefined || y !== undefined ? { x: x ?? 26500, y: y ?? 26250 } : undefined,
        properties: properties as Record<string, unknown> | undefined,
      });
      writeTerrain(tf);

      const portNames = typeDef.ports.map((p) => `${p.name} (${p.type})`).join(", ");
      return textResult({
        status: "success",
        nodeId,
        nodeType: typeDef.key,
        ports: portNames,
        message: `Added ${typeDef.key} node (id=${nodeId}). Ports: ${portNames}. Use connect_nodes to wire it.`,
      });
    } catch (err: unknown) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.tool(
  "remove_node",
  "Remove a node and all its connections (both incoming and outgoing) from the terrain graph.",
  {
    filename: z.string().describe("Path to .terrain file"),
    nodeId: z.number().int().describe("Node ID to remove"),
  },
  async ({ filename, nodeId }) => {
    try {
      const tf = readTerrain(resolveTerrain(filename));
      removeNode(tf, nodeId);
      writeTerrain(tf);
      return textResult({ status: "success", message: `Removed node ${nodeId} and its connections.` });
    } catch (err: unknown) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.tool(
  "connect_nodes",
  `Connect two nodes by wiring an output port to an input port.
Default ports: "Out" → "In" (works for most simple chains).
For nodes with multiple ports (e.g. Combine has Input2, Mask; Erosion2 outputs Flow, Wear, Deposits),
specify the port names explicitly. For Combine, set Method property before connecting
(e.g. "Multiply" for masking, "Max" for blending terrains, "Screen" for color compositing).
Each input port accepts only one connection — connecting replaces any existing connection on that input.`,
  {
    filename: z.string().describe("Path to .terrain file"),
    fromNodeId: z.number().int().describe("Source node ID (the node producing data)"),
    fromPort: z.string().optional().default("Out").describe('Source output port name (default: "Out")'),
    toNodeId: z.number().int().describe("Destination node ID (the node receiving data)"),
    toPort: z.string().optional().default("In").describe('Destination input port name (default: "In")'),
  },
  async ({ filename, fromNodeId, fromPort, toNodeId, toPort }) => {
    try {
      const tf = readTerrain(resolveTerrain(filename));
      connectNodes(tf, fromNodeId, fromPort, toNodeId, toPort);
      writeTerrain(tf);
      return textResult({
        status: "success",
        message: `Connected ${fromNodeId}:${fromPort} → ${toNodeId}:${toPort}`,
      });
    } catch (err: unknown) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.tool(
  "disconnect_port",
  "Remove the incoming connection on a specific input port of a node.",
  {
    filename: z.string().describe("Path to .terrain file"),
    nodeId: z.number().int().describe("Node ID"),
    portName: z.string().describe("Input port name to disconnect (e.g. In, Mask, Alternate, Input2)"),
  },
  async ({ filename, nodeId, portName }) => {
    try {
      const tf = readTerrain(resolveTerrain(filename));
      disconnectPort(tf, nodeId, portName);
      writeTerrain(tf);
      return textResult({ status: "success", message: `Disconnected port "${portName}" on node ${nodeId}.` });
    } catch (err: unknown) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.tool(
  "set_node_property",
  `Set a property value on a node. Properties vary by node type.
Common properties: Seed (int), Duration (float), Scale (float), Style (string enum).
Use get_node_details to see current properties and their values.
Only non-default values are stored — setting a property to its default effectively removes it.`,
  {
    filename: z.string().describe("Path to .terrain file"),
    nodeId: z.number().int().describe("Node ID"),
    property: z.string().describe("Property name (case-sensitive, e.g. Seed, Duration, Scale, Style)"),
    value: z.unknown().describe("Value: number, string, boolean, or object like {X: 0.5, Y: 1.0}"),
  },
  async ({ filename, nodeId, property, value }) => {
    try {
      const tf = readTerrain(resolveTerrain(filename));
      setNodeProperty(tf, nodeId, property, value);
      writeTerrain(tf);
      return textResult({
        status: "success",
        message: `Set ${property}=${JSON.stringify(value)} on node ${nodeId}.`,
      });
    } catch (err: unknown) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

// ────────────────────────────────────────────
// Start
// ────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[gaea-mcp-server] Server started on stdio transport");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
