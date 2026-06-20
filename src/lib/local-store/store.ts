import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".relay-data");

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  try {
    const contents = await readFile(path.join(dataDir, filename), "utf8");
    return JSON.parse(contents) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile<T>(filename: string, data: T) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    path.join(dataDir, filename),
    JSON.stringify(data, null, 2),
    "utf8",
  );
}

export function createLocalId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
