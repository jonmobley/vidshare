class NavigationController {
    constructor(gallery) {
        this.gallery = gallery;
        this.isTransitioning = false;
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.lastTouchY = 0;
        this.lastTouchX = 0;
        this.isDragging = false;
        this.dragStartTime = 0;
        this.velocity = 0;
        this.lastTouchTime = 0;
        this.touchHistory = [];
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.isWheelEvent = false;
        this.wheelTimeout = null;
        this.wheelVelocity = 0;
        this.lastWheelTime = 0;
        this.wheelHistory = [];
        this.isWheelScrolling = false;
        this.wheelScrollTimeout = null;
        this.isWheelDragging = false;
        this.wheelDragStartTime = 0;
        this.wheelDragStartY = 0;
        this.wheelLastY = 0;
        this.wheelVelocity = 0;
        this.wheelHistory = [];
        this.isWheelTransitioning = false;
        this.wheelTransitionTimeout = null;
        this.wheelTransitionStartTime = 0;
        this.wheelTransitionStartY = 0;
        this.wheelTransitionLastY = 0;
        this.wheelTransitionVelocity = 0;
        this.wheelTransitionHistory = [];
        this.isWheelTransitioning = false;
        this.wheelTransitionTimeout = null;
        this.wheelTransitionStartTime = 0;
        this.wheelTransitionStartY = 0;
        this.wheelTransitionLastY = 0;
        this.wheelTransitionVelocity = 0;
        this.wheelTransitionHistory = [];
    }

    async transitionToSlide(newSlide, direction) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        try {
            // Store current position
            this.gallery.saveCategoryPosition();
            
            // Update current slide
            this.gallery.setCurrentSlide(newSlide);
            
            // Render new videos
            this.gallery.renderVideos(direction);
            
            // Update UI
            this.gallery.updateProgressDots();
            this.gallery.updateCategoryUI();
            this.gallery.updateLikeButton();
            
            // Update performance stats
            this.gallery.updatePerformanceStats();
        } finally {
            this.isTransitioning = false;
        }
    }

    goToNext() {
        if (this.isTransitioning) return;
        
        const currentSlide = this.gallery.currentSlide;
        const totalSlides = this.gallery.getTotalSlides();
        
        if (currentSlide < totalSlides - 1) {
            this.transitionToSlide(currentSlide + 1, 'up');
        }
    }

    goToPrev() {
        if (this.isTransitioning) return;
        
        const currentSlide = this.gallery.currentSlide;
        
        if (currentSlide > 0) {
            this.transitionToSlide(currentSlide - 1, 'down');
        }
    }

    goToCategory(category) {
        if (this.isTransitioning) return;
        
        const currentCategory = this.gallery.currentCategory;
        const direction = category > currentCategory ? 'right' : 'left';
        
        this.gallery.setCurrentCategory(category);
        this.transitionToSlide(0, direction);
    }

    handleWheel(event) {
        if (this.isTransitioning) return;
        
        const deltaY = event.deltaY;
        const now = Date.now();
        
        // Add to history
        this.wheelHistory.push({ deltaY, time: now });
        
        // Keep only last 5 events
        if (this.wheelHistory.length > 5) {
            this.wheelHistory.shift();
        }
        
        // Calculate velocity
        if (this.wheelHistory.length > 1) {
            const first = this.wheelHistory[0];
            const last = this.wheelHistory[this.wheelHistory.length - 1];
            const timeDiff = last.time - first.time;
            const deltaDiff = last.deltaY - first.deltaY;
            
            if (timeDiff > 0) {
                this.wheelVelocity = deltaDiff / timeDiff;
            }
        }
        
        // Determine direction
        if (deltaY > 0) {
            this.goToNext();
        } else if (deltaY < 0) {
            this.goToPrev();
        }
    }

    handleTouchStart(event) {
        this.touchStartY = event.touches[0].clientY;
        this.touchStartX = event.touches[0].clientX;
        this.lastTouchY = this.touchStartY;
        this.lastTouchX = this.touchStartX;
        this.isDragging = true;
        this.dragStartTime = Date.now();
        this.touchHistory = [];
    }

    handleTouchMove(event) {
        if (!this.isDragging) return;
        
        const currentY = event.touches[0].clientY;
        const currentX = event.touches[0].clientX;
        const deltaY = currentY - this.lastTouchY;
        const deltaX = currentX - this.lastTouchX;
        const now = Date.now();
        
        // Add to history
        this.touchHistory.push({ deltaY, time: now });
        
        // Keep only last 5 events
        if (this.touchHistory.length > 5) {
            this.touchHistory.shift();
        }
        
        // Calculate velocity
        if (this.touchHistory.length > 1) {
            const first = this.touchHistory[0];
            const last = this.touchHistory[this.touchHistory.length - 1];
            const timeDiff = last.time - first.time;
            const deltaDiff = last.deltaY - first.deltaY;
            
            if (timeDiff > 0) {
                this.velocity = deltaDiff / timeDiff;
            }
        }
        
        // Update last position
        this.lastTouchY = currentY;
        this.lastTouchX = currentX;
    }

    handleTouchEnd(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Determine direction based on velocity and distance
        const distance = this.lastTouchY - this.touchStartY;
        const duration = Date.now() - this.dragStartTime;
        const velocity = this.velocity;
        
        if (Math.abs(distance) > 50 || Math.abs(velocity) > 0.5) {
            if (distance > 0 || velocity > 0) {
                this.goToPrev();
            } else {
                this.goToNext();
            }
        }
    }
} 