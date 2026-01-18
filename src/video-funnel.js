/**
 * Video Funnel Interactive Logic
 * Handles progress tracking, video switching, and gating states.
 */

class VideoFunnel {
    constructor() {
        this.currentStep = 1;
        this.unlockedUntil = 3; // Initial free videos (1-3)
        this.isGated = true; // Gate is active at step 4
        this.steps = [
            { id: 1, title: "The Reactivity Trap" },
            { id: 2, title: "The Myth of Individual Support" },
            { id: 3, title: "University-Validated Shifts" },
            { id: 4, title: "The 10-Minute Staff Hack" },
            { id: 5, title: "The 5-Pillar System" },
            { id: 6, title: "Automation for BCBAs" },
            { id: 7, title: "The 'No Time' Fallacy" },
            { id: 8, title: "From Chaos to Confidence" },
            { id: 9, title: "The 8-Week Transformation" },
            { id: 10, title: "Final Choice" }
        ];

        this.init();
    }

    init() {
        // Check local storage for previous unlock
        if (localStorage.getItem('videoFunnelUnlocked') === 'true') {
            this.unlockedUntil = 10;
            this.isGated = false;
        }

        this.renderGrid();
        this.setupEventListeners();
        this.updateProgress();
    }

    renderGrid() {
        const grid = document.querySelector('.video-bento-grid');
        if (!grid) return;

        grid.innerHTML = this.steps.map(step => {
            const isLocked = step.id > this.unlockedUntil;
            const isGateKeeper = isLocked && step.id === 4 && this.isGated;
            const lockedClass = isLocked ? 'locked' : '';
            const gateClass = isGateKeeper ? 'gate-keeper' : '';
            const activeClass = step.id === this.currentStep ? 'active' : '';

            return `
            <div class="video-step-card ${lockedClass} ${gateClass} ${activeClass}" 
                 data-id="${step.id}">
                <div class="step-number">STEP ${step.id < 10 ? '0' + step.id : step.id}</div>
                <div class="step-title">${step.title}</div>
                ${isLocked ? '<div class="lock-badge"><i class="fas fa-lock"></i></div>' : ''}
            </div>
        `}).join('');
    }

    setupEventListeners() {
        const grid = document.querySelector('.video-bento-grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const card = e.target.closest('.video-step-card');
                if (!card) return;

                // Allow click if not locked OR if it is the gate keeper (step 4)
                if (card.classList.contains('locked') && !card.classList.contains('gate-keeper')) return;

                const id = parseInt(card.dataset.id);
                this.switchVideo(id);
            });
        }
    }

    switchVideo(id) {
        this.currentStep = id;
        
        // Update Grid UI
        document.querySelectorAll('.video-step-card').forEach(card => {
            card.classList.remove('active');
            if (parseInt(card.dataset.id) === id) card.classList.add('active');
        });

        // Update Title
        const activeTitle = document.querySelector('.active-video-title');
        if (activeTitle) activeTitle.textContent = this.steps.find(s => s.id === id).title;

        // Handle Content Display
        const container = document.querySelector('.video-placeholder-overlay');
        if (!container) return;

        // Clear container
        container.innerHTML = '';

        if (id === 4 && this.isGated) {
            // Show Opt-in Form
            container.innerHTML = `
                <div class="optin-overlay animate-fade-up">
                    <h3 class="optin-title">Unlock The Full Series</h3>
                    <p style="margin-bottom: 1.5rem; color: #cbd5e1;">Enter your email to unlock the "10-Minute Staff Reset Script" and the remaining 6 videos.</p>
                    <form class="optin-form" id="funnel-optin-form">
                        <input type="email" class="optin-input" placeholder="Your Best Email Address" required>
                        <button type="submit" class="optin-btn">Unlock Now <i class="fas fa-unlock"></i></button>
                    </form>
                </div>
            `;

            // Attach submit listener dynamically
            document.getElementById('funnel-optin-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const email = e.target.querySelector('input').value;
                if(email) {
                    this.handleOptIn(email);
                }
            });

        } else {
            // Show Video Placeholder (or standard play button)
            container.innerHTML = `
                <div class="play-btn-large">
                    <i class="fas fa-play"></i>
                </div>
                <h3 class="active-video-title">${this.steps.find(s => s.id === id).title}</h3>
                <p style="color: #94a3b8; margin-top: 1rem;">Video Player Placeholder</p>
            `;
        }
    }

    handleOptIn(email) {
        // Simulate API call / Email capture
        console.log("Opt-in captured:", email);
        
        // Save state
        localStorage.setItem('videoFunnelUnlocked', 'true');
        
        // Unlock
        this.unlockRest();
    }

    updateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-percentage');
        if (!progressFill) return;

        const percentage = (this.unlockedUntil / this.steps.length) * 100;
        progressFill.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `${Math.round(percentage)}% UNLOCKED`;
    }

    unlockRest() {
        this.unlockedUntil = 10;
        this.isGated = false;
        this.renderGrid();
        this.updateProgress();
        
        // Automatically switch to the now-unlocked video 4 view (remove form)
        this.switchVideo(4);
    }
}

// Initialize when section becomes visible
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.video-funnel-section')) {
        window.videoFunnel = new VideoFunnel();
    }
});