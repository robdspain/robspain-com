// Premium Animation System - Senior Developer Grade
class PremiumAnimationSystem {
    constructor() {
        this.observers = new Map();
        this.animationFrameId = null;
        this.scrollListeners = [];
        this.resizeListeners = [];
        
        this.init();
    }

    init() {
        this.setupIntersectionObservers();
        this.setupScrollEffects();
        this.setupHoverEffects();
        this.setupTypewriter();
        this.setupCounters();
        this.setupParallax();
        this.setupMobileOptimizations();
        
        // Initialize after DOM is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.startAnimations();
            });
        } else {
            this.startAnimations();
        }
    }

    setupIntersectionObservers() {
        // Main content observer
        const mainObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    
                    // Handle special cases
                    this.handleSpecialAnimations(entry.target);
                    
                    // Unobserve after animation to improve performance
                    if (!entry.target.hasAttribute('data-keep-observing')) {
                        mainObserver.unobserve(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        this.observers.set('main', mainObserver);

        // Lazy loading observer for images
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        this.loadImageWithPlaceholder(img);
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        this.observers.set('images', imageObserver);
    }

    setupScrollEffects() {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateScrollEffects();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        this.scrollListeners.push(handleScroll);
    }

    updateScrollEffects() {
        const scrollY = window.pageYOffset;
        const windowHeight = window.innerHeight;

        // Navbar effects
        const navbar = document.querySelector('.nav-premium');
        if (navbar) {
            if (scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }

        // Parallax effects
        this.updateParallaxElements(scrollY, windowHeight);

        // Progress indicator
        this.updateProgressIndicator(scrollY);
    }

    updateParallaxElements(scrollY, windowHeight) {
        // Hero background orbs
        const orbs = document.querySelectorAll('.floating-orb');
        orbs.forEach((orb, index) => {
            const speed = 0.3 + (index * 0.1);
            const yPos = scrollY * speed;
            orb.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });

        // Grid pattern
        const gridPattern = document.querySelector('.hero-grid-pattern');
        if (gridPattern) {
            const yPos = scrollY * 0.2;
            gridPattern.style.transform = `translate3d(0, ${yPos}px, 0)`;
        }

        // Floating cards
        const floatingCards = document.querySelectorAll('.floating-card');
        floatingCards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            if (rect.top < windowHeight && rect.bottom > 0) {
                const speed = 0.1 + (index * 0.05);
                const yPos = scrollY * speed;
                card.style.transform = `translate3d(0, ${yPos}px, 0)`;
            }
        });
    }

    updateProgressIndicator(scrollY) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollY / docHeight) * 100;
        
        let progressBar = document.querySelector('.scroll-progress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'scroll-progress';
            progressBar.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 0%;
                height: 3px;
                background: linear-gradient(90deg, #059669, #10B981, #34D399);
                z-index: 10000;
                transition: width 0.1s ease-out;
            `;
            document.body.appendChild(progressBar);
        }
        
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    }

    setupHoverEffects() {
        // Premium card hover effects
        const cards = document.querySelectorAll('.card-premium');
        cards.forEach(card => {
            this.addHoverEffect(card, {
                scale: 1.02,
                translateY: -8,
                shadowIntensity: 1.5
            });
        });

        // Button hover effects
        const buttons = document.querySelectorAll('.btn-primary-premium, .btn-secondary-premium');
        buttons.forEach(button => {
            this.addButtonHoverEffect(button);
        });

        // Navigation link effects
        const navLinks = document.querySelectorAll('.nav-link-premium');
        navLinks.forEach(link => {
            this.addNavLinkEffect(link);
        });
    }

    addHoverEffect(element, options = {}) {
        const defaultOptions = {
            scale: 1,
            translateY: 0,
            shadowIntensity: 1
        };

        const config = { ...defaultOptions, ...options };

        element.addEventListener('mouseenter', () => {
            element.style.transform = `scale(${config.scale}) translateY(${config.translateY}px)`;
            element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            if (config.shadowIntensity > 1) {
                element.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
            }
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'scale(1) translateY(0px)';
            element.style.boxShadow = '';
        });
    }

    addButtonHoverEffect(button) {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-3px) scale(1.02)';
            button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // Add ripple effect
            this.createRippleEffect(button);
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
        });

        button.addEventListener('click', (e) => {
            this.createClickEffect(button, e);
        });
    }

    createRippleEffect(element) {
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-effect 0.6s linear;
            pointer-events: none;
        `;

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (rect.width / 2 - size / 2) + 'px';
        ripple.style.top = (rect.height / 2 - size / 2) + 'px';

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    createClickEffect(element, event) {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickEffect = document.createElement('span');
        clickEffect.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.8);
            transform: translate(-50%, -50%);
            animation: click-effect 0.4s ease-out;
            pointer-events: none;
        `;

        element.appendChild(clickEffect);

        setTimeout(() => {
            clickEffect.remove();
        }, 400);
    }

    addNavLinkEffect(link) {
        const underline = document.createElement('span');
        underline.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0;
            height: 2px;
            background: linear-gradient(90deg, #059669, #10B981);
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        link.style.position = 'relative';
        link.appendChild(underline);

        link.addEventListener('mouseenter', () => {
            underline.style.width = '100%';
        });

        link.addEventListener('mouseleave', () => {
            underline.style.width = '0';
        });
    }

    setupTypewriter() {
        const typewriterElements = document.querySelectorAll('[data-typewriter]');
        
        typewriterElements.forEach(element => {
            const text = element.textContent;
            const speed = parseInt(element.dataset.typewriterSpeed) || 100;
            const delay = parseInt(element.dataset.typewriterDelay) || 0;

            element.textContent = '';

            setTimeout(() => {
                this.typeWriter(element, text, speed);
            }, delay);
        });
    }

    typeWriter(element, text, speed) {
        let i = 0;
        const timer = setInterval(() => {
            element.textContent += text.charAt(i);
            i++;
            if (i >= text.length) {
                clearInterval(timer);
                element.classList.add('typewriter-complete');
            }
        }, speed);
    }

    setupCounters() {
        const counters = document.querySelectorAll('[data-counter]');
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.dataset.counter);
        const duration = parseInt(element.dataset.counterDuration) || 2000;
        const startValue = 0;
        
        const increment = target / (duration / 16);
        let current = startValue;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            element.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }

    setupParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || 0.5;
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        element.dataset.parallaxActive = 'true';
                    } else {
                        element.dataset.parallaxActive = 'false';
                    }
                });
            });
            
            observer.observe(element);
        });
    }

    handleSpecialAnimations(element) {
        // Stagger animations for child elements
        if (element.hasAttribute('data-stagger-children')) {
            const children = element.children;
            Array.from(children).forEach((child, index) => {
                const delay = index * 100;
                setTimeout(() => {
                    child.classList.add('in-view');
                }, delay);
            });
        }

        // Reveal animations for text elements
        if (element.hasAttribute('data-reveal-text')) {
            this.revealText(element);
        }

        // Scale up animations for images
        if (element.tagName === 'IMG' || element.hasAttribute('data-scale-reveal')) {
            element.style.transform = 'scale(0.8)';
            element.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 100);
        }
    }

    revealText(element) {
        const text = element.textContent;
        const words = text.split(' ');
        
        element.innerHTML = words.map((word, index) => 
            `<span class="word-reveal" style="animation-delay: ${index * 100}ms">${word}</span>`
        ).join(' ');
    }

    loadImageWithPlaceholder(img) {
        // Create placeholder
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: inherit;
        `;

        img.style.opacity = '0';
        img.parentNode.insertBefore(placeholder, img);

        // Load actual image
        const actualImg = new Image();
        actualImg.onload = () => {
            img.src = img.dataset.src;
            img.style.transition = 'opacity 0.5s ease';
            img.style.opacity = '1';
            
            setTimeout(() => {
                placeholder.remove();
            }, 500);
        };
        
        actualImg.src = img.dataset.src;
    }

    setupMobileOptimizations() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Reduce animations on mobile for performance
            document.body.classList.add('mobile-device');
            
            // Disable some complex animations
            const complexAnimations = document.querySelectorAll('.floating-orb');
            complexAnimations.forEach(element => {
                element.style.animation = 'none';
            });
        }
    }

    startAnimations() {
        // Observe all animated elements
        const mainObserver = this.observers.get('main');
        const imageObserver = this.observers.get('images');

        // Elements to animate
        const animatedElements = document.querySelectorAll(`
            .animate-fade-up,
            .animate-fade-left,
            .animate-fade-right,
            .animate-scale-up,
            [data-animate]
        `);

        animatedElements.forEach(element => {
            mainObserver.observe(element);
        });

        // Images to lazy load
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });

        // Add entrance animations to hero elements
        setTimeout(() => {
            const heroElements = document.querySelectorAll('.hero-content-premium > *');
            heroElements.forEach((element, index) => {
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 200);
            });
        }, 300);
    }

    destroy() {
        // Clean up observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        // Remove event listeners
        this.scrollListeners.forEach(listener => {
            window.removeEventListener('scroll', listener);
        });

        this.resizeListeners.forEach(listener => {
            window.removeEventListener('resize', listener);
        });

        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

// CSS animations
const animationStyles = `
@keyframes ripple-effect {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

@keyframes click-effect {
    to {
        width: 50px;
        height: 50px;
        opacity: 0;
    }
}

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

@keyframes word-reveal {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.word-reveal {
    display: inline-block;
    animation: word-reveal 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    opacity: 0;
}

.mobile-device .floating-orb {
    animation: none !important;
    transform: none !important;
}

.mobile-device [data-parallax] {
    transform: none !important;
}

/* Smooth entrance for hero content */
.hero-content-premium > * {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading states */
.loading-shimmer {
    overflow: hidden;
    position: relative;
}

.loading-shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shimmer 1.5s infinite;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Initialize the animation system
let premiumAnimations;
document.addEventListener('DOMContentLoaded', () => {
    premiumAnimations = new PremiumAnimationSystem();
});

// Performance monitoring
if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('🚀 Premium Site Performance:', {
            'Load Time': Math.round(perfData.loadEventEnd - perfData.loadEventStart) + 'ms',
            'DOM Ready': Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart) + 'ms',
            'First Paint': Math.round(performance.getEntriesByType('paint')[0]?.startTime) + 'ms'
        });
    });
}