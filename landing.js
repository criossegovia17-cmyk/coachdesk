import { CLAB } from './config.js?v=17';

// Si ya hay una sesión iniciada, entra directo a la app (usa ?landing para ver esta página igualmente)
try {
  if (!/landing/.test(location.search) && Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k))) location.replace('app.html');
} catch { /* sin acceso a localStorage */ }

const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
['trial', 'trial2', 'trial3'].forEach((id) => set(id, CLAB.trialDays));
set('p-mxn', CLAB.price.MXN); set('p-usd', CLAB.price.USD);
