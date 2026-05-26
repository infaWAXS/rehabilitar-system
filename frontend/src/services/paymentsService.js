import { apiRequest } from './apiClient';

// HU: Ver suscripciones — lista de planes activos (sin auth)
export function getPlans() {
  return apiRequest('/payments/plans');
}

// HU: Pagar Mercado Pago — simulación de checkout
// test_scenario: "success" | "insufficient_funds" | "connection_error"
export function mercadoPagoCheckout(plan_id, test_scenario) {
  return apiRequest('/payments/mercadopago/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan_id, test_scenario }),
  });
}

