import { apiRequest } from './apiClient';

// TODO (Ezequiel): conectar con paymentRoutes.py
export function getMySubscriptions() {
  return apiRequest('/subscriptions/me');
}

export function createMercadoPagoCheckout(data) {
  return apiRequest('/payments/mercadopago/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
