// js/VirtualVideoGallery.js - Main gallery class that coordinates all components

import VideoRenderer from '/vertical/js/core/VideoRenderer.js';
import VideoPool from '/vertical/js/core/VideoPool.js';
import NavigationController from '/vertical/js/core/NavigationController.js';
import ControlsManager from '/vertical/js/core/ControlsManager.js';
import GestureHandler from '/vertical/js/core/GestureHandler.js';
import { videoData } from '/vertical/js/data/videoData.js';

class VirtualVideoGallery {
    constructor() {
        // State
        this.currentSlide = 0;
        this.currentCategory = 0;
        this.globalVideoIndex = 0; // Track global position across all categories
        this.categorySlidePositions = new Array(4).fill(0); // Initialize for all categories including Videos
        this.isPlaying = true;
        
        // Settings
        this.settings = {
            autoplay: true,
            muted: true,
            loop: true
        };
        
        // Initialize components
        this.videoPool = new VideoPool();
        this.renderer = new VideoRenderer(this.videoPool, this);
        this.navigation = new NavigationController(this);
        this.controlsManager = new ControlsManager(this);
        this.gestures = new GestureHandler(this);
        
        // Initialize
        this.initialize();
    }

    initialize() {
        const videoWrapper = document.getElementById('videoWrapper');
        this.videoPool.initialize(videoWrapper);
        
        // Initialize seamless rendering
        this.renderer.renderAllCategories();
        
        this.updateProgressDots();
        this.updatePerformanceStats();
        
        // Update UI
        this.controlsManager.updateCategoryPills(this.currentCategory);
        this.controlsManager.updateLikeButton();
        
        // Set up keyboard navigation
        this.setupKeyboardControls();
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
        // Restore the last viewed position when switching categories
        this.restoreCategoryPosition();
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
        // For seamless scrolling, return total for current category only for UI purposes
        return videoData[this.currentCategory] ? videoData[this.currentCategory].length : 0;
    }

    getTotalGlobalSlides() {
        // Total across all categories for seamless scrolling
        let total = 0;
        Object.keys(videoData).forEach(categoryIndex => {
            total += videoData[categoryIndex].length;
        });
        return total;
    }

    getTotalCategories() {
        return Object.keys(videoData).length;
    }

    getCategoryLength(category) {
        return videoData[category].length;
    }

    // Rendering
    renderVideos(direction = null) {
        const currentCategoryData = videoData[this.currentCategory];
        if (!currentCategoryData) {
            console.error('No video data found for category:', this.currentCategory);
            return;
        }

        this.renderer.renderVisibleVideos(
            this.currentSlide,
            this.getTotalSlides(),
            currentCategoryData,
            this.currentCategory,
            direction
        );
        this.updatePerformanceStats();
    }

    // UI Updates
    updateProgressDots() {
        const progressIndicator = document.getElementById('progressIndicator');
        const totalGlobalSlides = this.getTotalGlobalSlides();
        
        // Hide dots if more than 20 videos total
        if (totalGlobalSlides > 20) {
            progressIndicator.style.display = 'none';
            return;
        }
        
        progressIndicator.style.display = 'flex';
        progressIndicator.innerHTML = '';
        
        // Create dots for all videos across all categories
        for (let i = 0; i < totalGlobalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            if (i === this.globalVideoIndex) {
                dot.classList.add('active');
            }
            progressIndicator.appendChild(dot);
        }
    }

    updateCategoryUI() {
        this.controlsManager.updateCategoryPills(this.currentCategory);
    }

    updateLikeButton() {
        this.controlsManager.updateLikeButton();
    }

    resetVideoProgress() {
        const progressBar = document.getElementById('videoProgress');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }

    startVideoProgress() {
        const currentElement = this.renderer.getCurrentVideoElement(this.currentSlide);
        if (!currentElement) return;
        
        const video = currentElement.querySelector('video');
        if (!video) return;
        
        const progressBar = document.getElementById('videoProgress');
        if (!progressBar) return;
        
        // Reset progress
        progressBar.style.width = '0%';
        
        // Update progress as video plays
        video.addEventListener('timeupdate', () => {
            const progress = (video.currentTime / video.duration) * 100;
            progressBar.style.width = `${progress}%`;
        });
    }

    updatePerformanceStats() {
        const poolStatus = this.videoPool.getPoolStatus();
        
        document.getElementById('renderedCount').textContent = this.renderer.getRenderedCount();
        document.getElementById('totalCount').textContent = this.getTotalGlobalSlides();
        document.getElementById('currentIndex').textContent = `${this.globalVideoIndex + 1} (${this.currentSlide + 1} in cat ${this.currentCategory})`;
        document.getElementById('poolStatus').textContent = `${poolStatus.available}/${poolStatus.total}`;
        
        const estimatedMemoryPerVideo = 0.1; // MB
        const memoryUsage = (this.renderer.getRenderedCount() * estimatedMemoryPerVideo).toFixed(1);
        document.getElementById('memoryUsage').textContent = memoryUsage;
    }

    // Playback controls
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        const currentElement = this.renderer.getCurrentVideoElement(this.currentSlide);
        if (!currentElement) {
            console.warn('No current video element found');
            return;
        }
        
        const video = currentElement.querySelector('video');
        if (video) {
            if (this.isPlaying) {
                video.play().catch(error => console.error('Error playing video:', error));
            } else {
                video.pause();
            }
        }
    }

    handleVideoEnd() {
        switch(this.controlsManager.autoplayMode) {
            case 'loop':
                const currentElement = this.renderer.getCurrentVideoElement(this.currentSlide);
                if (currentElement) {
                    const video = currentElement.querySelector('video');
                    if (video) {
                        video.currentTime = 0;
                        if (this.isPlaying) {
                            video.play().catch(error => console.error('Error playing video:', error));
                        }
                    }
                }
                break;
                
            case 'pause':
                this.isPlaying = false;
                const pauseElement = this.renderer.getCurrentVideoElement(this.currentSlide);
                if (pauseElement) {
                    const video = pauseElement.querySelector('video');
                    if (video) {
                        video.pause();
                    }
                }
                break;
                
            case 'next':
                // Check if we're at the last video of the last category
                if (this.currentCategory === this.getTotalCategories() - 1 && 
                    this.currentSlide === this.getTotalSlides() - 1) {
                    // At the very end - pause
                    this.isPlaying = false;
                    const lastElement = this.renderer.getCurrentVideoElement(this.currentSlide);
                    if (lastElement) {
                        const video = lastElement.querySelector('video');
                        if (video) {
                            video.pause();
                        }
                    }
                } else {
                    // Go to next video
                    this.navigation.goToNext();
                }
                break;
        }
    }

    // Keyboard controls
    setupKeyboardControls() {
        this.keydownHandler = (event) => {
            // Prevent default behavior for navigation keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
                event.preventDefault();
            }
            
            switch (event.key) {
                case 'ArrowUp':
                    this.navigation.goToPrevious();
                    break;
                case 'ArrowDown':
                    this.navigation.goToNext();
                    break;
                case 'ArrowLeft':
                    this.navigation.goToPreviousCategory();
                    break;
                case 'ArrowRight':
                    this.navigation.goToNextCategory();
                    break;
                case ' ': // Spacebar
                    this.togglePlayPause();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        console.log('🎮 Keyboard controls enabled: ↑↓ for videos, ←→ for categories, spacebar for play/pause');
    }

    // Cleanup
    destroy() {
        this.videoPool.cleanup();
        // Remove event listeners if needed
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
    }

    setAutoplayMode(mode) {
        this.settings.autoplay = mode;
        this.isPlaying = mode;
        this.controlsManager.setAutoplayMode(mode);
        this.renderer.updateAllVideoPlaybackSettings();
    }

    setMuted(muted) {
        this.settings.muted = muted;
        this.controlsManager.setMuted(muted);
        this.renderer.updateAllVideoPlaybackSettings();
    }

    setLoop(loop) {
        this.settings.loop = loop;
        this.controlsManager.setLoop(loop);
        this.renderer.updateAllVideoPlaybackSettings();
    }
}

export default VirtualVideoGallery;