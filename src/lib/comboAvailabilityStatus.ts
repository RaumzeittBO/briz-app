import type { ComboAvailabilityReport } from './rentalAvailability';
import type { InventoryItem } from '@/context/StoreContext';

export function describeComboAvailabilityIssue(
    report: ComboAvailabilityReport,
    inventory: InventoryItem[],
): string {
    if (report.available > 0) return `${report.available} disponible${report.available === 1 ? '' : 's'}`;

    const bottleneck = report.components.find(component => component.isBottleneck && component.capacity === 0);
    if (!bottleneck) return report.bottleneckReason || 'Sin disponibilidad';

    switch (bottleneck.reasonCode) {
        case 'inactive_item':
            return `Componente inactivo: ${bottleneck.name}`;
        case 'missing_item':
            return /bike|bici|mamachari/i.test(bottleneck.inventoryItemId)
                ? 'Falta vincular bicicleta'
                : 'Falta vincular componente';
        case 'store_mismatch':
            return 'Otra sucursal';
        case 'in_maintenance':
            return 'En taller';
        case 'wheel_size_unavailable':
            return `Aro no disponible para ${bottleneck.name}`;
        case 'reserved':
            return 'Sin disponibilidad para el horario';
        case 'out_of_stock': {
            const item = inventory.find(candidate => candidate.id === bottleneck.resolvedItemId);
            return item?.itemType === 'accessory' ? 'Accesorio sin stock' : 'Bicicleta sin stock';
        }
        case 'ok':
            return bottleneck.availableStock > 0
                ? `Stock insuficiente (${bottleneck.availableStock} disponible; se requieren ${bottleneck.requiredQuantity})`
                : 'Sin stock disponible';
    }
}
