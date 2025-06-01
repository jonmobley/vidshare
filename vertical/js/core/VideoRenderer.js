// js/core/VideoRenderer.js - Handles rendering and state management of videos

class VideoRenderer {
    constructor(videoPool) {
        this.videoPool = videoPool;
        this.renderedVideos = new Map(); // Maps slide index to { element, poolId }
        this.visibleRange = 3; // Render current, prev, and next
    }

    renderVisibleVideos(currentSlide, totalSlides, videoData, currentCategory) {
        // Calculate which videos should be visible
        const start = Math.max(0, currentSlide - 1);
        const end = Math.min(totalSlides - 1, currentSlide + 1);
        
        // Track which elements we'll keep
        const elementsToKeep = new Set();
        
        // First pass: identify which videos to keep
        for (let [index, data] of this.renderedVideos) {
            if (index >= start && index <= end) {
                elementsToKeep.add(index);
            } else {
                // Release elements outside visible range
                this.videoPool.releaseElement(data.poolId);
                this.renderedVideos.delete(index);
            }
        }
        
        // Second pass: render new videos
        for (let i = start; i <= end; i++) {
            if (!this.renderedVideos.has(i)) {
                this.renderVideo(i, videoData[i], currentCategory);
            }
        }
        
        // Update states for all rendered videos
        this.updateVideoStates(currentSlide);
    }

    renderVideo(index, videoInfo, currentCategory) {
        const { element, poolId } = this.videoPool.getAvailableElement();
        
        if (!element) {
            console.error('No available element to render video');
            return;
        }
        
        // Mark as rendering
        this.videoPool.markAsRendering(poolId);
        
        // Populate video data
        const title = element.querySelector('.video-title');
        const description = element.querySelector('.video-description');
        const metadata = element.querySelector('.video-metadata');
        const loadingIndicator = element.querySelector('.loading-indicator');
        
        title.textContent = videoInfo.title;
        description.textContent = videoInfo.description;
        metadata.textContent = `Video ${index + 1}`;
        
        // Set data attributes
        element.dataset.category = currentCategory;
        element.dataset.index = index;
        element.dataset.videoId = videoInfo.id;
        
        // Add swipe hint to first video
        if (index === 0) {
            const existingHint = element.querySelector('.swipe-hint');
            if (!existingHint) {
                const swipeHint = document.createElement('div');
                swipeHint.className = 'swipe-hint';
                swipeHint.textContent = 'Swipe up to continue';
                element.appendChild(swipeHint);
            }
        }
        
        // Simulate loading
        loadingIndicator.style.display = 'block';
        setTimeout(() => {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }, Math.random() * 300 + 100);
        
        // Store reference
        this.renderedVideos.set(index, { element, poolId });
        
        // Mark as active
        this.videoPool.markAsActive(poolId);
    }

    updateVideoStates(currentSlide) {
        for (let [index, data] of this.renderedVideos) {
            const element = data.element;
            
            // Remove all state classes
            element.classList.remove('rubberband-up', 'rubberband-down', 
                                   'rubberband-left', 'rubberband-right',
                                   'category-exit-left', 'category-exit-right',
                                   'category-enter-left', 'category-enter-right');
            
            // Set appropriate state
            if (index === currentSlide) {
                element.dataset.state = 'active';
            } else if (index < currentSlide) {
                element.dataset.state = 'prev';
            } else {
                element.dataset.state = 'next';
            }
        }
    }

    getCurrentVideoElement(currentSlide) {
        const data = this.renderedVideos.get(currentSlide);
        return data ? data.element : null;
    }

    showRubberbandEffect(currentSlide, direction) {
        const element = this.getCurrentVideoElement(currentSlide);
        if (!element) return;
        
        // Remove any existing rubberband classes
        element.classList.remove('rubberband-up', 'rubberband-down', 
                               'rubberband-left', 'rubberband-right');
        
        // Force reflow
        void element.offsetWidth;
        
        // Add new rubberband class
        element.classList.add(`rubberband-${direction}`);
        
        // Remove after animation
        setTimeout(() => {
            element.classList.remove(`rubberband-${direction}`);
        }, 300);
    }

    clearAllVideos() {
        for (let [index, data] of this.renderedVideos) {
            this.videoPool.releaseElement(data.poolId);
        }
        this.renderedVideos.clear();
    }

    getRenderedCount() {
        return this.renderedVideos.size;
    }
}