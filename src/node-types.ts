/**
 * Gaea node type registry.
 *
 * Each entry describes a node's .NET $type, default ports, and category.
 * Port definitions follow the pattern observed in actual .terrain files.
 */

export interface PortDef {
  name: string;
  type: "PrimaryIn" | "PrimaryIn, Required" | "PrimaryOut" | "In" | "Out";
}

export interface NodeTypeDef {
  /** Short key used by the MCP tool (e.g. "Mountain") */
  key: string;
  /** Full .NET $type value */
  dotnetType: string;
  /** Human-readable category */
  category: string;
  /** Default ports for this node type */
  ports: PortDef[];
}

// Helper to build a $type string
const T = (name: string) => `QuadSpinner.Gaea.Nodes.${name}, Gaea.Nodes`;

// Standard port sets
const PRIMARY_ONLY: PortDef[] = [
  { name: "In", type: "PrimaryIn" },
  { name: "Out", type: "PrimaryOut" },
];

const PRIMARY_REQUIRED: PortDef[] = [
  { name: "In", type: "PrimaryIn, Required" },
  { name: "Out", type: "PrimaryOut" },
];

export const NODE_TYPES: NodeTypeDef[] = [
  // ── Primitive / Generator ──
  { key: "Perlin", dotnetType: T("Perlin"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "Noise", dotnetType: T("Noise"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "Voronoi", dotnetType: T("Voronoi"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "Cellular", dotnetType: T("Cellular"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "RadialGradient", dotnetType: T("RadialGradient"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "File", dotnetType: T("File"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "MultiFractal", dotnetType: T("MultiFractal"), category: "Primitive", ports: PRIMARY_ONLY },

  // ── Terrain ──
  { key: "Mountain", dotnetType: T("Mountain"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "MountainRange", dotnetType: T("MountainRange"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "MountainSide", dotnetType: T("MountainSide"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Ridge", dotnetType: T("Ridge"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Canyon", dotnetType: T("Canyon"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Plates", dotnetType: T("Plates"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Volcano", dotnetType: T("Volcano"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Island", dotnetType: T("Island"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Crater", dotnetType: T("Crater"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "CraterField", dotnetType: T("CraterField"), category: "Terrain", ports: PRIMARY_ONLY },

  // ── Simulate ──
  {
    key: "Erosion", dotnetType: T("Erosion"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "AreaMask", type: "In" },
      { name: "Wear", type: "Out" },
      { name: "Deposits", type: "Out" },
      { name: "Flow", type: "Out" },
    ],
  },
  {
    key: "Erosion2", dotnetType: T("Erosion2"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Flow", type: "Out" },
      { name: "Wear", type: "Out" },
      { name: "Deposits", type: "Out" },
    ],
  },
  { key: "Thermal", dotnetType: T("Thermal"), category: "Simulate", ports: PRIMARY_REQUIRED },
  {
    key: "Snowfield", dotnetType: T("Snowfield"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Snow", type: "Out" },
      { name: "Hard", type: "Out" },
      { name: "Depth", type: "Out" },
    ],
  },
  { key: "Rivers", dotnetType: T("Rivers"), category: "Simulate", ports: PRIMARY_REQUIRED },
  { key: "Trees", dotnetType: T("Trees"), category: "Simulate", ports: PRIMARY_REQUIRED },

  // ── Surface ──
  { key: "Craggy", dotnetType: T("Craggy"), category: "Surface", ports: PRIMARY_REQUIRED },
  { key: "Sandstone", dotnetType: T("Sandstone"), category: "Surface", ports: PRIMARY_REQUIRED },
  { key: "Stratify", dotnetType: T("Stratify"), category: "Surface", ports: PRIMARY_REQUIRED },
  { key: "Terraces", dotnetType: T("Terraces"), category: "Surface", ports: PRIMARY_REQUIRED },
  { key: "Roughen", dotnetType: T("Roughen"), category: "Surface", ports: PRIMARY_REQUIRED },
  { key: "Outcrops", dotnetType: T("Outcrops"), category: "Surface", ports: PRIMARY_REQUIRED },
  { key: "Slump", dotnetType: T("Slump"), category: "Surface", ports: PRIMARY_ONLY },
  { key: "Stones", dotnetType: T("Stones"), category: "Surface", ports: PRIMARY_REQUIRED },

  // ── Modify ──
  { key: "Warp", dotnetType: T("Warp"), category: "Modify", ports: PRIMARY_REQUIRED },
  { key: "Shaper", dotnetType: T("Shaper"), category: "Modify", ports: PRIMARY_REQUIRED },
  { key: "Transform", dotnetType: T("Transform"), category: "Modify", ports: PRIMARY_REQUIRED },
  { key: "Blur", dotnetType: T("Blur"), category: "Modify", ports: PRIMARY_REQUIRED },
  { key: "Clamp", dotnetType: T("Clamp"), category: "Modify", ports: PRIMARY_REQUIRED },
  { key: "Curve", dotnetType: T("Curve"), category: "Modify", ports: PRIMARY_REQUIRED },
  { key: "Seamless", dotnetType: T("Seamless"), category: "Modify", ports: PRIMARY_REQUIRED },

  // ── Derive ──
  { key: "Slope", dotnetType: T("Slope"), category: "Derive", ports: PRIMARY_REQUIRED },
  { key: "Height", dotnetType: T("Height"), category: "Derive", ports: PRIMARY_REQUIRED },
  { key: "Curvature", dotnetType: T("Curvature"), category: "Derive", ports: PRIMARY_REQUIRED },
  { key: "FlowMap", dotnetType: T("FlowMap"), category: "Derive", ports: PRIMARY_REQUIRED },
  { key: "Occlusion", dotnetType: T("Occlusion"), category: "Derive", ports: PRIMARY_REQUIRED },
  { key: "RockMap", dotnetType: T("RockMap"), category: "Derive", ports: PRIMARY_REQUIRED },

  // ── Colorize ──
  {
    key: "SatMap", dotnetType: T("SatMap"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
    ],
  },
  { key: "Synth", dotnetType: T("Synth"), category: "Colorize", ports: PRIMARY_REQUIRED },
  { key: "CLUTer", dotnetType: T("CLUTer"), category: "Colorize", ports: PRIMARY_REQUIRED },
  {
    key: "ColorErosion", dotnetType: T("ColorErosion"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Height", type: "In" },
      { name: "Precipitation", type: "In" },
    ],
  },
  { key: "Tint", dotnetType: T("Tint"), category: "Colorize", ports: PRIMARY_REQUIRED },

  // ── Utility ──
  {
    key: "Combine", dotnetType: T("Combine"), category: "Utility",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Input2", type: "In" },
      { name: "Mask", type: "In" },
    ],
  },
  {
    key: "Switch", dotnetType: T("Switch"), category: "Utility",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Alternate", type: "In" },
    ],
  },
  { key: "Route", dotnetType: T("Route"), category: "Utility", ports: PRIMARY_REQUIRED },
  { key: "Chokepoint", dotnetType: T("Chokepoint"), category: "Utility", ports: PRIMARY_REQUIRED },

  // ── Output ──
  { key: "Export", dotnetType: T("Export"), category: "Output", ports: PRIMARY_REQUIRED },
  { key: "Mesher", dotnetType: T("Mesher"), category: "Output", ports: PRIMARY_REQUIRED },
  { key: "Unreal", dotnetType: T("Unreal"), category: "Output", ports: PRIMARY_REQUIRED },
  { key: "Unity", dotnetType: T("Unity"), category: "Output", ports: PRIMARY_REQUIRED },
];

/** Lookup by key (case-insensitive) */
export function findNodeType(key: string): NodeTypeDef | undefined {
  const lower = key.toLowerCase();
  return NODE_TYPES.find((n) => n.key.toLowerCase() === lower);
}

/** Lookup by $type string */
export function findNodeTypeByDotnet(dotnetType: string): NodeTypeDef | undefined {
  return NODE_TYPES.find((n) => n.dotnetType === dotnetType);
}
