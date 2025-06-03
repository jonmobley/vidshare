// js/core/GestureHandler.js - Handles touch, mouse, and wheel events

class GestureHandler {
    constructor(gallery) {
        this.gallery = gallery;
        
        // Touch/drag state
        this.startY = 0;
        this.startX = 0;
        this.currentY = 0;
        this.currentX = 0;
        this.isDragging = false;
        this.dragDirection = null;
        this.threshold = 50;
        
        // Double tap detection
        this.lastTap = 0;
        this.tapTimeout = null;
        
        // Wheel throttling
        this.wheelCooldown = false;
        this.wheelCooldownDuration = 150;
        
        this.bindEvents();
    }

    bindEvents() {
        const container = document.getElementById('videoContainer');
        
        // Touch events
        container.addEventListener('touchstart', (e) => {
            this.handleStart(e.touches[0].clientY, e.touches[0].clientX, e);
        }, { passive: false });
        
        container.addEventListener('touchmove', (e) => {
            this.handleMove(e.touches[0].clientY, e.touches[0].clientX);
        }, { passive: true });
        
        container.addEventListener('touchend', (e) => {
            this.handleEnd(e);
        }, { passive: false });
        
        // Mouse events
        container.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleStart(e.clientY, e.clientX, e);
        });
        
        container.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                this.handleMove(e.clientY, e.clientX);
            }
        });
        
        container.addEventListener('mouseup', (e) => this.handleEnd(e));
        container.addEventListener('mouseleave', () => this.handleEnd());
        
        // Wheel events
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleWheel(e);
        }, { passive: false });
        
        // Prevent default touch behaviors only when we have a clear drag direction
        document.addEventListener('touchmove', (e) => {
            if (this.isDragging && this.dragDirection) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    handleStart(clientY, clientX, e) {
        if (this.gallery.navigation.isTransitioning) return;
        
        this.startY = clientY;
        this.startX = clientX;
        this.currentY = clientY;
        this.currentX = clientX;
        this.isDragging = false; // Don't set to true until we detect movement
        this.dragDirection = null;
        
        // Double tap detection
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTap;
        
        if (tapLength < 500 && tapLength > 0) {
            this.handleDoubleTap(e);
            e.preventDefault();
        } else {
            // Single tap - toggle play/pause after delay
            this.tapTimeout = setTimeout(() => {
                if (!this.isDragging || (Math.abs(this.currentY - this.startY) < 10 && 
                                       Math.abs(this.currentX - this.startX) < 10)) {
                    this.gallery.togglePlayPause();
                }
            }, 200);
        }
        
        this.lastTap = currentTime;
    }

    handleMove(clientY, clientX) {
        if (this.gallery.navigation.isTransitioning) return;
        
        this.currentY = clientY;
        this.currentX = clientX;
        const deltaY = this.currentY - this.startY;
        const deltaX = this.currentX - this.startX;
        
        // Only start dragging if we've moved enough
        if (!this.isDragging && (Math.abs(deltaY) > 5 || Math.abs(deltaX) > 5)) {
            this.isDragging = true;
            
            // Clear tap timeout if we're moving
            if (this.tapTimeout) {
                clearTimeout(this.tapTimeout);
                this.tapTimeout = null;
            }
        }
        
        if (!this.isDragging) return;
        
        // Determine drag direction
        if (!this.dragDirection && (Math.abs(deltaY) > 10 || Math.abs(deltaX) > 10)) {
            this.dragDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
        }
    }

    handleEnd(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        const deltaY = this.currentY - this.startY;
        const deltaX = this.currentX - this.startX;
        
        // Handle swipe based on direction
        if (this.dragDirection === 'vertical' && Math.abs(deltaY) > this.threshold) {
            if (deltaY > 0) {
                this.gallery.navigation.goToPrevious();
            } else {
                this.gallery.navigation.goToNext();
            }
        } else if (this.dragDirection === 'horizontal' && Math.abs(deltaX) > this.threshold) {
            if (deltaX > 0) {
                this.gallery.navigation.goToPreviousCategory();
            } else {
                this.gallery.navigation.goToNextCategory();
            }
        }
        
        // Clear tap timeout
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
            this.tapTimeout = null;
        }
        
        this.dragDirection = null;
    }

    handleWheel(e) {
        if (this.wheelCooldown || this.gallery.navigation.isTransitioning) return;
        
        this.wheelCooldown = true;
        setTimeout(() => {
            this.wheelCooldown = false;
        }, this.wheelCooldownDuration);
        
        this.gallery.navigation.handleWheel(e.deltaX, e.deltaY);
    }

    handleDoubleTap(e) {
        // Show heart animation
        this.gallery.controlsManager.showDoubleTapHeart();
        
        // Also like the video
        if (!this.gallery.controlsManager.likedVideos.has(`${this.gallery.currentCategory}-${this.gallery.currentSlide}`)) {
            this.gallery.controlsManager.toggleLike();
        }
    }
}

export default GestureHandler;