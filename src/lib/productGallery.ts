export function getValidProductImages(primary: string | undefined, additional: string[] | undefined): string[] {
  const unique = new Set<string>();
  const values = [primary || '', ...(additional || [])];

  values.forEach(value => {
    const image = value.trim();
    if (!image || /\s/.test(image) || image.startsWith('//')) return;
    try {
      const url = new URL(image, 'https://www.briz.com.bo');
      if (url.protocol !== 'https:') return;
      unique.add(image);
    } catch {
      // Ignore invalid or unsafe legacy references in public galleries.
    }
  });

  return Array.from(unique);
}
