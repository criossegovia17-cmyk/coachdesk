// Configuración del producto. Edita aquí precios, prueba gratis y enlace de pago.
export const CLAB = {
  name: 'C-Lab',
  trialDays: 14,                       // días de prueba gratis para cuentas nuevas
  price: { MXN: '$349', USD: '$19' },  // precio mensual del plan Pro (solo se muestra; el cobro depende del enlace de pago)
  checkoutUrl: '',                     // enlace de pago (Stripe Payment Link o similar). Vacío = pagos aún no activos
  enforce: false,                      // true = al terminar la prueba sin suscripción, la cuenta queda en solo lectura
  features: ['Clientes y rutinas ilimitados', 'Portal del cliente con registro de series', 'Nutrición por porciones y PDF', 'Entreno grupal con IA y modo sesión'],
};
