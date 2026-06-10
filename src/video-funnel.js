/**
 * Video Funnel Interactive Logic
 * Handles progress tracking, single video switching, and gating states.
 */

class VideoFunnel {
    constructor() {
        this.steps = window.videoFunnelData && window.videoFunnelData.length > 0
            ? window.videoFunnelData
            : [
                { id: 1, title: "The Reactivity Trap" },
                { id: 2, title: "The Myth of Individual Support" },
                { id: 3, title: "University-Validated Shifts" },
                { id: 4, title: "The 10-Minute Staff Hack" }
            ];

        this.currentIndex = 0;
        this.isAdminPreview = Boolean(document.querySelector('.admin-preview-header'));
        this.unlockedUntil = this.isAdminPreview ? this.steps.length : 3;
        this.isGated = !this.isAdminPreview;

        this.init();
    }

    init() {
        if (!this.isAdminPreview && localStorage.getItem('videoFunnelUnlocked') === 'true') {
            this.unlockedUntil = this.steps.length;
            this.isGated = false;
        }

        this.renderCurrentStep();
        this.renderStepGrid();
        this.setupEventListeners();
        this.updateProgress();
    }

    escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    getStepNumber(step) {
        return Number(step.id || 0);
    }

    getStepLabel(step) {
        const number = this.getStepNumber(step);
        return `STEP ${number < 10 ? '0' + number : number}`;
    }

    hasVideoSource(step) {
        return Boolean(step && (step.youtubeId || step.videoUrl || step.bunnyVideoId));
    }

    getVideoEmbed(step) {
        if (step.youtubeId) {
            const videoId = encodeURIComponent(step.youtubeId);
            return `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0" title="${this.escapeHtml(step.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
        }

        if (step.bunnyVideoId) {
            const libraryId = encodeURIComponent(step.bunnyLibraryId || '394122');
            const videoId = encodeURIComponent(step.bunnyVideoId);
            return `<iframe src="https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&preload=true" title="${this.escapeHtml(step.title)}" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
        }

        if (step.videoUrl) {
            return `<video controls autoplay playsinline src="${this.escapeHtml(step.videoUrl)}"></video>`;
        }

        return '';
    }

    getScriptPreview(step) {
        return `
            <div class="script-content-view animate-fade-up">
                <div class="script-preview-inner">
                    <p class="script-preview-note">Script preview. Add a YouTube, Bunny, or video URL to this step to preview the recorded video here.</p>
                    ${step.content || '<p>No script content available for this step.</p>'}
                </div>
            </div>
        `;
    }

    renderStepGrid() {
        const grid = document.querySelector('.video-bento-grid');
        if (!grid) return;

        grid.style.display = '';
        grid.innerHTML = this.steps.map((step, index) => {
            const isActive = index === this.currentIndex;
            const isLocked = this.getStepNumber(step) > this.unlockedUntil;
            const videoStatus = this.hasVideoSource(step) ? 'Video attached' : 'Script preview';

            return `
                <button class="video-step-card${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}" type="button" data-index="${index}" ${isLocked ? 'aria-disabled="true"' : ''}>
                    <span class="video-step-number">${this.getStepLabel(step)}</span>
                    <span class="video-step-title">${this.escapeHtml(step.title)}</span>
                    <span class="video-step-status">${isLocked ? 'Locked' : videoStatus}</span>
                </button>
            `;
        }).join('');
    }

    renderCurrentStep() {
        const step = this.steps[this.currentIndex];
        if (!step) return;

        const stepNumber = this.getStepNumber(step);
        const isLocked = stepNumber > this.unlockedUntil;
        const isGateKeeper = isLocked && stepNumber === 4 && this.isGated;

        const activeTitle = document.querySelector('.active-video-title');
        const currentStepTitle = document.querySelector('.current-step-title');
        const stepLabel = document.querySelector('.step-label');

        if (activeTitle) activeTitle.textContent = step.title;
        if (currentStepTitle) currentStepTitle.textContent = step.title;
        if (stepLabel) stepLabel.textContent = this.getStepLabel(step);

        const container = document.querySelector('.video-placeholder-overlay');
        if (!container) return;

        container.style.cursor = 'pointer';
        container.style.background = '';
        container.setAttribute('role', 'button');
        container.setAttribute('tabindex', '0');

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
                if (email) this.handleOptIn(email);
            });
        } else {
            const promptText = this.hasVideoSource(step) ? 'Click to Play Video' : 'Open Script Preview';
            container.innerHTML = `
                <div class="play-btn-large">
                    <i class="fas fa-play"></i>
                </div>
                <h3 class="active-video-title">${this.escapeHtml(step.title)}</h3>
                <p style="color: #94a3b8; margin-top: 1rem;">${promptText}</p>
            `;
        }

        const nextBtn = document.getElementById('next-video');
        if (nextBtn) {
            if (this.currentIndex >= this.steps.length - 1) {
                nextBtn.innerHTML = '<span>Finish Series</span> <i class="fas fa-check"></i>';
            } else {
                nextBtn.innerHTML = '<span>Next Video</span> <i class="fas fa-arrow-right"></i>';
            }

            const nextStep = this.steps[this.currentIndex + 1];
            const nextStepNumber = nextStep ? this.getStepNumber(nextStep) : 0;
            if (nextStep && nextStepNumber > this.unlockedUntil && !(nextStepNumber === 4 && this.isGated)) {
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
                    this.renderStepGrid();
                    window.scrollTo({
                        top: document.getElementById('free-training').offsetTop - 100,
                        behavior: 'smooth'
                    });
                } else {
                    alert("Congratulations on completing the series!");
                }
            });
        }

        document.addEventListener('click', (e) => {
            const card = e.target.closest('.video-step-card');
            if (!card) return;

            const nextIndex = Number(card.dataset.index);
            const step = this.steps[nextIndex];
            if (!step || this.getStepNumber(step) > this.unlockedUntil) return;

            this.currentIndex = nextIndex;
            this.renderCurrentStep();
            this.renderStepGrid();
            document.getElementById('free-training')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        const container = document.querySelector('.video-placeholder-overlay');
        if (container) {
            const playHandler = (e) => {
                if (e.target.closest('.optin-overlay')) return;
                this.playCurrentStep();
            };

            container.addEventListener('click', playHandler);
            container.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                playHandler(e);
            });
        }
    }

    playCurrentStep() {
        const step = this.steps[this.currentIndex];
        const container = document.querySelector('.video-placeholder-overlay');
        if (!step || !container) return;

        if (this.getStepNumber(step) > this.unlockedUntil) return;

        const embed = this.getVideoEmbed(step);
        container.innerHTML = embed || this.getScriptPreview(step);
        container.style.cursor = 'default';
        container.style.background = '#0f172a';
        container.removeAttribute('role');
        container.removeAttribute('tabindex');
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
        this.renderStepGrid();
        this.updateProgress();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.video-funnel-section')) {
        window.videoFunnel = new VideoFunnel();
    }
});
