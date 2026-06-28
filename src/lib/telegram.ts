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
    
    let message = `🚴‍♂️ *NUEVA RESERVA DE ALQUILER*\n\n`;
    message += `🆔 *Código:* \`${reservationCode}\`\n`;
    message += `👤 *Cliente:* ${customer.name}\n`;
    message += `📞 *Teléfono:* [${customer.phone}](https://wa.me/591${customer.phone.replace(/\D/g, '')})\n`;
    message += `🪪 *C.I.:* \`${customer.ci}\`\n\n`;
    
    message += `📋 *Detalle del Pedido:*\n`;
    items.forEach((item) => {
        const specs = item.selectedWheelSize ? ` (Aro ${item.selectedWheelSize})` : '';
        message += `• ${item.quantity}x *${item.productNameSnapshot || item.productName}*${specs} - Bs. ${item.total}\n`;
    });
    message += `\n📅 *Fecha de Retiro:* ${formattedDate}\n`;
    message += `⏰ *Hora:* ${pickupTime}\n`;
    message += `⏱️ *Duración:* ${duration} hora(s)\n`;
    message += `💳 *Método de Pago:* ${paymentMethod}\n`;
    message += `💰 *Total a pagar:* *Bs. ${finalTotal}*\n\n`;

    const transportItem = items.find(item => item.deliveryService || item.pickupService);
    if (transportItem) {
        message += `🚚 *Servicio de Transporte:*\n`;
        message += `📍 *Dirección:* ${transportItem.notes.replace('Transporte de entrega. ', '').replace('Transporte de recojo. ', '')}\n`;
        if (mapsLink) {
            message += `🗺️ [Ver ubicación en Google Maps](${mapsLink})\n`;
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
                parse_mode: 'Markdown',
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
