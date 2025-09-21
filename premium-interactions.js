// Premium Interactive Enhancements - $25k Professional Level

class PremiumInteractions {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupScrollAnimations();
        this.setupParallax();
        this.setupCounters();
        this.setupFormEnhancements();
        // Cursor animations disabled
        this.setupIntersectionObserver();
        this.setupSmoothScrolling();
    }

    // Premium Navigation with scroll effects
    setupNavigation() {
        const nav = document.querySelector('.nav-premium');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            // Add/remove scrolled class
            if (currentScrollY > 100) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            // Hide/show nav on scroll direction
            if (currentScrollY > lastScrollY && currentScrollY > 500) {
                nav.style.transform = 'translateY(-100%)';
            } else {
                nav.style.transform = 'translateY(0)';
            }

            lastScrollY = currentScrollY;
        });

        // Mobile menu toggle
        this.setupMobileMenu();
    }

    setupMobileMenu() {
        // Add mobile menu button if not exists
        const navContent = document.querySelector('.nav-content-premium');
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';

        // Only add if screen is mobile size
        if (window.innerWidth <= 768) {
            navContent.appendChild(mobileMenuBtn);
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768 && !document.querySelector('.mobile-menu-btn')) {
                navContent.appendChild(mobileMenuBtn);
            } else if (window.innerWidth > 768 && document.querySelector('.mobile-menu-btn')) {
                document.querySelector('.mobile-menu-btn').remove();
            }
        });
    }

    // Advanced scroll animations
    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.animate-fade-up, .animate-scale-up');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(el => {
            el.style.animationPlayState = 'paused';
            observer.observe(el);
        });
    }

    // Premium parallax effects
    setupParallax() {
        const parallaxElements = document.querySelectorAll('.floating-orb, .hero-grid-pattern');

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;

            parallaxElements.forEach((el, index) => {
                const speed = 0.5 + (index * 0.1);
                el.style.transform = `translateY(${scrollY * speed}px)`;
            });
        });
    }

    // Enhanced counter animations
    setupCounters() {
        const counters = document.querySelectorAll('[data-counter]');

        const animateCounter = (counter) => {
            const target = parseInt(counter.getAttribute('data-counter'));
            const duration = 2000;
            const steps = 60;
            const increment = target / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current).toLocaleString();
            }, duration / steps);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => observer.observe(counter));
    }

    // Premium form enhancements
    setupFormEnhancements() {
        const inputs = document.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            // Floating label effect
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });

            // Real-time validation styling
            input.addEventListener('input', () => {
                if (input.validity.valid) {
                    input.parentElement.classList.remove('error');
                    input.parentElement.classList.add('valid');
                } else {
                    input.parentElement.classList.remove('valid');
                    input.parentElement.classList.add('error');
                }
            });
        });

        // Form submission with loading state
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission(form);
            });
        });
    }

    handleFormSubmission(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Add loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        // Simulate form processing
        setTimeout(() => {
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Sent!';
            submitBtn.style.background = '#10b981';

            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
                form.reset();
            }, 2000);
        }, 1500);
    }

    // Cursor effects removed

    // Enhanced intersection observer for complex animations
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: [0, 0.25, 0.5, 0.75, 1],
            rootMargin: '-10% 0px -10% 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const ratio = entry.intersectionRatio;
                const element = entry.target;

                if (ratio > 0.25) {
                    element.style.opacity = ratio;
                    element.style.transform = `translateY(${(1 - ratio) * 50}px)`;
                }

                if (ratio > 0.75) {
                    element.classList.add('in-view');
                }
            });
        }, observerOptions);

        const elementsToObserve = document.querySelectorAll('.card-premium, .section-header-premium');
        elementsToObserve.forEach(el => observer.observe(el));
    }

    // Premium smooth scrolling
    setupSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    const headerOffset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// Initialize premium interactions
document.addEventListener('DOMContentLoaded', () => {
    new PremiumInteractions();
});

// Add premium styles to the document
const premiumStyles = `
    /* Custom cursor styles removed */

    .mobile-menu-btn {
        display: none;
        background: none;
        border: none;
        color: #374151;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 0.5rem;
        transition: all 0.3s ease;
    }

    .mobile-menu-btn:hover {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }

    @media (max-width: 768px) {
        .mobile-menu-btn {
            display: block;
        }

        .nav-links-premium {
            display: none;
        }
    }

    .in-view {
        animation: bounceIn 0.6s ease;
    }

    @keyframes bounceIn {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
    }

    .form-group.focused label {
        transform: translateY(-1.5rem) scale(0.8);
        color: #10b981;
    }

    .form-group.valid input {
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .form-group.error input {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
`;

// Inject premium styles
const styleSheet = document.createElement('style');
styleSheet.textContent = premiumStyles;
document.head.appendChild(styleSheet);
