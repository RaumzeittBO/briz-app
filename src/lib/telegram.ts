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
 * Telegram delivery is intentionally disabled in the browser. Bot credentials
 * and customer details must be handled by a trusted server function; there is
 * no server notification endpoint configured in this repository yet.
 */
export const sendTelegramNotification: (
    ...args: [
        reservationCode: string,
        items: TelegramNotificationItem[],
        finalTotal: number,
        customer: TelegramCustomerSummary | null | undefined,
        paymentMethod: string,
        date: string,
        pickupTime: string,
        duration: string | number,
        mapsLink?: string
    ]
) => Promise<void> = async (...args) => {
    void args;
};
