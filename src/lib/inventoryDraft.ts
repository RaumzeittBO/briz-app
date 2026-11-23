export type InventoryDraft = Record<string, unknown>;

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Return only fields explicitly changed from the snapshot the editor opened. */
export function createInventoryDraftPatch<T extends InventoryDraft>(
  original: T,
  draft: T,
): Partial<T> {
  const patch: Partial<T> = {};

  for (const [key, value] of Object.entries(draft) as Array<[keyof T, T[keyof T]]>) {
    if (key === 'id' || sameValue(original[key], value)) continue;
    patch[key] = value;
  }

  return patch;
}

export function findInventoryDraftConflicts<T extends InventoryDraft>(
  original: T,
  current: T,
  patch: Partial<T>,
): Array<keyof T> {
  return (Object.keys(patch) as Array<keyof T>).filter(key =>
    !sameValue(original[key], current[key]),
  );
}

export function getInventoryContentFieldsToClear(
  original: InventoryDraft,
  draft: InventoryDraft,
): string[] {
  const protectedFields = [
    'imageUrl',
    'additionalImageUrls',
    'description',
    'details',
    'descriptionEn',
    'detailsEn',
  ];

  return protectedFields.filter(key => {
    const before = original[key];
    const after = draft[key];
    const hadContent = Array.isArray(before)
      ? before.some(value => typeof value === 'string' && value.trim() !== '')
      : typeof before === 'string' && before.trim() !== '';
    const isEmpty = Array.isArray(after)
      ? after.every(value => typeof value !== 'string' || value.trim() === '')
      : typeof after !== 'string' || after.trim() === '';
    return hadContent && isEmpty && !sameValue(before, after);
  });
}
