/**
 * Video Funnel Interactive Logic
 * Handles progress tracking, single video switching, and gating states.
 */

class VideoFunnel {
    constructor() {
        // Initialize steps from global data or fallback to defaults
        this.steps = window.videoFunnelData && window.videoFunnelData.length > 0 
            ? window.videoFunnelData 
            : [
                { id: 1, title: "The Reactivity Trap" },
                { id: 2, title: "The Myth of Individual Support" },
                { id: 3, title: "University-Validated Shifts" },
                { id: 4, title: "The 10-Minute Staff Hack" }
            ];

        this.currentIndex = 0;
        this.unlockedUntil = 3; // Initial free videos (1-3)
        this.isGated = true; // Gate is active at step 4
        
        this.init();
    }

    init() {
        // Check local storage for previous unlock
        if (localStorage.getItem('videoFunnelUnlocked') === 'true') {
            this.unlockedUntil = this.steps.length;
            this.isGated = false;
        }

        this.renderCurrentStep();
        this.setupEventListeners();
        this.updateProgress();
    }

    renderCurrentStep() {
        const step = this.steps[this.currentIndex];
        if (!step) return;

        const isLocked = step.id > this.unlockedUntil;
        const isGateKeeper = isLocked && step.id === 4 && this.isGated;

        // Update titles
        const activeTitle = document.querySelector('.active-video-title');
        const currentStepTitle = document.querySelector('.current-step-title');
        const stepLabel = document.querySelector('.step-label');
        
        if (activeTitle) activeTitle.textContent = step.title;
        if (currentStepTitle) currentStepTitle.textContent = step.title;
        if (stepLabel) stepLabel.textContent = `STEP ${step.id < 10 ? '0' + step.id : step.id}`;

        // Handle Content Display
        const container = document.querySelector('.video-placeholder-overlay');
        if (!container) return;

        container.innerHTML = '';

        if (isGateKeeper) {
            container.innerHTML = `
                <div class="optin-overlay animate-fade-up">
                    <h3 class="optin-title">Unlock The Full Series</h3>
                    <p style="margin-bottom: 1.5rem; color: #cbd5e1;">Enter your email to unlock the "10-Minute Staff Reset Script" and the remaining videos.</p>
                    <form class="optin-form" id="funnel-optin-form">
                        <input type="email" class="optin-input" placeholder="Your Best Email Address" required>
                        <button type="submit" class="optin-btn">Unlock Now <i class="fas fa-unlock"></i></button>
                    </form>
                </div>
            `;

            document.getElementById('funnel-optin-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const email = e.target.querySelector('input').value;
                if(email) this.handleOptIn(email);
            });
        } else {
            container.innerHTML = `
                <div class="play-btn-large">
                    <i class="fas fa-play"></i>
                </div>
                <h3 class="active-video-title">${step.title}</h3>
                <p style="color: #94a3b8; margin-top: 1rem;">Click to Play Video</p>
            `;
        }

        // Update Next Button State
        const nextBtn = document.getElementById('next-video');
        if (nextBtn) {
            if (this.currentIndex >= this.steps.length - 1) {
                nextBtn.innerHTML = '<span>Finish Series</span> <i class="fas fa-check"></i>';
            } else {
                nextBtn.innerHTML = '<span>Next Video</span> <i class="fas fa-arrow-right"></i>';
            }
            
            // Disable if next is locked and we haven't unlocked yet
            const nextStep = this.steps[this.currentIndex + 1];
            if (nextStep && nextStep.id > this.unlockedUntil && !(nextStep.id === 4 && this.isGated)) {
                nextBtn.style.opacity = '0.5';
                nextBtn.style.pointerEvents = 'none';
            } else {
                nextBtn.style.opacity = '1';
                nextBtn.style.pointerEvents = 'auto';
            }
        }
    }

    setupEventListeners() {
        const nextBtn = document.getElementById('next-video');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentIndex < this.steps.length - 1) {
                    this.currentIndex++;
                    this.renderCurrentStep();
                    window.scrollTo({
                        top: document.getElementById('free-training').offsetTop - 100,
                        behavior: 'smooth'
                    });
                } else {
                    // Final CTA or restart
                    alert("Congratulations on completing the series!");
                }
            });
        }

        // Allow clicking the placeholder to "play"
        const container = document.querySelector('.video-placeholder-overlay');
        if (container) {
            container.addEventListener('click', (e) => {
                if (e.target.closest('.optin-overlay')) return;
                
                // Show the script content as if it were the video
                container.innerHTML = `
                    <div class="script-content-view animate-fade-up" style="text-align: left; padding: 2rem; overflow-y: auto; max-height: 100%; width: 100%; background: #0f172a;">
                        <div style="max-width: 600px; margin: 0 auto;">
                            ${step.content}
                        </div>
                    </div>
                `;
                container.style.cursor = 'default';
                container.style.background = '#0f172a';
            });
        }
    }

    handleOptIn(email) {
        console.log("Opt-in captured:", email);
        localStorage.setItem('videoFunnelUnlocked', 'true');
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
        this.unlockedUntil = this.steps.length;
        this.isGated = false;
        this.renderCurrentStep();
        this.updateProgress();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.video-funnel-section')) {
        window.videoFunnel = new VideoFunnel();
    }
});
