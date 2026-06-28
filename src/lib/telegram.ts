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
        console.error(
            `[Telegram] VARIABLES DE ENTORNO FALTANTES. Token presente: ${!!token}, ChatId presente: ${!!chatId}. ` +
            `Asegurate de configurar VITE_TELEGRAM_BOT_TOKEN y VITE_TELEGRAM_CHAT_ID en el panel de Vercel > Settings > Environment Variables.`
        );
        return;
    }

    // Format date in spanish
    const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('es-BO', { dateStyle: 'long' });
    
    const customerName = customer?.name || 'Cliente sin nombre';
    const customerPhone = customer?.phone || '';
    const customerCi = customer?.ci || 'No provisto';
    const cleanPhone = customerPhone.replace(/\D/g, '');

    let message = `\u{1F6B4} <b>NUEVA RESERVA DE ALQUILER</b>\n\n`;
    message += `\u{1F194} <b>C\u00f3digo:</b> <code>${escapeHTML(reservationCode)}</code>\n`;
    message += `\u{1F464} <b>Cliente:</b> ${escapeHTML(customerName)}\n`;
    if (customerPhone) {
        message += `\u{1F4DE} <b>Tel\u00e9fono:</b> <a href="https://wa.me/591${cleanPhone}">${escapeHTML(customerPhone)}</a>\n`;
    } else {
        message += `\u{1F4DE} <b>Tel\u00e9fono:</b> Sin registrar\n`;
    }
    message += `\u{1FAB9} <b>C.I.:</b> <code>${escapeHTML(customerCi)}</code>\n\n`;
    
    message += `\u{1F4CB} <b>Detalle del Pedido:</b>\n`;
    items.forEach((item) => {
        const specs = item.selectedWheelSize ? ` (Aro ${item.selectedWheelSize})` : '';
        const name = item.productNameSnapshot || item.productName || '';
        message += `\u2022 ${item.quantity}x <b>${escapeHTML(name)}</b>${escapeHTML(specs)} - Bs. ${item.total}\n`;
    });
    message += `\n\u{1F4C5} <b>Fecha de Retiro:</b> ${formattedDate}\n`;
    message += `\u{23F0} <b>Hora:</b> ${pickupTime}\n`;
    message += `\u{23F1} <b>Duraci\u00f3n:</b> ${duration} hora(s)\n`;
    message += `\u{1F4B3} <b>M\u00e9todo de Pago:</b> ${paymentMethod}\n`;
    message += `\u{1F4B0} <b>Total a pagar:</b> <b>Bs. ${finalTotal}</b>\n\n`;

    const transportItem = items.find(item => item.deliveryService || item.pickupService);
    if (transportItem) {
        const rawNotes = transportItem.notes || '';
        const cleanedNotes = rawNotes.replace('Transporte de entrega. ', '').replace('Transporte de recojo. ', '');
        message += `\u{1F69A} <b>Servicio de Transporte:</b>\n`;
        message += `\u{1F4CD} <b>Direcci\u00f3n:</b> ${escapeHTML(cleanedNotes)}\n`;
        if (mapsLink) {
            // Raw URL in href - do NOT escape the URL itself, only text content
            message += `\u{1F5FA} <a href="${mapsLink}">Ver ubicaci\u00f3n en Google Maps</a>\n`;
        }
    }

    console.log(`[Telegram] Enviando notificacion para reserva ${reservationCode}...`);

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
                disable_web_page_preview: true
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Telegram] Error ${response.status} al enviar mensaje:`, errText);
        } else {
            const result = await response.json();
            console.log(`[Telegram] Notificacion enviada exitosamente. Message ID: ${result?.result?.message_id}`);
        }
    } catch (error) {
        console.error("[Telegram] Error de red al enviar notificacion:", error);
    }
};
