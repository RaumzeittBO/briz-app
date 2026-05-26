import type { Sale, Rental } from '@/context/StoreContext';

const PHONE_NUMBER = '59177860277'; // Found in ShopPage existing links

export const generateShopWhatsAppLink = (sale: Sale) => {
    let msg = `Hola Briz 👋,\nQuiero confirmar mi compra en la tienda:\n\n`;

    msg += `*DATOS DEL CLIENTE*\n`;
    msg += `- Nombre: ${sale.customerName}\n`;
    msg += `- CI: ${sale.customerCI}\n`;
    msg += `- Celular: ${sale.customerPhone}\n\n`;

    msg += `*DETALLE DE COMPRA*\n`;
    sale.items.forEach(item => {
        msg += `- ${item.quantity}x ${item.name} (Bs. ${item.price} c/u) = Bs. ${item.price * item.quantity}\n`;
    });

    msg += `\n*TOTAL: Bs. ${sale.total}*\n`;
    if (sale.notes) msg += `\n*Notas:* ${sale.notes}\n`;

    const encodedMsg = encodeURIComponent(msg).replace(/%2A/g, '*');
    return `https://api.whatsapp.com/send?phone=${PHONE_NUMBER}&text=${encodedMsg}`;
};

export const generateRentalWhatsAppLink = (rental: Rental) => {
    const formatBolivianDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    let msg = `Hola Briz 👋,\nQuiero realizar una reserva de alquiler:\n\n`;

    msg += `*DATOS DEL CLIENTE*\n`;
    msg += `- Nombre: ${rental.customerName}\n`;
    msg += `- CI: ${rental.customerCI}\n`;
    msg += `- Celular: ${rental.customerPhone}\n\n`;

    msg += `*DETALLE DE RESERVA*\n`;
    msg += `- Bicicleta: ${rental.bikeSnapshot.name}\n`;
    msg += `- Fecha: ${formatBolivianDate(rental.date)}\n`;
    msg += `- Hora Recogida: ${rental.pickupTime}\n`;
    msg += `- Duración: ${rental.duration}\n`;

    if (rental.accessories.length > 0) {
        msg += `\n*ACCESORIOS EXTRA*\n`;
        rental.accessories.forEach(acc => {
            msg += `- ${acc.quantity}x ${acc.name} (Bs. ${acc.price} c/u) = Bs. ${acc.price * acc.quantity}\n`;
        });
    }

    msg += `\n*TOTAL ESTIMADO: Bs. ${rental.total}*\n`;
    if (rental.notes) msg += `\n*Notas:* ${rental.notes}\n`;

    const encodedMsg = encodeURIComponent(msg).replace(/%2A/g, '*');
    return `https://api.whatsapp.com/send?phone=${PHONE_NUMBER}&text=${encodedMsg}`;
};

export const generateGroupRentalWhatsAppLink = (data: {
    customerName: string;
    customerPhone: string;
    customerCI: string;
    bikeName: string;
    bikeQty: number;
    date: string;
    pickupTime: string;
    duration: string;
    notes: string;
}) => {
    const formatBolivianDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    let msg = `Hola Briz 👋,\nQueremos realizar una *RESERVA GRUPAL*:\n\n`;

    msg += `*DATOS DEL REPRESENTANTE*\n`;
    msg += `- Nombre: ${data.customerName}\n`;
    msg += `- CI: ${data.customerCI}\n`;
    msg += `- Celular: ${data.customerPhone}\n\n`;

    msg += `*DETALLE DEL EVENTO / RESERVA*\n`;
    msg += `- Bicicleta Solicitada: ${data.bikeName}\n`;
    msg += `- Cantidad Estimada: ${data.bikeQty} unidades\n`;
    msg += `- Fecha: ${formatBolivianDate(data.date)}\n`;
    msg += `- Hora Recogida: ${data.pickupTime}\n`;
    msg += `- Duración: ${data.duration}\n\n`;

    msg += `Por favor, confírmenme la disponibilidad para este grupo grande.\n`;
    if (data.notes) msg += `\n*Notas:* ${data.notes}\n`;

    const encodedMsg = encodeURIComponent(msg).replace(/%2A/g, '*');
    return `https://api.whatsapp.com/send?phone=${PHONE_NUMBER}&text=${encodedMsg}`;
};
