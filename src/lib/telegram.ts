const escapeHTML = (text: string = ''): string => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

export const sendTelegramNotification = async (
    reservationCode: string,
    items: any[],
    finalTotal: number,
    customer: any,
    paymentMethod: string,
    date: string,
    pickupTime: string,
    duration: string | number,
    mapsLink?: string
) => {
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.warn("Telegram bot token or Chat ID is missing. Notification not sent.");
        return;
    }

    // Format date in spanish
    const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('es-BO', { dateStyle: 'long' });
    
    const customerName = customer?.name || 'Cliente sin nombre';
    const customerPhone = customer?.phone || '';
    const customerCi = customer?.ci || 'No provisto';
    const cleanPhone = customerPhone.replace(/\D/g, '');

    let message = `🚴‍♂️ <b>NUEVA RESERVA DE ALQUILER</b>\n\n`;
    message += `🆔 <b>Código:</b> <code>${escapeHTML(reservationCode)}</code>\n`;
    message += `👤 <b>Cliente:</b> ${escapeHTML(customerName)}\n`;
    if (customerPhone) {
        message += `📞 <b>Teléfono:</b> <a href="https://wa.me/591${cleanPhone}">${escapeHTML(customerPhone)}</a>\n`;
    } else {
        message += `📞 <b>Teléfono:</b> Sin registrar\n`;
    }
    message += `🪪 <b>C.I.:</b> <code>${escapeHTML(customerCi)}</code>\n\n`;
    
    message += `📋 <b>Detalle del Pedido:</b>\n`;
    items.forEach((item) => {
        const specs = item.selectedWheelSize ? ` (Aro ${item.selectedWheelSize})` : '';
        const name = item.productNameSnapshot || item.productName || '';
        message += `• ${item.quantity}x <b>${escapeHTML(name)}</b>${escapeHTML(specs)} - Bs. ${item.total}\n`;
    });
    message += `\n📅 <b>Fecha de Retiro:</b> ${formattedDate}\n`;
    message += `⏰ <b>Hora:</b> ${pickupTime}\n`;
    message += `⏱️ <b>Duración:</b> ${duration} hora(s)\n`;
    message += `💳 <b>Método de Pago:</b> ${paymentMethod}\n`;
    message += `💰 <b>Total a pagar:</b> <b>Bs. ${finalTotal}</b>\n\n`;

    const transportItem = items.find(item => item.deliveryService || item.pickupService);
    if (transportItem) {
        const rawNotes = transportItem.notes || '';
        const cleanedNotes = rawNotes.replace('Transporte de entrega. ', '').replace('Transporte de recojo. ', '');
        message += `🚚 <b>Servicio de Transporte:</b>\n`;
        message += `📍 <b>Dirección:</b> ${escapeHTML(cleanedNotes)}\n`;
        if (mapsLink) {
            message += `🗺️ <a href="${escapeHTML(mapsLink)}">Ver ubicación en Google Maps</a>\n`;
        }
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: false
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Telegram API error response:", errText);
        } else {
            console.log("Telegram notification sent successfully.");
        }
    } catch (error) {
        console.error("Error sending Telegram notification:", error);
    }
};
