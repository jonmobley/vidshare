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
        this.threshold = 80; // Increase threshold for more intentional swipes
        this.categorySwipeThreshold = 60; // Separate threshold for category swipes
        
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
        
        // Scroll events for TikTok-style scrolling
        container.addEventListener('scroll', (e) => {
            this.handleScroll(e);
        }, { passive: true });
        
        // Add horizontal scroll support at the document level for trackpads
        let horizontalScrollTimeout = null;
        container.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 30) {
                e.preventDefault();
                
                // Debounce horizontal scroll
                if (horizontalScrollTimeout) {
                    clearTimeout(horizontalScrollTimeout);
                }
                
                horizontalScrollTimeout = setTimeout(() => {
                    if (e.deltaX > 0) {
                        this.gallery.navigation.goToNextCategory();
                    } else {
                        this.gallery.navigation.goToPreviousCategory();
                    }
                }, 100);
            }
        }, { passive: false });
        
        // Touch events (for horizontal swipes between categories)
        container.addEventListener('touchstart', (e) => {
            this.handleStart(e.touches[0].clientY, e.touches[0].clientX, e);
        }, { passive: false });
        
        container.addEventListener('touchmove', (e) => {
            this.handleMove(e.touches[0].clientY, e.touches[0].clientX, e);
        }, { passive: false });
        
        container.addEventListener('touchend', (e) => {
            this.handleEnd(e);
        }, { passive: false });
        
        // Mouse events (for horizontal swipes between categories)
        container.addEventListener('mousedown', (e) => {
            this.handleStart(e.clientY, e.clientX, e);
        });
        
        container.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.handleMove(e.clientY, e.clientX, e);
            }
        });
        
        container.addEventListener('mouseup', (e) => this.handleEnd(e));
        container.addEventListener('mouseleave', () => this.handleEnd());
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

    handleMove(clientY, clientX, e = null) {
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
            
            // Prevent default for horizontal swipes to avoid interfering with scroll
            if (this.dragDirection === 'horizontal' && e) {
                e.preventDefault();
                console.log('Horizontal swipe detected, preventing default');
            }
        }
        
        // Continue preventing default for horizontal movement
        if (this.dragDirection === 'horizontal' && e) {
            e.preventDefault();
        }
    }

    handleScroll(e) {
        if (this.gallery.navigation.isTransitioning) return;
        
        const container = e.target;
        const scrollTop = container.scrollTop;
        const videoHeight = window.innerHeight;
        const currentVideoIndex = Math.round(scrollTop / videoHeight);
        
        // Update current slide if it changed
        if (currentVideoIndex !== this.gallery.currentSlide) {
            this.gallery.setCurrentSlide(currentVideoIndex);
            this.gallery.updateProgressDots();
            this.gallery.updateLikeButton();
            this.gallery.resetVideoProgress();
            this.gallery.renderer.updateActiveVideo(currentVideoIndex);
            
            if (this.gallery.isPlaying) {
                this.gallery.startVideoProgress();
            }
        }
    }

    handleEnd(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        const deltaY = this.currentY - this.startY;
        const deltaX = this.currentX - this.startX;
        
        console.log('Gesture end:', {
            dragDirection: this.dragDirection,
            deltaX: deltaX,
            deltaY: deltaY,
            threshold: this.categorySwipeThreshold
        });
        
        // Only handle horizontal swipes for category changes
        if (this.dragDirection === 'horizontal' && Math.abs(deltaX) > this.categorySwipeThreshold) {
            console.log('Category swipe triggered:', deltaX > 0 ? 'Previous' : 'Next');
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