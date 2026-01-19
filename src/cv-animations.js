// Modern CV Animations using vanilla JS (Framer Motion alternative)
document.addEventListener('DOMContentLoaded', function() {
    // Set last updated date if present (footer no longer shows it)
    var last = document.getElementById('last-updated');
    if (last) last.textContent = new Date().toLocaleDateString();

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Special handling for stats counter
                if (entry.target.classList.contains('stat-number')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);

    // Add animation classes to elements
    function initializeAnimations() {
        // Hero elements - use existing animate-fade-up classes
        const heroElements = document.querySelectorAll('.profile-image, .profile-info .animate-fade-up');
        heroElements.forEach((el) => {
            observer.observe(el);
        });

        // Sections
        document.querySelectorAll('.section-title').forEach(el => {
            el.classList.add('slide-in-left');
            observer.observe(el);
        });

        // Cards and content
        document.querySelectorAll('.cert-card, .experience-card, .skill-category, .contact-card').forEach((el, index) => {
            el.classList.add('fade-in');
            el.style.transitionDelay = `${(index % 3) * 0.1}s`;
            observer.observe(el);
        });

        // Skill bars
        document.querySelectorAll('.skill-fill').forEach(el => {
            observer.observe(el);
        });

        // Timeline items
        document.querySelectorAll('.timeline-item').forEach((el, index) => {
            el.classList.add('slide-in-right');
            el.style.transitionDelay = `${index * 0.2}s`;
            observer.observe(el);
        });

        // Recommendation
        const recommendation = document.querySelector('.recommendation-card');
        if (recommendation) {
            recommendation.classList.add('scale-in');
            observer.observe(recommendation);
        }
    }

    // Counter animation for stats
    function animateCounter(element) {
        const target = element.textContent.replace(/[^0-9]/g, '');
        const number = parseInt(target);
        
        if (isNaN(number)) return;
        
        const duration = 2000;
        const steps = 60;
        const increment = number / steps;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= number) {
                current = number;
                clearInterval(timer);
            }
            
            element.textContent = element.textContent.replace(/\d+/, Math.floor(current).toString());
        }, duration / steps);
    }

    // Smooth scrolling for navigation
    function initSmoothScrolling() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerOffset = 100;
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

    // Active navigation highlighting
    function initActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 150;
                const sectionHeight = section.clientHeight;
                if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    // Navbar background on scroll
    function initNavbarScroll() {
        const navbar = document.querySelector('.cv-nav');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'none';
            }
        });
    }

    // Parallax effect for hero background orbs
    function initParallaxEffect() {
        const orbs = document.querySelectorAll('.gradient-orb');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            orbs.forEach((orb, index) => {
                const speed = 0.2 + (index * 0.1);
                orb.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    // Hover effects for cards
    function initHoverEffects() {
        const cards = document.querySelectorAll('.cert-card, .experience-card, .contact-card, .skill-category');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-12px) scale(1.02)';
                this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    // Typing animation for profile name
    function initTypingAnimation() {
        const nameElement = document.querySelector('.name-line');
        const credentialsElement = document.querySelector('.credentials-line');
        
        if (nameElement && credentialsElement) {
            const nameText = nameElement.textContent;
            const credentialsText = credentialsElement.textContent;
            
            nameElement.textContent = '';
            credentialsElement.textContent = '';
            
            // Type name first
            setTimeout(() => {
                typeWriter(nameElement, nameText, 100, () => {
                    // Then type credentials
                    setTimeout(() => {
                        typeWriter(credentialsElement, credentialsText, 150);
                    }, 500);
                });
            }, 1000);
        }
    }

    function typeWriter(element, text, speed, callback) {
        let i = 0;
        const timer = setInterval(() => {
            element.textContent += text.charAt(i);
            i++;
            if (i >= text.length) {
                clearInterval(timer);
                if (callback) callback();
            }
        }, speed);
    }

    // Download CV functionality
    function initDownloadFeature() {
        const downloadBtn = document.querySelector('.download-btn');
        
        downloadBtn.addEventListener('click', () => {
            // Create a temporary loading state
            const originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
            downloadBtn.style.pointerEvents = 'none';
            
            setTimeout(() => {
                // Reset button
                downloadBtn.innerHTML = originalText;
                downloadBtn.style.pointerEvents = 'auto';
                
                // Show download message
                showNotification('CV download feature coming soon! For now, please use your browser\'s print function.');
            }, 2000);
        });
    }

    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;
        
        // Styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            zIndex: '10000',
            maxWidth: '400px',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // Lazy loading for images
    function initLazyLoading() {
        const images = document.querySelectorAll('img[src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Add loading shimmer
                    img.parentElement.classList.add('loading-shimmer');
                    
                    img.addEventListener('load', () => {
                        img.parentElement.classList.remove('loading-shimmer');
                        img.style.opacity = '1';
                    });
                    
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
            imageObserver.observe(img);
        });
    }

    // Performance optimization: Throttle scroll events
    function throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize all features
    initializeAnimations();
    initSmoothScrolling();
    initActiveNavigation();
    initNavbarScroll();
    initParallaxEffect();
    initHoverEffects();
    // initTypingAnimation(); // Disabled for Pro Max stability
    initDownloadFeature();
    initLazyLoading();

    // Add loading complete class
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 500);

    // Console easter egg
    console.log(`
    🎯 Rob Spain's Interactive CV
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Built with modern web technologies
    Featuring smooth animations & interactions
    
    Interested in working together?
    Contact: rob@behaviorschool.com
    `);
});

// CSS-in-JS for notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-content i {
        color: #10B981;
        font-size: 1.25rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #64748b;
        padding: 0;
        margin-left: auto;
    }
    
    .notification-close:hover {
        color: #1f2937;
    }
`;
document.head.appendChild(notificationStyles);
