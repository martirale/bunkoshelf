import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export async function loadUnrarWasmBinary(): Promise<Buffer> {
  const wasmPath = await findUnrarWasmPath();
  return fsp.readFile(wasmPath);
}

async function findUnrarWasmPath(): Promise<string> {
  const relativeWasmPath = path.join(
    "node_modules",
    "node-unrar-js",
    "esm",
    "js",
    "unrar.wasm"
  );

  const candidates = new Set<string>([
    path.join(process.cwd(), relativeWasmPath),
  ]);

  let currentDir = path.dirname(fileURLToPath(import.meta.url));

  while (true) {
    candidates.add(path.join(currentDir, relativeWasmPath));
    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  for (const candidate of candidates) {
    try {
      await fsp.access(candidate);
      return candidate;
    } catch {}
  }

  throw new Error("Unable to locate node-unrar-js wasm binary");
}
