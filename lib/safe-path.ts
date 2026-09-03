import { realpathSync, existsSync } from "node:fs";
import { resolve, sep } from "node:path";

/**
 * Resolves `relativePath` against `rootDir` and throws if the result would
 * escape the root (path traversal, e.g. "../../etc/passwd"). Used anywhere we
 * build a filesystem path from query/user input (the admin media browser).
 */
export function resolveSafePath(rootDir: string, relativePath: string): string {
  const root = existsSync(rootDir) ? realpathSync(rootDir) : resolve(rootDir);
  const candidate = resolve(root, relativePath);
  const resolvedCandidate = existsSync(candidate) ? realpathSync(candidate) : candidate;

  if (resolvedCandidate !== root && !resolvedCandidate.startsWith(root + sep)) {
    throw new Error(`Path "${relativePath}" escapes the allowed root directory`);
  }

  return resolvedCandidate;
}
