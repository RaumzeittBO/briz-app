export const SUPPORTED_WHEEL_SIZES = ['12', '13', '16', '18', '20', '24', '26', '27', '28', '29'] as const;

export function validateUniqueWheelSizes(values: Array<{ size: string }>): void {
    const normalized = values.map(({ size }) => String(size).trim().toLocaleLowerCase());
    if (normalized.some(size => !size)) throw new Error('Cada fila de stock debe tener un tamaño de aro.');
    if (new Set(normalized).size !== normalized.length) throw new Error('No se pueden repetir tamaños de aro en la misma bicicleta.');
}

export function nextWheelSize(values: Array<{ size: string }>): string {
    const used = new Set(values.map(value => String(value.size)));
    return SUPPORTED_WHEEL_SIZES.find(size => !used.has(size)) || String(Number(values.at(-1)?.size || 26) + 1);
}
