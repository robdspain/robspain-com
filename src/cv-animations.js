// CV Animations — Clean, performant scroll animations
document.addEventListener('DOMContentLoaded', function () {
    // Intersection Observer for scroll-triggered animations
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Unobserve after animating (perf)
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    // Observe hero elements
    document.querySelectorAll(
        '.animate-fade-up, .animate-scale-up'
    ).forEach((el) => observer.observe(el));

    // Observe section titles
    document.querySelectorAll('.section-header-block').forEach((el) => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // Observe cards with staggered delays
    document.querySelectorAll(
        '.cert-card, .experience-card, .skill-category, .contact-card, .leadership-card, .presentation-card, .education-card'
    ).forEach((el, i) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${(i % 4) * 0.08}s`;
        observer.observe(el);
    });

    // Timeline items
    document.querySelectorAll('.timeline-item').forEach((el, i) => {
        el.classList.add('slide-in-right');
        el.style.transitionDelay = `${i * 0.1}s`;
        observer.observe(el);
    });

    // Parallax orbs on scroll (throttled via rAF)
    let ticking = false;
    const orbs = document.querySelectorAll('.gradient-orb');

    function updateParallax() {
        const y = window.pageYOffset;
        orbs.forEach((orb, i) => {
            const speed = 0.15 + i * 0.08;
            orb.style.transform = `translateY(${y * speed}px)`;
        });
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    });

    // Body loaded class
    requestAnimationFrame(() => document.body.classList.add('loaded'));
});
