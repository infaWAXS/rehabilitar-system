import { apiRequest } from './apiClient';

// HU: Ver suscripciones — lista de planes activos (sin auth)
export function getPlans() {
  return apiRequest('/payments/plans');
}

// HU: Consultar si el cliente logueado es abonado y qué plan tiene
export function getMyPlan() {
  return apiRequest('/payments/my-plan');
}

// HU: Pagar Mercado Pago — simulación de checkout
// test_scenario: "success" | "insufficient_funds" | "connection_error"
export function mercadoPagoCheckout(plan_id, specialization, test_scenario) {
  return apiRequest('/payments/mercadopago/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan_id, specialization, test_scenario }),
  });
}

