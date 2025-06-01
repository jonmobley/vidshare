class VideoPlaybackController {
    constructor(video, progressManager) {
        this.video = video;
        this.progressManager = progressManager;
        this.playOverlay = null;
        this.isTransitioning = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Create play overlay
        this.playOverlay = document.createElement('div');
        this.playOverlay.className = 'play-overlay';
        this.playOverlay.innerHTML = `
            <div class="play-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </div>
        `;
        this.playOverlay.style.display = 'none';

        // Add click handlers
        this.playOverlay.addEventListener('click', () => this.togglePlayback());
        this.video.addEventListener('click', () => this.togglePlayback());

        // Add spacebar handler
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                this.togglePlayback();
            }
        });

        // Add video event listeners
        this.video.addEventListener('play', () => this.handlePlay());
        this.video.addEventListener('pause', () => this.handlePause());
        this.video.addEventListener('ended', () => this.handleEnded());
    }

    togglePlayback() {
        if (this.video.paused) {
            this.video.play();
            this.playOverlay.style.display = 'none';
            this.progressManager.startProgress(this.video);
        } else {
            this.video.pause();
            if (!this.isTransitioning) {
                this.playOverlay.style.display = 'flex';
            }
            this.progressManager.stopProgress();
        }
    }

    handlePlay() {
        this.playOverlay.style.display = 'none';
        this.progressManager.startProgress(this.video);
    }

    handlePause() {
        if (!this.isTransitioning) {
            this.playOverlay.style.display = 'flex';
        }
        this.progressManager.stopProgress();
    }

    handleEnded() {
        this.progressManager.resetProgress();
    }

    setTransitioning(isTransitioning) {
        this.isTransitioning = isTransitioning;
        if (isTransitioning) {
            this.playOverlay.style.display = 'none';
        }
    }

    cleanup() {
        this.progressManager.cleanup();
        this.playOverlay.remove();
    }
}

export default VideoPlaybackController; 