import fsp from "fs/promises";
import path from "path";

const unrarWasmPath = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "node_modules",
  "node-unrar-js",
  "esm",
  "js",
  "unrar.wasm"
);

export async function loadUnrarWasmBinary(): Promise<Buffer> {
  return fsp.readFile(unrarWasmPath);
}
