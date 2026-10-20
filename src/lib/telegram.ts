const escapeHTML = (text: string = ''): string => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

export interface TelegramNotificationItem {
    selectedWheelSize?: string;
    productNameSnapshot?: string;
    productName?: string;
    quantity: number;
    total: number;
    deliveryService?: boolean;
    pickupService?: boolean;
    notes?: string;
}

export interface TelegramCustomerSummary {
    name?: string;
    phone?: string;
    ci?: string;
}

/**
 * Sends a Telegram notification for a new rental reservation.
 * Supports a server-side webhook proxy (VITE_TELEGRAM_WEBHOOK_URL) when configured,
 * and falls back to the Telegram Bot API with supergroup migration support.
 * Never logs token fragments or chat IDs to the browser console.
 */
export const sendTelegramNotification = async (
    reservationCode: string,
    items: TelegramNotificationItem[],
    finalTotal: number,
    customer: TelegramCustomerSummary | null | undefined,
    paymentMethod: string,
    date: string,
    pickupTime: string,
    duration: string | number,
    mapsLink?: string
) => {
    const webhookUrl = import.meta.env.VITE_TELEGRAM_WEBHOOK_URL;
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

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
    message += `\u{23F1} <b>Duraci\u00f3n:</b> ${duration}\n`;
    message += `\u{1F4B3} <b>M\u00e9todo de Pago:</b> ${paymentMethod}\n`;
    message += `\u{1F4B0} <b>Total a pagar:</b> <b>Bs. ${finalTotal}</b>\n\n`;

    const transportItem = items.find(item => item.deliveryService || item.pickupService);
    if (transportItem) {
        const rawNotes = transportItem.notes || '';
        const cleanedNotes = rawNotes.replace('Transporte de entrega. ', '').replace('Transporte de recojo. ', '');
        message += `\u{1F69A} <b>Servicio de Transporte:</b>\n`;
        message += `\u{1F4CD} <b>Direcci\u00f3n:</b> ${escapeHTML(cleanedNotes)}\n`;
        if (mapsLink) {
            message += `\u{1F5FA} <a href="${mapsLink}">Ver ubicaci\u00f3n en Google Maps</a>\n`;
        }
    }

    // 1. Prefer secure server-side webhook proxy if configured
    if (webhookUrl) {
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservationCode,
                    message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                })
            });
            if (res.ok) return;
        } catch {
            // Fall through to direct Bot API if webhook fails and credentials are present
        }
    }

    if (!token || !chatId) {
        return;
    }

    const sendToChat = async (targetChatId: string) => {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: targetChatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }),
        });
        return response.json();
    };

    try {
        let result = await sendToChat(chatId);

        // Handle Telegram supergroup migration automatically
        if (!result.ok && result.parameters?.migrate_to_chat_id) {
            const newChatId = String(result.parameters.migrate_to_chat_id);
            result = await sendToChat(newChatId);
        }

        if (!result.ok) {
            console.warn(`[Telegram] No se pudo entregar la notificación (${result.error_code || 'error'}).`);
        }
    } catch {
        console.warn('[Telegram] Error de red al enviar notificación.');
    }
};
