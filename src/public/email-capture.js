// Email Capture - Sticky Banner and Exit Intent
(function() {
  'use strict';
  
  // Check if user already signed up
  const hasSignedUp = localStorage.getItem('robspain_email_signup');
  
  // Configuration
  const STICKY_BANNER_DELAY = 10000; // 10 seconds
  const SCROLL_THRESHOLD = 0.5; // 50% scroll
  const EXIT_INTENT_ENABLED = window.innerWidth > 768; // Desktop only
  
  // Track if modals have been shown
  let stickyBannerShown = localStorage.getItem('robspain_sticky_shown');
  let exitIntentShown = localStorage.getItem('robspain_exit_shown');
  
  // Don't show if already signed up
  if (hasSignedUp) return;
  
  // === STICKY BANNER ===
  function createStickyBanner() {
    const banner = document.createElement('div');
    banner.id = 'sticky-email-banner';
    banner.className = 'sticky-email-banner';
    banner.innerHTML = `
      <div class="sticky-banner-content">
        <div class="sticky-banner-text">
          <span class="sticky-banner-icon">🎓</span>
          <span class="sticky-banner-message">
            <strong>Get free BCBA resources</strong> — Enter your email
          </span>
        </div>
        <form class="sticky-banner-form" data-source="sticky-banner">
          <input 
            type="email" 
            name="email" 
            placeholder="your@email.com" 
            required
            class="sticky-banner-input"
          >
          <button type="submit" class="sticky-banner-button">Join</button>
        </form>
        <button class="sticky-banner-close" aria-label="Close banner">×</button>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Close button
    banner.querySelector('.sticky-banner-close').addEventListener('click', () => {
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 300);
    });
    
    // Form submission
    const form = banner.querySelector('.sticky-banner-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleEmailSubmit(form, 'sticky-banner');
    });
    
    // Show with animation
    setTimeout(() => banner.classList.add('visible'), 100);
  }
  
  function showStickyBanner() {
    if (stickyBannerShown || hasSignedUp) return;
    
    createStickyBanner();
    localStorage.setItem('robspain_sticky_shown', 'true');
    stickyBannerShown = true;
  }
  
  // === EXIT INTENT POPUP ===
  function createExitIntentPopup() {
    const popup = document.createElement('div');
    popup.id = 'exit-intent-popup';
    popup.className = 'exit-intent-overlay';
    popup.innerHTML = `
      <div class="exit-intent-modal">
        <button class="exit-intent-close" aria-label="Close popup">×</button>
        <div class="exit-intent-content">
          <div class="exit-intent-icon">📚</div>
          <h3 class="exit-intent-title">Before you go...</h3>
          <p class="exit-intent-description">
            Get free BCBA practice questions and study resources delivered to your inbox!
          </p>
          <form class="exit-intent-form" data-source="exit-intent">
            <input 
              type="email" 
              name="email" 
              placeholder="Enter your email" 
              required
              class="exit-intent-input"
            >
            <button type="submit" class="exit-intent-button">
              Get Free Resources
            </button>
          </form>
          <p class="exit-intent-privacy">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    // Close handlers
    const closeBtn = popup.querySelector('.exit-intent-close');
    closeBtn.addEventListener('click', () => closePopup(popup));
    
    popup.addEventListener('click', (e) => {
      if (e.target === popup) closePopup(popup);
    });
    
    // Form submission
    const form = popup.querySelector('.exit-intent-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleEmailSubmit(form, 'exit-intent', () => {
        setTimeout(() => closePopup(popup), 2000);
      });
    });
    
    // Show with animation
    setTimeout(() => popup.classList.add('visible'), 100);
  }
  
  function closePopup(popup) {
    popup.classList.remove('visible');
    setTimeout(() => popup.remove(), 300);
  }
  
  function showExitIntent() {
    if (exitIntentShown || hasSignedUp || !EXIT_INTENT_ENABLED) return;
    
    createExitIntentPopup();
    localStorage.setItem('robspain_exit_shown', 'true');
    exitIntentShown = true;
  }
  
  // === EMAIL SUBMISSION HANDLER ===
  async function handleEmailSubmit(form, source, onSuccess) {
    const button = form.querySelector('button[type="submit"]');
    const input = form.querySelector('input[name="email"]');
    const originalButtonText = button.textContent;
    
    button.disabled = true;
    button.textContent = 'Subscribing...';
    
    try {
      const response = await fetch('/.netlify/functions/collect-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.value,
          source: source
        })
      });
      
      const data = await response.json();
      
      if (response.ok || response.status === 409) {
        button.textContent = '✓ Subscribed!';
        button.style.backgroundColor = '#10b981';
        localStorage.setItem('robspain_email_signup', 'true');
        localStorage.setItem('robspain_email_signup_source', source);
        
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.error || 'Subscription failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      button.textContent = '✗ Error';
      button.style.backgroundColor = '#ef4444';
      setTimeout(() => {
        button.textContent = originalButtonText;
        button.style.backgroundColor = '';
      }, 3000);
    } finally {
      setTimeout(() => {
        button.disabled = false;
      }, 1000);
    }
  }
  
  // === TRIGGER LOGIC ===
  
  // Trigger sticky banner after delay OR scroll
  let scrollTriggered = false;
  
  setTimeout(() => {
    if (!scrollTriggered) showStickyBanner();
  }, STICKY_BANNER_DELAY);
  
  window.addEventListener('scroll', () => {
    if (scrollTriggered) return;
    
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    if (scrollPercent >= SCROLL_THRESHOLD) {
      scrollTriggered = true;
      showStickyBanner();
    }
  });
  
  // Exit intent detection (desktop only)
  if (EXIT_INTENT_ENABLED) {
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY <= 0) {
        showExitIntent();
      }
    });
  }
  
})();
