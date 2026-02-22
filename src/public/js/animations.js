/* ========================================
   PREMIUM ANIMATION CONTROLLER
   Handles scroll-triggered animations using IntersectionObserver
======================================== */

class AnimationController {
    constructor() {
        this.observers = new Map();
        this.counters = new Map();
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.setupScrollAnimations();
        this.setupNumberCounters();
        this.setupParallax();
    }

    /* ========================================
       SCROLL-TRIGGERED ANIMATIONS
    ======================================== */
    setupScrollAnimations() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        
                        // Unobserve after animation for performance
                        if (!entry.target.hasAttribute('data-repeat-animation')) {
                            observer.unobserve(entry.target);
                        }
                    } else if (entry.target.hasAttribute('data-repeat-animation')) {
                        entry.target.classList.remove('visible');
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        // Observe all animation elements
        const animatedElements = document.querySelectorAll(
            '.fade-in-up, .fade-in-left, .fade-in-right, .fade-in, .scale-in, .border-draw'
        );
        
        animatedElements.forEach(el => observer.observe(el));
        
        this.observers.set('scroll', observer);
    }

    /* ========================================
       NUMBER COUNTER ANIMATION
    ======================================== */
    setupNumberCounters() {
        const counters = document.querySelectorAll('.number-counter');
        
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.counters.has(entry.target)) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        counters.forEach(counter => observer.observe(counter));
        this.observers.set('counter', observer);
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target') || element.textContent.replace(/[^0-9]/g, ''));
        const duration = parseInt(element.getAttribute('data-duration') || '2000');
        const prefix = element.getAttribute('data-prefix') || '';
        const suffix = element.getAttribute('data-suffix') || '';
        
        if (isNaN(target)) return;

        this.counters.set(element, true);
        element.classList.add('counting');
        
        const startTime = performance.now();
        const startValue = 0;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startValue + (target - startValue) * easeOut);
            
            // Conditional formatting: don't use locale string for years.
            const formattedCurrent = target < 10000 ? current.toString() : current.toLocaleString();
            element.textContent = prefix + formattedCurrent + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.classList.remove('counting');
                const formattedTarget = target < 10000 ? target.toString() : target.toLocaleString();
                element.textContent = prefix + formattedTarget + suffix;
            }
        };

        requestAnimationFrame(animate);
    }

    /* ========================================
       PARALLAX EFFECTS
    ======================================== */
    setupParallax() {
        const parallaxElements = document.querySelectorAll(
            '.parallax-slow, .parallax-medium, .parallax-fast'
        );
        
        if (parallaxElements.length === 0) return;

        // Use throttled scroll for performance
        let ticking = false;
        
        const updateParallax = () => {
            parallaxElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const scrolled = window.pageYOffset;
                const rate = el.classList.contains('parallax-slow') ? 0.5 :
                            el.classList.contains('parallax-medium') ? 0.3 :
                            0.15;
                
                // Only apply parallax to elements in viewport
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const yPos = -(scrolled * rate);
                    el.style.transform = `translateY(${yPos}px)`;
                }
            });
            
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        // Only add parallax on non-mobile devices
        if (window.innerWidth > 768) {
            window.addEventListener('scroll', onScroll, { passive: true });
        }
    }

    /* ========================================
       UTILITY: Refresh Observers
    ======================================== */
    refresh() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.counters.clear();
        this.setup();
    }

    /* ========================================
       UTILITY: Destroy
    ======================================== */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.counters.clear();
    }
}

// Initialize on page load
const animationController = new AnimationController();

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationController;
}
