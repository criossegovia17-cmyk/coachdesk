import { CLAB } from './config.js?v=17';

// Si ya hay una sesión iniciada, entra directo a la app (usa ?landing para ver esta página igualmente)
try {
  if (!/landing/.test(location.search) && Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k))) location.replace('app.html');
} catch { /* sin acceso a localStorage */ }

const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
['trial', 'trial2', 'trial3'].forEach((id) => set(id, CLAB.trialDays));
set('p-mxn', CLAB.price.MXN); set('p-usd', CLAB.price.USD);

// Contacto directo: abre WhatsApp o el correo con el mensaje escrito (los datos de contacto se definen en config.js)
const ct = CLAB.contact || {}, form = document.getElementById('contact-form');
if (form) {
  const wa = (ct.whatsapp || '').replace(/\D/g, '');
  document.getElementById('c-wa').hidden = !wa; document.getElementById('c-mail').hidden = !ct.email;
  document.getElementById('c-none').hidden = !!(wa || ct.email);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = `Hola, soy ${form.name.value.trim()}. ${form.msg.value.trim()}`, via = e.submitter?.dataset.via;
    location.href = via === 'mail' ? `mailto:${ct.email}?subject=${encodeURIComponent('Consulta C-Lab')}&body=${encodeURIComponent(text)}` : `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
  });
}
