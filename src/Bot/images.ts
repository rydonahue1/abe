import fetch from 'node-fetch';

// Checks if url is an image type
export function isPathToImage(url: string) {
  if (typeof url !== "string") return false
  return url.match(/\.(jpg|jpeg|gif|png)$/) != null
}

// Checks if imsge exists
export async function imageExists(url: string) {
  const res = await fetch(url)
  return res.ok
}

