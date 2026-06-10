(function() {
  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setStatus(form, type, message) {
    var status = form.querySelector('[data-newsletter-status]');
    if (!status) return;
    status.className = 'newsletter-status ' + (type || '');
    status.textContent = message || '';
  }

  async function submitNewsletter(form) {
    var input = form.querySelector('input[name="email"]');
    var button = form.querySelector('button[type="submit"]');
    var sourceEl = form.closest('[data-newsletter-source]');
    var email = input ? input.value.trim() : '';

    if (!validEmail(email)) {
      setStatus(form, 'error', 'Please enter a valid email address.');
      return;
    }

    if (button) button.disabled = true;
    setStatus(form, '', 'Subscribing...');

    try {
      var response = await fetch('/.netlify/functions/newsletter-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          source: sourceEl ? sourceEl.getAttribute('data-newsletter-source') : window.location.pathname,
          page: window.location.href
        })
      });
      var data = await response.json().catch(function() { return {}; });

      if (response.status === 501 && data.portalUrl) {
        window.location.href = data.portalUrl;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Subscription failed. Please try again.');
      }

      form.reset();
      setStatus(form, 'success', data.message || 'Check your email to confirm your subscription.');
    } catch (error) {
      setStatus(form, 'error', error.message || 'Subscription failed. Please try again.');
    } finally {
      if (button) button.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-newsletter-form]').forEach(function(form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        submitNewsletter(form);
      });
    });
  });
})();
