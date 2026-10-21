export type ReceiptLanguage = 'es' | 'en';

export function getReservationReceiptCopy(language: ReceiptLanguage) {
  if (language === 'es') {
    return {
      title: 'Solicitud recibida',
      description: 'Tu solicitud está pendiente de confirmación por el equipo de BRIZ. No se envió una notificación automática; guarda este código y revisa el estado en tu perfil o contáctanos por WhatsApp.',
    };
  }

  return {
    title: 'Request received',
    description: 'Your request is pending confirmation by the BRIZ team. No automatic notification was sent; save this code and check its status in your profile or contact us on WhatsApp.',
  };
}
