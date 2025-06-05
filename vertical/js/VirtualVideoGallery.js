// js/VirtualVideoGallery.js - Main gallery class that coordinates all components

import VideoRenderer from './core/VideoRenderer.js';
import VideoPool from './core/VideoPool.js';
import NavigationController from './core/NavigationController.js';
import ControlsManager from './core/ControlsManager.js';
import GestureHandler from './core/GestureHandler.js';
import { videoData } from './data/videoData.js';

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
        
        // Rendering completion callback
        this.onRenderingComplete = () => {
            console.log('🎬 Rendering complete, updating UI...');
            this.updateGlobalVideoIndex();
            this.updateProgressDots();
            this.updatePerformanceStats();
            this.controlsManager.updateCategoryPills(this.currentCategory);
            this.controlsManager.updateLikeButton();
        };
        
        // Initialize
        this.initialize();
    }

    initialize() {
        const videoWrapper = document.getElementById('videoWrapper');
        this.videoPool.initialize(videoWrapper);
        
        // Initialize seamless rendering
        this.renderer.renderAllCategories();
        
        // Wait for rendering to complete before updating UI
        setTimeout(() => {
            // Initialize global video index
            this.updateGlobalVideoIndex();
            
            // Force update progress dots after rendering
            this.updateProgressDots();
            this.updatePerformanceStats();
            
            // Update UI
            this.controlsManager.updateCategoryPills(this.currentCategory);
            this.controlsManager.updateLikeButton();
            
            console.log('✅ VirtualVideoGallery initialized with dots:', this.getTotalGlobalSlides());
        }, 100);
        
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
        this.updateGlobalVideoIndex();
    }

    setCurrentCategory(category) {
        this.currentCategory = category;
        // Restore the last viewed position when switching categories
        this.restoreCategoryPosition();
        this.updateGlobalVideoIndex();
    }

    saveCategoryPosition() {
        this.categorySlidePositions[this.currentCategory] = this.currentSlide;
    }

    restoreCategoryPosition() {
        this.currentSlide = this.categorySlidePositions[this.currentCategory];
    }

    updateGlobalVideoIndex() {
        // Calculate global video index based on current category and slide
        let globalIndex = 0;
        for (let i = 0; i < this.currentCategory; i++) {
            globalIndex += this.getCategoryLength(i);
        }
        globalIndex += this.currentSlide;
        this.globalVideoIndex = globalIndex;
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
        if (!progressIndicator) {
            console.error('Progress indicator element not found');
            return;
        }
        
        const totalGlobalSlides = this.getTotalGlobalSlides();
        console.log(`🔄 Updating progress dots: ${totalGlobalSlides} total videos, current: ${this.globalVideoIndex}`);
        
        // Always show dots, but limit to reasonable number for UI
        // If more than 50 videos, show a condensed version
        if (totalGlobalSlides > 50) {
            this.updateCondensedProgressDots(progressIndicator, totalGlobalSlides);
            return;
        }
        
        // Force display and clear existing content
        progressIndicator.style.display = 'flex';
        progressIndicator.innerHTML = '';
        
        // Create dots for all videos across all categories
        for (let i = 0; i < totalGlobalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            if (i === this.globalVideoIndex) {
                dot.classList.add('active');
                console.log(`Active dot: ${i}`);
            }
            progressIndicator.appendChild(dot);
        }
        
        console.log(`✅ Created ${totalGlobalSlides} progress dots`);
    }

    updateCondensedProgressDots(progressIndicator, totalGlobalSlides) {
        progressIndicator.style.display = 'flex';
        progressIndicator.innerHTML = '';
        
        // Show progress as a bar instead of individual dots for many videos
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar-vertical';
        progressBar.style.cssText = `
            width: 4px;
            height: 200px;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
            position: relative;
            overflow: hidden;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill-vertical';
        const progressPercent = ((this.globalVideoIndex + 1) / totalGlobalSlides) * 100;
        progressFill.style.cssText = `
            width: 100%;
            height: ${progressPercent}%;
            background: white;
            border-radius: 2px;
            transition: height 0.3s ease;
        `;
        
        progressBar.appendChild(progressFill);
        progressIndicator.appendChild(progressBar);
        
        // Add text indicator
        const textIndicator = document.createElement('div');
        textIndicator.style.cssText = `
            color: white;
            font-size: 10px;
            margin-top: 8px;
            text-align: center;
        `;
        textIndicator.textContent = `${this.globalVideoIndex + 1}/${totalGlobalSlides}`;
        progressIndicator.appendChild(textIndicator);
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
                    this.navigation.goToPrev();
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
                case 'p':
                case 'P':
                    // Toggle performance stats
                    const stats = document.getElementById('performanceStats');
                    if (stats) {
                        stats.classList.toggle('show');
                    }
                    break;
            }
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        console.log('🎮 Keyboard controls enabled: ↑↓ for videos, ←→ for categories, spacebar for play/pause, P for stats');
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