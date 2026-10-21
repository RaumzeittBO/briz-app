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
    language?: 'es' | 'en';
}) => {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const isEn = data.language === 'en';

    let msg = isEn
        ? `Hello Briz 👋,\nI would like to book a bike rental:\n`
        : `Hola Briz 👋,\nQuiero realizar una reserva de alquiler:\n`;
    msg += isEn
        ? `*Reservation Code:* ${data.reservationCode}\n\n`
        : `*Código de Reserva:* ${data.reservationCode}\n\n`;

    msg += isEn ? `*CUSTOMER DETAILS*\n` : `*DATOS DEL CLIENTE*\n`;
    msg += isEn ? `- Name: ${data.customerName}\n` : `- Nombre: ${data.customerName}\n`;
    msg += `- CI / ID: ${data.customerCI}\n`;
    msg += isEn ? `- Phone: ${data.customerPhone}\n\n` : `- Celular: ${data.customerPhone}\n\n`;

    msg += isEn ? `*BOOKING DETAILS*\n` : `*DETALLE DE RESERVA*\n`;
    msg += isEn ? `- Product: ${data.productName}\n` : `- Producto: ${data.productName}\n`;
    msg += isEn ? `- Quantity: ${data.quantity} unit(s)\n` : `- Cantidad: ${data.quantity} unidad(es)\n`;
    if (data.selectedWheelSize) {
        msg += isEn ? `- Wheel size: ${data.selectedWheelSize}\n` : `- Aro seleccionado: ${data.selectedWheelSize}\n`;
    }
    msg += isEn ? `- Date: ${formatDate(data.date)}\n` : `- Fecha: ${formatDate(data.date)}\n`;
    msg += isEn ? `- Pickup time: ${data.pickupTime}\n` : `- Hora Recogida: ${data.pickupTime}\n`;
    msg += isEn ? `- Duration: ${data.duration}\n` : `- Duración: ${data.duration}\n`;
    msg += isEn ? `- Payment method: ${data.paymentMethod}\n` : `- Método de pago: ${data.paymentMethod}\n`;

    msg += isEn ? `\n*ESTIMATED TOTAL: Bs. ${data.total}*\n` : `\n*TOTAL ESTIMADO: Bs. ${data.total}*\n`;
    if (data.notes) msg += isEn ? `\n*Notes:* ${data.notes}\n` : `\n*Notas:* ${data.notes}\n`;

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
    language?: 'es' | 'en';
}) => {
    const isEn = data.language === 'en';
    let msg = isEn
        ? `Hello Briz 👋,\nI would like to confirm my purchase:\n\n`
        : `Hola Briz 👋,\nQuiero confirmar mi compra:\n\n`;

    msg += isEn ? `*CUSTOMER DETAILS*\n` : `*DATOS DEL CLIENTE*\n`;
    msg += isEn ? `- Name: ${data.customerName}\n` : `- Nombre: ${data.customerName}\n`;
    msg += `- CI / ID: ${data.customerCI}\n`;
    msg += isEn ? `- Phone: ${data.customerPhone}\n\n` : `- Celular: ${data.customerPhone}\n\n`;

    msg += isEn ? `*PURCHASE DETAILS*\n` : `*DETALLE DE COMPRA*\n`;
    data.items.forEach(item => {
        msg += `- ${item.quantity}x ${item.name} (Bs. ${item.price} ${isEn ? 'ea.' : 'c/u'}) = Bs. ${item.price * item.quantity}\n`;
    });

    msg += `\n*TOTAL: Bs. ${data.total}*\n`;
    if (data.notes) msg += isEn ? `\n*Notes:* ${data.notes}\n` : `\n*Notas:* ${data.notes}\n`;

    const encodedMsg = encodeURIComponent(msg).replace(/%2A/g, '*');
    return `https://api.whatsapp.com/send?phone=${PHONE_NUMBER}&text=${encodedMsg}`;
};

export const generateAdminReplyWhatsAppLink = (phone: string, reservationCode: string, customerName: string, status: string) => {
    let msg = `Hola ${customerName} 👋, te escribimos de Briz.\n\n`;
    if (status === 'confirmed' || status === 'Confirmado') {
        msg += `Te confirmamos que tu reserva *${reservationCode}* ha sido confirmada con éxito. ¡Te esperamos! 🚲`;
    } else if (status === 'delivered' || status === 'Entregado') {
        msg += `Tu alquiler *${reservationCode}* ya se encuentra activo y entregado. ¡Disfruta el paseo con Briz! 🚲✨`;
    } else if (status === 'returned' || status === 'Devuelto') {
        msg += `Hemos registrado la devolución de tu alquiler *${reservationCode}*. ¡Muchas gracias por pedalear con Briz! 💛🚲`;
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
