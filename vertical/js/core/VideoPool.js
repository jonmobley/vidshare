// js/core/VideoPool.js - Manages the pool of reusable video elements

class VideoPool {
    constructor() {
        this.pool = new Map();
        this.elementStates = new Map(); // Track state of each element: 'available', 'rendering', 'active'
        this.nextPoolId = 0;
        this.poolSize = 5; // Initial pool size
    }

    initialize(container) {
        this.container = container;
        
        // Create initial pool
        for (let i = 0; i < this.poolSize; i++) {
            this.createPoolElement();
        }
    }

    createPoolElement() {
        const element = this.createVideoElement();
        const poolId = this.nextPoolId++;
        
        element.dataset.poolId = poolId;
        this.pool.set(poolId, element);
        this.elementStates.set(poolId, 'available');
        this.container.appendChild(element);
        
        return { element, poolId };
    }

    createVideoElement() {
        const container = document.createElement('div');
        container.className = 'video-slide';
        container.dataset.state = 'hidden';
        return container;
    }

    getAvailableElement() {
        // Find first available element
        for (let [poolId, state] of this.elementStates) {
            if (state === 'available') {
                return { element: this.pool.get(poolId), poolId };
            }
        }
        
        // If no available elements, create a new one
        console.log('VideoPool: No available elements, creating new one');
        return this.createPoolElement();
    }

    markAsRendering(poolId) {
        this.elementStates.set(poolId, 'rendering');
    }

    markAsActive(poolId) {
        this.elementStates.set(poolId, 'active');
    }

    releaseElement(poolId) {
        const element = this.pool.get(poolId);
        if (!element) return;
        
        // Clean up the element
        this.resetElement(element);
        this.elementStates.set(poolId, 'available');
    }

    resetElement(element) {
        // Reset all classes and styles
        element.className = 'video-slide';
        element.dataset.state = 'hidden';
        element.style.cssText = '';
        
        // Remove any data attributes except poolId
        const poolId = element.dataset.poolId;
        for (let key in element.dataset) {
            if (key !== 'poolId') {
                delete element.dataset[key];
            }
        }
        
        // Reset progress bar
        const progressFill = element.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        
        // Remove any dynamically added elements
        const dynamicElements = element.querySelectorAll('.swipe-hint, .double-tap-heart, .like-burst');
        dynamicElements.forEach(el => el.remove());
        
        // Hide loading indicator
        const loadingIndicator = element.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // Reset pause indicator
        const pauseIndicator = element.querySelector('.pause-indicator');
        const pauseIcon = element.querySelector('.pause-icon');
        if (pauseIndicator) {
            pauseIndicator.classList.remove('show');
        }
        if (pauseIcon) {
            pauseIcon.classList.remove('paused');
        }
    }

    getPoolStatus() {
        const available = Array.from(this.elementStates.values()).filter(s => s === 'available').length;
        const total = this.pool.size;
        return { available, total, states: new Map(this.elementStates) };
    }

    cleanup() {
        // Release all elements
        for (let poolId of this.pool.keys()) {
            this.releaseElement(poolId);
        }
    }
}

export default VideoPool;