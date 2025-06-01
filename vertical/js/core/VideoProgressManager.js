class VideoProgressManager {
    constructor() {
        this.animationFrameId = null;
        this.lastUpdateTime = 0;
        this.progressBar = document.getElementById('videoProgress');
    }

    updateProgress(video, timestamp) {
        if (!video || !this.progressBar) return;
        
        // Calculate time elapsed since last update
        if (!this.lastUpdateTime) this.lastUpdateTime = timestamp;
        const elapsed = timestamp - this.lastUpdateTime;
        this.lastUpdateTime = timestamp;
        
        const currentTime = video.currentTime;
        const duration = video.duration || 15; // Use actual duration or default to 15s
        
        if (duration) {
            const progress = (currentTime / duration) * 100;
            this.progressBar.style.width = `${Math.min(100, progress)}%`;
        }
        
        // Only continue animation if video is playing
        if (!video.paused) {
            this.animationFrameId = requestAnimationFrame((ts) => this.updateProgress(video, ts));
        }
    }

    resetProgress() {
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }
        this.lastUpdateTime = 0;
    }

    startProgress(video) {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.resetProgress();
        this.animationFrameId = requestAnimationFrame((ts) => this.updateProgress(video, ts));
    }

    stopProgress() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.lastUpdateTime = 0;
    }

    cleanup() {
        this.stopProgress();
        this.resetProgress();
    }
}

export default VideoProgressManager; 