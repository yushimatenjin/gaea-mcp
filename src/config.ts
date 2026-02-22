import "dotenv/config";
import fs from "fs";
import path from "path";

// Build candidate list dynamically — no hardcoded usernames
const localAppData = process.env.LOCALAPPDATA; // e.g. C:\Users\<user>\AppData\Local

const WINDOWS_CANDIDATE_DIRS = [
  ...(localAppData
    ? [`${localAppData}/Programs/Gaea 2.0`, `${localAppData}/Programs/Gaea`]
    : []),
  "C:/Program Files/QuadSpinner/Gaea",
  "C:/Program Files/QuadSpinner/Gaea 2",
  "C:/Program Files/Gaea",
  "C:/Program Files (x86)/Gaea",
  "D:/Program Files/QuadSpinner/Gaea",
  "D:/Program Files/Gaea",
];

interface GaeaPaths {
  /** Gaea.exe (UI + activation/version) */
  gaeaExe: string | null;
  /** Gaea.Swarm.exe (CLI build automation) */
  swarmExe: string | null;
  /** Installation directory */
  installDir: string | null;
}

function findGaea(): GaeaPaths {
  // 1. Check env variable for install directory
  if (process.env.GAEA_INSTALL_DIR) {
    const dir = process.env.GAEA_INSTALL_DIR;
    const gaea = path.join(dir, "Gaea.exe");
    const swarm = path.join(dir, "Gaea.Swarm.exe");
    if (fs.existsSync(gaea) || fs.existsSync(swarm)) {
      console.error(`[config] Using GAEA_INSTALL_DIR from env: ${dir}`);
      return {
        gaeaExe: fs.existsSync(gaea) ? gaea : null,
        swarmExe: fs.existsSync(swarm) ? swarm : null,
        installDir: dir,
      };
    }
    console.error(
      `[config] WARNING: GAEA_INSTALL_DIR="${dir}" set but no executables found there`
    );
  }

  // 2. Auto-detect from common Windows paths
  for (const dir of WINDOWS_CANDIDATE_DIRS) {
    const gaea = path.join(dir, "Gaea.exe");
    const swarm = path.join(dir, "Gaea.Swarm.exe");
    if (fs.existsSync(gaea) || fs.existsSync(swarm)) {
      console.error(`[config] Auto-detected Gaea install at: ${dir}`);
      return {
        gaeaExe: fs.existsSync(gaea) ? gaea : null,
        swarmExe: fs.existsSync(swarm) ? swarm : null,
        installDir: dir,
      };
    }
  }

  // 3. Not found
  console.error(
    `[config] WARNING: Gaea not found. Set GAEA_INSTALL_DIR in .env or install Gaea.`
  );
  return { gaeaExe: null, swarmExe: null, installDir: null };
}

const gaea = findGaea();

export const config = {
  ...gaea,
  projectDir: path.resolve(process.env.PROJECT_DIR || "./projects"),
  outputDir: path.resolve(process.env.OUTPUT_DIR || "./output"),
};
