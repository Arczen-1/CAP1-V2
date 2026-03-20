export function buildGoogleImageSearchUrl(name: string, category?: string) {
  const query = [name, category].filter(Boolean).join(' ').trim();
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
}
