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

const server = new McpServer({
  name: "gaea-mcp-server",
  version: "1.0.0",
});

// ────────────────────────────────────────────
// Helper: run an executable and return stdout
// ────────────────────────────────────────────
function run(exe: string, args: string[], timeoutMs = 300_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(exe, args, { timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${error.message}\n${stderr}`));
      } else {
        resolve(stdout + (stderr ? `\n${stderr}` : ""));
      }
    });
  });
}

// Helper: MCP error result
function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

// Helper: MCP text result
function textResult(data: unknown) {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

// ────────────────────────────────────────────
// Tool: check_gaea_status
// ────────────────────────────────────────────
server.tool(
  "check_gaea_status",
  "Check if Gaea executables (Gaea.exe / Gaea.Swarm.exe) are found and report their paths",
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
        ? "Ready to build terrains with Gaea.Swarm.exe"
        : 'Gaea not found. Set GAEA_INSTALL_DIR in .env (e.g. "C:/Program Files/QuadSpinner/Gaea")',
    });
  }
);

// ────────────────────────────────────────────
// Tool: get_gaea_version
// ────────────────────────────────────────────
server.tool(
  "get_gaea_version",
  "Get the installed Gaea version",
  {},
  async () => {
    if (!config.gaeaExe) {
      return errorResult("Gaea.exe not found. Set GAEA_INSTALL_DIR in .env.");
    }
    try {
      const output = await run(config.gaeaExe, ["-Version"], 15_000);
      return textResult({ version: output.trim() });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(`Failed to get version: ${msg}`);
    }
  }
);

// ────────────────────────────────────────────
// Tool: list_projects
// ────────────────────────────────────────────
server.tool(
  "list_projects",
  "List Gaea .terrain project files in the projects directory",
  {},
  async () => {
    if (!fs.existsSync(config.projectDir)) {
      fs.mkdirSync(config.projectDir, { recursive: true });
    }
    const files = fs
      .readdirSync(config.projectDir)
      .filter((f) => f.endsWith(".terrain"));

    return textResult({ projectDir: config.projectDir, files });
  }
);

// ────────────────────────────────────────────
// Tool: build_terrain
// Uses Gaea.Swarm.exe (Build Swarm CLI)
// ────────────────────────────────────────────
server.tool(
  "build_terrain",
  "Build a Gaea terrain using Gaea.Swarm.exe. Supports profiles, regions, seeds, and variables.",
  {
    filename: z
      .string()
      .describe(
        "Path to .terrain file. Can be a name in the projects dir or an absolute path."
      ),
    profile: z
      .string()
      .optional()
      .describe("Build Profile to use (-p / --profile)"),
    region: z
      .string()
      .optional()
      .describe("Region to build (-r / --region)"),
    seed: z
      .number()
      .int()
      .optional()
      .describe("Mutation seed for the build (--seed)"),
    variables: z
      .record(z.string(), z.string())
      .optional()
      .describe("Key-value variable pairs (-v key=value)"),
    varsFile: z
      .string()
      .optional()
      .describe("Path to a .json or .txt variables file (--vars)"),
    ignoreCache: z
      .boolean()
      .optional()
      .default(false)
      .describe("Force ignore baked cache (--ignorecache)"),
    verbose: z
      .boolean()
      .optional()
      .default(false)
      .describe("Enable verbose logging (--verbose)"),
  },
  async ({ filename, profile, region, seed, variables, varsFile, ignoreCache, verbose }) => {
    if (!config.swarmExe) {
      return errorResult(
        'Gaea.Swarm.exe not found. Set GAEA_INSTALL_DIR in .env (e.g. "C:/Program Files/QuadSpinner/Gaea")'
      );
    }

    // Resolve filename: if not absolute, look in projectDir
    let terrainPath = filename;
    if (!path.isAbsolute(filename)) {
      terrainPath = path.join(config.projectDir, filename);
    }

    if (!fs.existsSync(terrainPath)) {
      return errorResult(`Terrain file not found: ${terrainPath}`);
    }

    // Build args for Gaea.Swarm.exe
    const args: string[] = ["--Filename", terrainPath];

    if (profile) {
      args.push("-p", profile);
    }
    if (region) {
      args.push("-r", region);
    }
    if (seed !== undefined) {
      args.push("--seed", seed.toString());
    }
    if (ignoreCache) {
      args.push("--ignorecache");
    }
    if (verbose) {
      args.push("--verbose");
    }
    if (varsFile) {
      args.push("--vars", path.resolve(varsFile));
    }

    // -v must be LAST (per Gaea docs)
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        args.push("-v", `${key}=${value}`);
      }
    }

    try {
      const output = await run(config.swarmExe, args);
      return textResult({
        status: "success",
        terrainFile: terrainPath,
        log: output.trim(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(`Build failed: ${msg}`);
    }
  }
);

// ────────────────────────────────────────────
// Helper: resolve a terrain file path
// ────────────────────────────────────────────
function resolveTerrain(filename: string): string {
  if (path.isAbsolute(filename)) return filename;
  return path.join(config.projectDir, filename);
}

// ════════════════════════════════════════════
//  GRAPH MANIPULATION TOOLS
// ════════════════════════════════════════════

// ────────────────────────────────────────────
// Tool: list_node_types
// ────────────────────────────────────────────
server.tool(
  "list_node_types",
  "List all known Gaea node types with their categories and ports",
  {
    category: z.string().optional().describe("Filter by category (e.g. Terrain, Simulate, Modify)"),
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

// ────────────────────────────────────────────
// Tool: read_terrain_graph
// ────────────────────────────────────────────
server.tool(
  "read_terrain_graph",
  "Read a .terrain file and return a summary of all nodes and connections",
  {
    filename: z.string().describe("Path to .terrain file (name in projects dir or absolute path)"),
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
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(msg);
    }
  }
);

// ────────────────────────────────────────────
// Tool: get_node_details
// ────────────────────────────────────────────
server.tool(
  "get_node_details",
  "Get detailed properties of a specific node in a .terrain file",
  {
    filename: z.string().describe("Path to .terrain file"),
    nodeId: z.number().int().describe("Node ID"),
  },
  async ({ filename, nodeId }) => {
    try {
      const tf = readTerrain(resolveTerrain(filename));
      const node = tf.nodes[String(nodeId)];
      if (!node) return errorResult(`Node ${nodeId} not found`);
      return textResult(summarizeNode(node));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(msg);
    }
  }
);

// ────────────────────────────────────────────
// Tool: add_node
// ────────────────────────────────────────────
server.tool(
  "add_node",
  "Add a new node to a .terrain file. Use list_node_types to see available types.",
  {
    filename: z.string().describe("Path to .terrain file"),
    nodeType: z.string().describe("Node type key (e.g. Mountain, Erosion2, Combine)"),
    name: z.string().optional().describe("Custom display name for the node"),
    x: z.number().optional().describe("X position on the graph canvas (default 26500)"),
    y: z.number().optional().describe("Y position on the graph canvas (default 26250)"),
    properties: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Initial property values (e.g. {Seed: 12345, Duration: 10})"),
  },
  async ({ filename, nodeType, name, x, y, properties }) => {
    try {
      const typeDef = findNodeType(nodeType);
      if (!typeDef) {
        return errorResult(
          `Unknown node type "${nodeType}". Use list_node_types to see available types.`
        );
      }

      const tf = readTerrain(resolveTerrain(filename));
      const nodeId = addNode(tf, typeDef.dotnetType, typeDef.ports, {
        name,
        position: x !== undefined || y !== undefined ? { x: x ?? 26500, y: y ?? 26250 } : undefined,
        properties: properties as Record<string, unknown> | undefined,
      });
      writeTerrain(tf);

      return textResult({
        status: "success",
        nodeId,
        nodeType: typeDef.key,
        message: `Added ${typeDef.key} node (id=${nodeId})`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(msg);
    }
  }
);

// ────────────────────────────────────────────
// Tool: remove_node
// ────────────────────────────────────────────
server.tool(
  "remove_node",
  "Remove a node from a .terrain file. Also removes connections to/from this node.",
  {
    filename: z.string().describe("Path to .terrain file"),
    nodeId: z.number().int().describe("Node ID to remove"),
  },
  async ({ filename, nodeId }) => {
    try {
      const tf = readTerrain(resolveTerrain(filename));
      removeNode(tf, nodeId);
      writeTerrain(tf);
      return textResult({ status: "success", message: `Removed node ${nodeId}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(msg);
    }
  }
);

// ────────────────────────────────────────────
// Tool: connect_nodes
// ────────────────────────────────────────────
server.tool(
  "connect_nodes",
  "Connect an output port of one node to an input port of another node",
  {
    filename: z.string().describe("Path to .terrain file"),
    fromNodeId: z.number().int().describe("Source node ID"),
    fromPort: z.string().optional().default("Out").describe("Source port name (default: Out)"),
    toNodeId: z.number().int().describe("Destination node ID"),
    toPort: z.string().optional().default("In").describe("Destination port name (default: In)"),
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
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(msg);
    }
  }
);

// ────────────────────────────────────────────
// Tool: disconnect_port
// ────────────────────────────────────────────
server.tool(
  "disconnect_port",
  "Disconnect an input port on a node (remove the incoming connection)",
  {
    filename: z.string().describe("Path to .terrain file"),
    nodeId: z.number().int().describe("Node ID"),
    portName: z.string().describe("Port name to disconnect (e.g. In, Mask, Alternate)"),
  },
  async ({ filename, nodeId, portName }) => {
    try {
      const tf = readTerrain(resolveTerrain(filename));
      disconnectPort(tf, nodeId, portName);
      writeTerrain(tf);
      return textResult({
        status: "success",
        message: `Disconnected port "${portName}" on node ${nodeId}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(msg);
    }
  }
);

// ────────────────────────────────────────────
// Tool: set_node_property
// ────────────────────────────────────────────
server.tool(
  "set_node_property",
  "Set a property value on a node (e.g. Seed, Duration, Scale, Style)",
  {
    filename: z.string().describe("Path to .terrain file"),
    nodeId: z.number().int().describe("Node ID"),
    property: z.string().describe("Property name (e.g. Seed, Duration, Scale)"),
    value: z.unknown().describe("Property value (number, string, boolean, or object)"),
  },
  async ({ filename, nodeId, property, value }) => {
    try {
      const tf = readTerrain(resolveTerrain(filename));
      setNodeProperty(tf, nodeId, property, value);
      writeTerrain(tf);
      return textResult({
        status: "success",
        message: `Set ${property}=${JSON.stringify(value)} on node ${nodeId}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(msg);
    }
  }
);

// ────────────────────────────────────────────
// Tool: create_terrain
// ────────────────────────────────────────────
server.tool(
  "create_terrain",
  "Create a new empty .terrain file in the projects directory",
  {
    name: z.string().describe("Filename (without .terrain extension)"),
  },
  async ({ name }) => {
    try {
      if (!fs.existsSync(config.projectDir)) {
        fs.mkdirSync(config.projectDir, { recursive: true });
      }
      const filePath = path.join(config.projectDir, `${name}.terrain`);
      if (fs.existsSync(filePath)) {
        return errorResult(`File already exists: ${filePath}`);
      }
      const tf = createEmptyTerrain(filePath);
      writeTerrain(tf);
      return textResult({
        status: "success",
        filePath,
        message: `Created new terrain: ${name}.terrain`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult(msg);
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
