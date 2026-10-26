/**
 * Resolves a public asset path (e.g. "ethynd/world_expanded.json") against Vite's BASE_URL
 * so assets load identically on local dev ("/"), GitHub Pages subpaths ("./" or "/repo/"),
 * and headless Node/TSX CLI builders.
 */
export function assetUrl(relativePath: string): string {
  const cleanRel = relativePath.replace(/^\/+/, '');
  const meta = import.meta as unknown as { env?: { BASE_URL?: string } };
  const base = meta.env?.BASE_URL ?? '/';
  if (base.endsWith('/')) {
    return `${base}${cleanRel}`;
  }
  return `${base}/${cleanRel}`;
}
