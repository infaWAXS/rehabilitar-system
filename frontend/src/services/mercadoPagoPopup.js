// Utilidad compartida: abre la ventana de simulación de Mercado Pago y
// escucha su resultado via postMessage (mismo origen).
const MP_ORIGEN = 'mp-simulador';
const MP_POPUP_NAME = 'mercadopago_simulado';
const MP_POPUP_FEATURES = 'width=460,height=680,menubar=no,toolbar=no,location=no,status=no';

// callbacks: { onResultado(scenario), onCancelado(motivo) }
export function abrirVentanaPago({ monto, descripcion }, callbacks = {}) {
  const params = new URLSearchParams({
    monto: String(monto ?? ''),
    descripcion: descripcion || '',
  });

  const popup = window.open(`/pago/mercadopago?${params.toString()}`, MP_POPUP_NAME, MP_POPUP_FEATURES);

  if (!popup) {
    callbacks.onCancelado?.('popup_bloqueado');
    return { cancelar: () => {} };
  }

  popup.focus();

  let finalizado = false;

  function limpiar() {
    window.removeEventListener('message', handleMessage);
    clearInterval(intervalo);
  }

  function handleMessage(event) {
    if (event.origin !== window.location.origin) return;
    if (event.data?.source !== MP_ORIGEN) return;
    if (finalizado) return;

    if (event.data.type === 'resultado') {
      finalizado = true;
      limpiar();
      callbacks.onResultado?.(event.data.scenario);
    } else if (event.data.type === 'cancelado') {
      finalizado = true;
      limpiar();
      callbacks.onCancelado?.('usuario');
    }
  }

  window.addEventListener('message', handleMessage);

  // Respaldo: si el usuario cierra la ventana manualmente (X) sin
  // completar el pago, lo tratamos como cancelación.
  const intervalo = setInterval(() => {
    if (popup.closed && !finalizado) {
      finalizado = true;
      limpiar();
      callbacks.onCancelado?.('cerrada');
    }
  }, 400);

  return {
    cancelar: () => {
      if (finalizado) return;
      finalizado = true;
      limpiar();
      if (!popup.closed) popup.close();
    },
  };
}
