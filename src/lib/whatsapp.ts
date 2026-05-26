const PHONE_NUMBER = '59177860277';

export const generateRentalWhatsAppLink = (data: {
    reservationCode: string;
    customerName: string;
    customerPhone: string;
    customerCI: string;
    productName: string;
    quantity: number;
    duration: string;
    date: string;
    pickupTime: string;
    selectedWheelSize?: string;
    total: number;
    paymentMethod: string;
    notes: string;
}) => {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    let msg = `Hola Briz 👋,\nQuiero realizar una reserva de alquiler:\n`;
    msg += `*Código de Reserva:* ${data.reservationCode}\n\n`;

    msg += `*DATOS DEL CLIENTE*\n`;
    msg += `- Nombre: ${data.customerName}\n`;
    msg += `- CI: ${data.customerCI}\n`;
    msg += `- Celular: ${data.customerPhone}\n\n`;

    msg += `*DETALLE DE RESERVA*\n`;
    msg += `- Producto: ${data.productName}\n`;
    msg += `- Cantidad: ${data.quantity} unidad(es)\n`;
    if (data.selectedWheelSize) {
        msg += `- Aro seleccionado: ${data.selectedWheelSize}\n`;
    }
    msg += `- Fecha: ${formatDate(data.date)}\n`;
    msg += `- Hora Recogida: ${data.pickupTime}\n`;
    msg += `- Duración: ${data.duration}\n`;
    msg += `- Método de pago: ${data.paymentMethod}\n`;

    msg += `\n*TOTAL ESTIMADO: Bs. ${data.total}*\n`;
    if (data.notes) msg += `\n*Notas:* ${data.notes}\n`;

    const encodedMsg = encodeURIComponent(msg).replace(/%2A/g, '*');
    return `https://api.whatsapp.com/send?phone=${PHONE_NUMBER}&text=${encodedMsg}`;
};

export const generateShopWhatsAppLink = (data: {
    customerName: string;
    customerPhone: string;
    customerCI: string;
    items: { name: string; price: number; quantity: number }[];
    total: number;
    notes?: string;
}) => {
    let msg = `Hola Briz 👋,\nQuiero confirmar mi compra:\n\n`;

    msg += `*DATOS DEL CLIENTE*\n`;
    msg += `- Nombre: ${data.customerName}\n`;
    msg += `- CI: ${data.customerCI}\n`;
    msg += `- Celular: ${data.customerPhone}\n\n`;

    msg += `*DETALLE DE COMPRA*\n`;
    data.items.forEach(item => {
        msg += `- ${item.quantity}x ${item.name} (Bs. ${item.price} c/u) = Bs. ${item.price * item.quantity}\n`;
    });

    msg += `\n*TOTAL: Bs. ${data.total}*\n`;
    if (data.notes) msg += `\n*Notas:* ${data.notes}\n`;

    const encodedMsg = encodeURIComponent(msg).replace(/%2A/g, '*');
    return `https://api.whatsapp.com/send?phone=${PHONE_NUMBER}&text=${encodedMsg}`;
};

export const generateAdminReplyWhatsAppLink = (phone: string, reservationCode: string, customerName: string, status: string) => {
    let msg = `Hola ${customerName} 👋, te escribimos de Briz.\n\n`;
    if (status === 'confirmed' || status === 'Confirmado') {
        msg += `Te confirmamos que tu reserva *${reservationCode}* ha sido confirmada con éxito. ¡Te esperamos! 🚲`;
    } else if (status === 'cancelled' || status === 'Cancelado') {
        msg += `Te informamos que tu reserva *${reservationCode}* ha sido cancelada. Si tienes alguna duda, por favor avísanos por este medio.`;
    } else if (status === 'expired' || status === 'Expirado') {
        msg += `Tu reserva *${reservationCode}* ha expirado debido a la falta de confirmación/pago dentro del tiempo límite. Si deseas volver a reservar, no dudes en escribirnos.`;
    } else {
        msg += `Te escribimos para coordinar los detalles de tu reserva *${reservationCode}*.`;
    }
    const cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '').trim();
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
};
