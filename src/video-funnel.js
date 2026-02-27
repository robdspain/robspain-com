/**
 * Video Funnel Interactive Logic
 * Handles video playback, progress tracking, navigation, bento grid, and email gating.
 */

class VideoFunnel {
    constructor() {
        this.steps = window.videoFunnelData && window.videoFunnelData.length > 0
            ? window.videoFunnelData
            : [];

        if (!this.steps.length) return;

        this.currentIndex = 0;
        this.unlockedUntil = 3; // First 3 videos free
        this.isGated = true;
        this.watchedSteps = new Set();

        this.init();
    }

    init() {
        // Restore state from localStorage
        const saved = localStorage.getItem('videoFunnelState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.unlocked) {
                    this.unlockedUntil = this.steps.length;
                    this.isGated = false;
                }
                if (state.currentIndex != null) {
                    this.currentIndex = Math.min(state.currentIndex, this.steps.length - 1);
                }
                if (state.watched) {
                    this.watchedSteps = new Set(state.watched);
                }
            } catch (e) { /* ignore */ }
        }

        this.buildBentoGrid();
        this.renderCurrentStep();
        this.setupEventListeners();
        this.updateProgress();
    }

    saveState() {
        localStorage.setItem('videoFunnelState', JSON.stringify({
            unlocked: !this.isGated,
            currentIndex: this.currentIndex,
            watched: Array.from(this.watchedSteps)
        }));
    }

    // ── Video Embedding ──────────────────────────────────────────────

    parseVideoUrl(url) {
        if (!url) return null;

        // YouTube
        let match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
        if (match) return { type: 'youtube', id: match[1] };

        // Vimeo
        match = url.match(/vimeo\.com\/(\d+)/);
        if (match) return { type: 'vimeo', id: match[1] };

        // Direct video URL (R2, S3, etc.)
        if (url.match(/\.(mp4|webm|m3u8)(\?|$)/i)) return { type: 'direct', url: url };

        // Loom
        match = url.match(/loom\.com\/share\/([\w]+)/);
        if (match) return { type: 'loom', id: match[1] };

        return null;
    }

    createVideoEmbed(videoInfo) {
        if (!videoInfo) return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'video-embed-wrapper';
        wrapper.style.cssText = 'position:relative;width:100%;height:100%;';

        switch (videoInfo.type) {
            case 'youtube':
                wrapper.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${videoInfo.id}?rel=0&modestbranding=1&autoplay=1"
                    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:16px;"
                    allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
                    allowfullscreen></iframe>`;
                break;
            case 'vimeo':
                wrapper.innerHTML = `<iframe src="https://player.vimeo.com/video/${videoInfo.id}?autoplay=1&title=0&byline=0&portrait=0"
                    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:16px;"
                    allow="autoplay;fullscreen;picture-in-picture"
                    allowfullscreen></iframe>`;
                break;
            case 'loom':
                wrapper.innerHTML = `<iframe src="https://www.loom.com/embed/${videoInfo.id}?autoplay=1"
                    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:16px;"
                    allowfullscreen></iframe>`;
                break;
            case 'direct':
                wrapper.innerHTML = `<video controls autoplay playsinline
                    style="width:100%;height:100%;border-radius:16px;background:#0f172a;"
                    src="${videoInfo.url}"></video>`;
                break;
        }
        return wrapper;
    }

    // ── Rendering ────────────────────────────────────────────────────

    renderCurrentStep() {
        const step = this.steps[this.currentIndex];
        if (!step) return;

        const isLocked = step.id > this.unlockedUntil;
        const isGateStep = isLocked && this.isGated;

        // Update labels
        const activeTitle = document.querySelector('.active-video-title');
        const currentStepTitle = document.querySelector('.current-step-title');
        const stepLabel = document.querySelector('.step-label');

        if (activeTitle) activeTitle.textContent = step.title;
        if (currentStepTitle) currentStepTitle.textContent = step.title;
        if (stepLabel) stepLabel.textContent = `STEP ${String(step.id).padStart(2, '0')}`;

        // Main content area
        const playerFrame = document.querySelector('.video-player-frame');
        if (!playerFrame) return;

        // Clear previous content
        playerFrame.innerHTML = '';

        if (isGateStep) {
            // Email gate overlay
            playerFrame.innerHTML = `
                <div class="video-placeholder-overlay">
                    <div class="optin-overlay animate-fade-up">
                        <h3 class="optin-title">Unlock The Full Series</h3>
                        <p class="optin-subtitle">Enter your email to access all 10 videos and download the free 10-Minute Staff Script.</p>
                        <form class="optin-form" id="funnel-optin-form" novalidate>
                            <input type="email" class="optin-input" placeholder="Your email address" required autocomplete="email">
                            <button type="submit" class="optin-btn">Unlock Free Access <i class="fas fa-arrow-right"></i></button>
                        </form>
                        <div id="optin-msg" style="display:none;" class="optin-success"></div>
                    </div>
                </div>
            `;
            document.getElementById('funnel-optin-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const email = e.target.querySelector('input').value.trim();
                if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) this.handleOptIn(email);
            });
        } else {
            const videoInfo = this.parseVideoUrl(step.videoUrl);

            if (videoInfo) {
                // Real video — show play button, embed on click
                const overlay = document.createElement('div');
                overlay.className = 'video-placeholder-overlay';
                overlay.innerHTML = `
                    <div class="play-btn-large"><i class="fas fa-play"></i></div>
                    <h3 class="active-video-title">${step.title}</h3>
                    <p style="color: #94a3b8; margin-top: 1rem;">Click to Play Video</p>
                `;
                overlay.style.cursor = 'pointer';
                playerFrame.appendChild(overlay);

                overlay.addEventListener('click', () => {
                    playerFrame.innerHTML = '';
                    const embed = this.createVideoEmbed(videoInfo);
                    if (embed) {
                        playerFrame.appendChild(embed);
                        this.markWatched(step.id);
                    }
                });
            } else {
                // No video URL yet — show script content with notice
                const overlay = document.createElement('div');
                overlay.className = 'video-placeholder-overlay';
                overlay.innerHTML = `
                    <div class="play-btn-large" style="opacity: 0.5;"><i class="fas fa-file-alt"></i></div>
                    <h3 class="active-video-title">${step.title}</h3>
                    <p style="color: #94a3b8; margin-top: 1rem;">Video coming soon — read the script preview below</p>
                `;
                overlay.style.cursor = 'pointer';
                playerFrame.appendChild(overlay);

                overlay.addEventListener('click', () => {
                    playerFrame.innerHTML = `
                        <div class="script-content-view" style="text-align:left;padding:2rem;overflow-y:auto;max-height:100%;width:100%;background:#0f172a;">
                            <div style="max-width:650px;margin:0 auto;color:#e2e8f0;line-height:1.8;">
                                <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:1rem;margin-bottom:2rem;font-size:0.9rem;color:#10B981;">
                                    📝 Script Preview — Video recording in progress
                                </div>
                                ${step.content || '<p>No content available yet.</p>'}
                            </div>
                        </div>
                    `;
                    this.markWatched(step.id);
                });
            }
        }

        // Update next button
        this.updateNextButton();

        // Update bento grid active state
        this.updateBentoGrid();

        this.saveState();
    }

    markWatched(stepId) {
        this.watchedSteps.add(stepId);
        this.updateProgress();
        this.updateBentoGrid();
        this.saveState();
    }

    updateNextButton() {
        const nextBtn = document.getElementById('next-video');
        if (!nextBtn) return;

        if (this.currentIndex >= this.steps.length - 1) {
            nextBtn.innerHTML = '<span>Finish Series</span> <i class="fas fa-check"></i>';
        } else {
            nextBtn.innerHTML = '<span>Next Video</span> <i class="fas fa-arrow-right"></i>';
        }

        // Check if next step is accessible
        const nextStep = this.steps[this.currentIndex + 1];
        const nextLocked = nextStep && nextStep.id > this.unlockedUntil && this.isGated;
        nextBtn.style.opacity = nextLocked ? '0.5' : '1';
        nextBtn.style.pointerEvents = nextLocked ? 'none' : 'auto';
    }

    // ── Bento Grid ───────────────────────────────────────────────────

    buildBentoGrid() {
        const grid = document.querySelector('.video-bento-grid');
        if (!grid) return;

        grid.innerHTML = '';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        grid.style.gap = '1rem';
        grid.style.marginTop = '2rem';

        this.steps.forEach((step, index) => {
            const card = document.createElement('div');
            card.className = 'bento-card';
            card.dataset.stepIndex = index;

            const isLocked = step.id > this.unlockedUntil && this.isGated;
            const hasVideo = !!step.videoUrl;

            card.innerHTML = `
                <div class="bento-step-num">${String(step.id).padStart(2, '0')}</div>
                <div class="bento-title">${step.title.replace(/^Video \d+:\s*/, '')}</div>
                <div class="bento-status">
                    ${isLocked ? '<i class="fas fa-lock"></i>' : hasVideo ? '<i class="fas fa-play-circle"></i>' : '<i class="fas fa-file-alt"></i>'}
                </div>
            `;

            card.style.cssText = `
                background: rgba(15,23,42,0.6);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px;
                padding: 1.25rem;
                cursor: ${isLocked ? 'not-allowed' : 'pointer'};
                opacity: ${isLocked ? '0.4' : '1'};
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            `;

            if (!isLocked) {
                card.addEventListener('click', () => {
                    this.currentIndex = index;
                    this.renderCurrentStep();
                    document.getElementById('free-training')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                card.addEventListener('mouseenter', () => {
                    card.style.borderColor = '#10B981';
                    card.style.transform = 'translateY(-2px)';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.borderColor = 'rgba(255,255,255,0.08)';
                    card.style.transform = 'none';
                });
            }

            grid.appendChild(card);
        });
    }

    updateBentoGrid() {
        const cards = document.querySelectorAll('.bento-card');
        cards.forEach((card) => {
            const idx = parseInt(card.dataset.stepIndex, 10);
            const step = this.steps[idx];
            if (!step) return;

            const isActive = idx === this.currentIndex;
            const isWatched = this.watchedSteps.has(step.id);

            card.style.borderColor = isActive ? '#10B981' : 'rgba(255,255,255,0.08)';
            card.style.background = isActive ? 'rgba(16,185,129,0.15)' : 'rgba(15,23,42,0.6)';

            const statusEl = card.querySelector('.bento-status');
            if (statusEl && isWatched && !isActive) {
                statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:#10B981;"></i>';
            }
        });
    }

    // ── Event Listeners ──────────────────────────────────────────────

    setupEventListeners() {
        const nextBtn = document.getElementById('next-video');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentIndex < this.steps.length - 1) {
                    this.currentIndex++;
                    this.renderCurrentStep();
                    document.getElementById('free-training')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    // Series complete
                    const playerFrame = document.querySelector('.video-player-frame');
                    if (playerFrame) {
                        playerFrame.innerHTML = `
                            <div class="video-placeholder-overlay">
                                <div style="text-align:center;">
                                    <div style="width:64px;height:64px;background:#10B981;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;">
                                        <i class="fas fa-check" style="color:#fff;font-size:1.5rem;"></i>
                                    </div>
                                    <h3 style="color:#10B981;font-size:1.5rem;font-weight:800;margin-bottom:0.75rem;">Series Complete</h3>
                                    <p style="color:#94a3b8;margin-bottom:2rem;max-width:340px;line-height:1.6;">You now have the framework. Ready to implement it with support? Apply to the 8-Week Transformation Program.</p>
                                    <a href="/transformation-program" class="optin-btn" style="display:inline-block;text-decoration:none;">
                                        Apply to the Program <i class="fas fa-arrow-right"></i>
                                    </a>
                                </div>
                            </div>
                        `;
                    }
                }
            });
        }
    }

    // ── Email Gate ────────────────────────────────────────────────────

    async handleOptIn(email) {
        const btn = document.querySelector('#funnel-optin-form .optin-btn');
        const msgEl = document.getElementById('optin-msg');
        if (btn) { btn.disabled = true; btn.textContent = 'Unlocking...'; }

        try {
            const res = await fetch('/.netlify/functions/collect-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, source: 'video-funnel', name: '' }),
            });
            const data = await res.json().catch(() => ({}));

            if (res.ok || data.alreadySubscribed) {
                if (msgEl) {
                    msgEl.style.display = 'block';
                    msgEl.textContent = data.alreadySubscribed ? "You're already in — unlocking now!" : 'Confirmed! Unlocking your videos...';
                }
                setTimeout(() => this.unlockAll(), 900);
            } else {
                throw new Error(data.error || 'Signup failed');
            }
        } catch (err) {
            console.warn('Opt-in error (unlocking anyway):', err);
            // Always unlock on any network error so users aren't blocked
            this.unlockAll();
        }

        localStorage.setItem('videoFunnelState', JSON.stringify({
            unlocked: true,
            email,
            currentIndex: this.currentIndex,
            watched: Array.from(this.watchedSteps),
        }));
    }

    unlockAll() {
        this.unlockedUntil = this.steps.length;
        this.isGated = false;
        this.buildBentoGrid();
        this.renderCurrentStep();
        this.updateProgress();
    }

    // ── Progress ─────────────────────────────────────────────────────

    updateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-percentage');
        if (!progressFill) return;

        const watchedCount = this.watchedSteps.size;
        const total = this.steps.length;
        const percentage = total > 0 ? Math.round((watchedCount / total) * 100) : 0;

        progressFill.style.width = `${percentage}%`;
        progressFill.style.transition = 'width 0.5s ease';
        if (progressText) progressText.textContent = `${percentage}% COMPLETE`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.video-funnel-section')) {
        window.videoFunnel = new VideoFunnel();
    }
});
