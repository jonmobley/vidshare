// js/VirtualVideoGallery.js - Main gallery class that coordinates all components

class VirtualVideoGallery {
    constructor() {
        // State
        this.currentSlide = 0;
        this.currentCategory = 0;
        this.categorySlidePositions = [0, 0, 0];
        this.isPlaying = true;
        
        // Video progress
        this.videoProgress = 0;
        this.videoDuration = 15000; // 15 seconds per video
        this.progressInterval = null;
        
        // Initialize components
        this.videoPool = new VideoPool();
        this.renderer = new VideoRenderer(this.videoPool);
        this.navigation = new NavigationController(this);
        this.controls = new ControlsManager(this);
        this.gestures = new GestureHandler(this);
        
        // Initialize
        this.initialize();
    }

    initialize() {
        const videoWrapper = document.getElementById('videoWrapper');
        this.videoPool.initialize(videoWrapper);
        
        this.updateProgressDots();
        this.renderVideos();
        this.startVideoProgress();
        this.updatePerformanceStats();
        
        // Update UI
        this.controls.updateCategoryPills(this.currentCategory);
        this.controls.updateLikeButton();
    }

    // State management
    getState() {
        return {
            currentSlide: this.currentSlide,
            currentCategory: this.currentCategory,
            totalSlides: this.getTotalSlides(),
            isPlaying: this.isPlaying
        };
    }

    setCurrentSlide(slide) {
        this.currentSlide = slide;
        this.categorySlidePositions[this.currentCategory] = slide;
    }

    setCurrentCategory(category) {
        this.currentCategory = category;
    }

    saveCategoryPosition() {
        this.categorySlidePositions[this.currentCategory] = this.currentSlide;
    }

    restoreCategoryPosition() {
        this.currentSlide = this.categorySlidePositions[this.currentCategory];
    }

    // Data access
    getCurrentVideoData() {
        return videoData[this.currentCategory][this.currentSlide];
    }

    getTotalSlides() {
        return videoData[this.currentCategory].length;
    }

    getTotalCategories() {
        return Object.keys(videoData).length;
    }

    getCategoryLength(category) {
        return videoData[category].length;
    }

    // Rendering
    renderVideos() {
        this.renderer.renderVisibleVideos(
            this.currentSlide,
            this.getTotalSlides(),
            videoData[this.currentCategory],
            this.currentCategory
        );
        this.updatePerformanceStats();
    }

    // UI Updates
    updateProgressDots() {
        const progressIndicator = document.getElementById('progressIndicator');
        const totalSlides = this.getTotalSlides();
        
        // Hide dots if more than 10 videos
        if (totalSlides > 10) {
            progressIndicator.style.display = 'none';
            return;
        }
        
        progressIndicator.style.display = 'flex';
        progressIndicator.innerHTML = '';
        
        // Create dots
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            if (i === this.currentSlide) {
                dot.classList.add('active');
            }
            progressIndicator.appendChild(dot);
        }
    }

    updateCategoryUI() {
        this.controls.updateCategoryPills(this.currentCategory);
    }

    updateLikeButton() {
        this.controls.updateLikeButton();
    }

    updatePerformanceStats() {
        const poolStatus = this.videoPool.getPoolStatus();
        
        document.getElementById('renderedCount').textContent = this.renderer.getRenderedCount();
        document.getElementById('totalCount').textContent = this.getTotalSlides();
        document.getElementById('currentIndex').textContent = this.currentSlide + 1;
        document.getElementById('poolStatus').textContent = `${poolStatus.available}/${poolStatus.total}`;
        
        const estimatedMemoryPerVideo = 0.1; // MB
        const memoryUsage = (this.renderer.getRenderedCount() * estimatedMemoryPerVideo).toFixed(1);
        document.getElementById('memoryUsage').textContent = memoryUsage;
    }

    // Playback controls
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        const currentElement = this.renderer.getCurrentVideoElement(this.currentSlide);
        if (!currentElement) return;
        
        const pauseIndicator = currentElement.querySelector('.pause-indicator');
        const pauseIcon = currentElement.querySelector('.pause-icon');
        
        if (this.isPlaying) {
            currentElement.classList.remove('paused');
            pauseIcon.classList.remove('paused');
            pauseIndicator.classList.remove('show');
            this.startVideoProgress();
        } else {
            currentElement.classList.add('paused');
            pauseIcon.classList.add('paused');
            pauseIndicator.classList.add('show');
            this.pauseVideoProgress();
            
            setTimeout(() => {
                pauseIndicator.classList.remove('show');
            }, 2000);
        }
    }

    // Video progress management
    startVideoProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        if (!this.isPlaying) return;
        
        this.progressInterval = setInterval(() => {
            if (this.isPlaying && !this.navigation.isTransitioning) {
                this.videoProgress += 100;
                const progressPercent = (this.videoProgress / this.videoDuration) * 100;
                
                const currentElement = this.renderer.getCurrentVideoElement(this.currentSlide);
                if (currentElement) {
                    const progressFill = currentElement.querySelector('.progress-fill');
                    if (progressFill) {
                        progressFill.style.width = `${Math.min(progressPercent, 100)}%`;
                    }
                }
                
                if (progressPercent >= 100) {
                    this.videoProgress = 0;
                    this.handleVideoEnd();
                }
            }
        }, 100);
    }

    pauseVideoProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    resetVideoProgress() {
        this.videoProgress = 0;
        const currentElement = this.renderer.getCurrentVideoElement(this.currentSlide);
        if (currentElement) {
            const progressFill = currentElement.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = '0%';
            }
        }
    }

    handleVideoEnd() {
        switch(this.controls.autoplayMode) {
            case 'loop':
                this.resetVideoProgress();
                if (this.isPlaying) {
                    this.startVideoProgress();
                }
                break;
                
            case 'pause':
                this.isPlaying = false;
                this.pauseVideoProgress();
                const currentElement = this.renderer.getCurrentVideoElement(this.currentSlide);
                if (currentElement) {
                    currentElement.classList.add('paused');
                }
                break;
                
            case 'next':
                // Check if we're at the last video of the last category
                if (this.currentCategory === this.getTotalCategories() - 1 && 
                    this.currentSlide === this.getTotalSlides() - 1) {
                    // At the very end - pause
                    this.isPlaying = false;
                    this.pauseVideoProgress();
                    const lastElement = this.renderer.getCurrentVideoElement(this.currentSlide);
                    if (lastElement) {
                        lastElement.classList.add('paused');
                    }
                } else {
                    // Go to next video
                    this.navigation.goToNext();
                }
                break;
        }
    }

    // Cleanup
    destroy() {
        this.pauseVideoProgress();
        this.videoPool.cleanup();
        // Remove event listeners if needed
    }
}