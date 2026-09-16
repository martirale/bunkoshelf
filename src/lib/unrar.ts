import fsp from "fs/promises";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const unrarWasmPath = require.resolve("node-unrar-js/esm/js/unrar.wasm");

export async function loadUnrarWasmBinary(): Promise<Buffer> {
  return fsp.readFile(unrarWasmPath);
}
