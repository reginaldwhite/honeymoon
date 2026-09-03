/**
 * URL for streaming a file out of PHOTO_SOURCE_DIR through the dev-only raw
 * route. Passing a `version` (the file's mtime) makes the response cacheable
 * forever; omitting it makes the route send `no-store`, so an edited file is
 * never served stale under an unchanged URL. Passing a `width` returns a
 * resized WebP instead of the multi-megabyte original.
 */
export function rawMediaUrl(sourcePath: string, version?: number, width?: number): string {
  const params = new URLSearchParams({ path: sourcePath });
  if (version !== undefined) params.set("v", String(version));
  if (width !== undefined) params.set("w", String(width));
  return `/admin/api/raw?${params.toString()}`;
}
