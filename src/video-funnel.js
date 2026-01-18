/**
 * Video Funnel Interactive Logic
 * Handles progress tracking, video switching, and gating states.
 */

class VideoFunnel {
    constructor() {
        this.currentStep = 1;
        this.unlockedUntil = 3; // Initial free videos (1-3)
        this.isGated = true;
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
        this.renderGrid();
        this.setupEventListeners();
        this.updateProgress();
    }

    renderGrid() {
        const grid = document.querySelector('.video-bento-grid');
        if (!grid) return;

        grid.innerHTML = this.steps.map(step => `
            <div class="video-step-card ${step.id > this.unlockedUntil ? 'locked' : ''} ${step.id === this.currentStep ? 'active' : ''}" 
                 data-id="${step.id}">
                <div class="step-number">STEP ${step.id < 10 ? '0' + step.id : step.id}</div>
                <div class="step-title">${step.title}</div>
                ${step.id > this.unlockedUntil ? '<div class="lock-badge"><i class="fas fa-lock"></i></div>' : ''}
            </div>
        `).join('');
    }

    setupEventListeners() {
        document.querySelector('.video-bento-grid')?.addEventListener('click', (e) => {
            const card = e.target.closest('.video-step-card');
            if (!card || card.classList.contains('locked')) return;

            const id = parseInt(card.dataset.id);
            this.switchVideo(id);
        });

        // Listen for "Watch Complete" (Simulated)
        // In real implementation, listen to Wistia/Vimeo API
    }

    switchVideo(id) {
        this.currentStep = id;
        
        // Update UI
        document.querySelectorAll('.video-step-card').forEach(card => {
            card.classList.remove('active');
            if (parseInt(card.dataset.id) === id) card.classList.add('active');
        });

        // Update main player title/placeholder
        const activeTitle = document.querySelector('.active-video-title');
        if (activeTitle) activeTitle.textContent = this.steps.find(s => s.id === id).title;

        // Special logic for Video 4 (Opt-in)
        if (id === 4 && this.isGated) {
            // Show opt-in form inside video player container
        }
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
    }
}

// Initialize when section becomes visible
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.video-funnel-section')) {
        window.videoFunnel = new VideoFunnel();
    }
});
