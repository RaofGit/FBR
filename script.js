/* script.js
   Efficient, accessible handlers for:
   - Smooth in-page scrolling
   - Lead form submission (POST to endpoint with WhatsApp fallback)
   - Contact form UX
   - WhatsApp click + form conversion tracking via gtag (safe)
   - Minimal DOM queries, guarded code paths
*/

(function () {
  'use strict';

  /* ---------- Config (change via HTML data-attributes if desired) ---------- */
  // You may set <body data-wa="9231..." data-lead-endpoint="/api/leads"> to override.
  const BODY = document.body;
  const WHATSAPP_NUMBER = BODY.dataset.wa || '923177616631';
  const DEFAULT_LEAD_ENDPOINT = (BODY.dataset.leadEndpoint || '/api/leads');

  /* Map select values to human-readable service names */
  const SERVICE_LABELS = {
    ntn: 'NTN Registration',
    tax: 'Tax Return Filing',
    filer: 'Filer Registration',
    business: 'Business Registration',
    pvt: 'PVT Company Registration',
    trademark: 'Trademark Registration'
  };

  /* ---------- Utilities ---------- */
  function safeGtagEvent(action, params) {
    try {
      if (typeof gtag === 'function') gtag('event', action, params || {});
    } catch (e) {
      // analytics not configured; ignore silently
      // console.debug('gtag not available', e);
    }
  }

  function el(selector, ctx = document) { return ctx.querySelector(selector); }
  function els(selector, ctx = document) { return Array.from(ctx.querySelectorAll(selector)); }

  /* ---------- Smooth scrolling for same-page anchors ---------- */
  (function initSmoothScroll() {
    els('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (ev) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return; // ignore
        const target = document.querySelector(href);
        if (!target) return;
        ev.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // move focus for keyboard users and maintain accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        // update URL without adding history entry
        history.replaceState(null, '', href);
      });
    });
  })();

  /* ---------- WhatsApp tracking (all wa.me / api.whatsapp.com links) ---------- */
  (function initWhatsAppTracking() {
    // Delegate: listen at document to cover future links
    document.addEventListener('click', function (ev) {
      const a = ev.target.closest && ev.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
      if (!a) return;
      // Fire tracking and lightweight console log
      safeGtagEvent('conversion', { 'send_to': 'AW-CONVERSION_ID/WHATSAPP_LABEL' });
      // Optional: console.info('WhatsApp click:', a.href);
    }, true);
  })();

  /* ---------- Helper: build readable lead payload and WhatsApp text ---------- */
  function buildLeadPayload(form) {
    const fd = new FormData(form);
    const serviceVal = fd.get('service') || '';
    return {
      name: (fd.get('name') || '').trim(),
      contact: (fd.get('contact') || '').trim(),
      service: serviceVal,
      serviceLabel: SERVICE_LABELS[serviceVal] || serviceVal || 'Not specified',
      message: (fd.get('message') || '').trim(),
      source: window.location.href,
      referrer: document.referrer || ''
    };
  }

  function buildWhatsAppText(payload) {
    const lines = [
      'Lead request from website',
      `Name: ${payload.name || 'N/A'}`,
      `Contact: ${payload.contact || 'N/A'}`,
      `Service: ${payload.serviceLabel || 'N/A'}`,
      `Message: ${payload.message || 'N/A'}`
    ];
    return encodeURIComponent(lines.join('\n'));
  }

  /* ---------- Lead form handling (with server POST & WhatsApp fallback) ---------- */
  (function initLeadForm() {
    const form = el('#leadForm');
    if (!form) return;

    // allow overriding endpoint on the form element: <form data-endpoint="/foo">
    const endpoint = form.dataset.endpoint || DEFAULT_LEAD_ENDPOINT;
    const statusEl = el('#lead-status') || (function createStatusEl() {
      const s = document.createElement('div');
      s.id = 'lead-status';
      s.className = 'visually-hidden';
      form.appendChild(s);
      return s;
    })();

    // show message (visually-hidden used for screen-readers by default)
    function showStatus(msg, { visible = true, error = false, persist = false } = {}) {
      statusEl.classList.remove('visually-hidden');
      statusEl.textContent = msg;
      statusEl.style.color = error ? 'var(--danger)' : 'var(--text)';
      if (!persist && !error) {
        setTimeout(() => {
          statusEl.classList.add('visually-hidden');
          statusEl.textContent = '';
        }, 4000);
      }
    }

    // open WhatsApp fallback
    function openWhatsApp(payload) {
      const text = buildWhatsAppText(payload);
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
      // track conversion for fallback
      safeGtagEvent('conversion', { 'send_to': 'AW-CONVERSION_ID/WHATSAPP_LABEL' });
      window.open(url, '_blank');
    }

    // Post with timeout using AbortController
    async function postWithTimeout(url, data, timeout = 8000) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: controller.signal
        });
        clearTimeout(id);
        if (!res.ok) {
          const txt = await res.text().catch(() => res.statusText);
          throw new Error(txt || `Status ${res.status}`);
        }
        return res.json().catch(() => ({ ok: true }));
      } finally {
        clearTimeout(id);
      }
    }

    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();

      // Use native validation first
      if (!form.checkValidity()) {
        // show native browser validation UI
        form.reportValidity();
        return;
      }

      const payload = buildLeadPayload(form);
      if (!payload.name || !payload.contact || !payload.service) {
        showStatus('Please complete name, contact and select a service.', { error: true, persist: true });
        return;
      }

      showStatus('Sending your request…');

      try {
        await postWithTimeout(endpoint, payload, 8000);
        showStatus('Thanks — your request was sent. We will contact you soon.');
        safeGtagEvent('conversion', { 'send_to': 'AW-CONVERSION_ID/FORM_LABEL' });
        form.reset();
      } catch (err) {
        // fallback: open WhatsApp with prefilled message
        showStatus('Could not send to server — opening WhatsApp so you can send this request.', { error: true, persist: true });
        console.warn('Lead submit failed:', err);
        openWhatsApp(payload);
      }
    });

    // WhatsApp button prefill
    const waBtn = el('#lead-wa');
    if (waBtn) {
      waBtn.addEventListener('click', function () {
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        const payload = buildLeadPayload(form);
        openWhatsApp(payload);
      });
    }
  })();

  /* ---------- Contact form: lightweight UX + tracking ---------- */
  (function initContactForm() {
    const contactForm = el('#contact form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      // For now: simple UX (replace with server call if available)
      alert('Message sent! We will contact you shortly.');
      safeGtagEvent('conversion', { 'send_to': 'AW-CONVERSION_ID/FORM_LABEL' });
      contactForm.reset();
    });
  })();

  /* ---------- Optional: expose helpers for debugging (dev only) ---------- */
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window._royalHelpers = { buildLeadPayload, buildWhatsAppText };
  }

})();
