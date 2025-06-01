// js/core/NavigationController.js - Handles navigation between videos and categories

class NavigationController {
    constructor(gallery) {
        this.gallery = gallery;
        this.isTransitioning = false;
        this.transitionDuration = 300;
        this.transitionPromise = null;
        this.wheelTimeout = null;
    }

    async goToNext() {
        if (this.isTransitioning) return false;
        
        const { currentSlide, totalSlides, currentCategory } = this.gallery.getState();
        
        if (currentSlide < totalSlides - 1) {
            await this.transitionToSlide(currentSlide + 1);
            return true;
        } else if (currentCategory < this.gallery.getTotalCategories() - 1) {
            // Move to next category's first video with continuous scroll
            const nextCategory = currentCategory + 1;
            await this.switchToCategory(nextCategory, 0, 'next');
            return true;
        } else {
            // At the end
            this.gallery.renderer.showRubberbandEffect(currentSlide, 'down');
            return false;
        }
    }

    async goToPrevious() {
        if (this.isTransitioning) return false;
        
        const { currentSlide, currentCategory } = this.gallery.getState();
        
        if (currentSlide > 0) {
            await this.transitionToSlide(currentSlide - 1);
            return true;
        } else if (currentCategory > 0) {
            // Move to previous category's last video with continuous scroll
            const prevCategory = currentCategory - 1;
            const prevCategoryLength = this.gallery.getCategoryLength(prevCategory);
            await this.switchToCategory(prevCategory, prevCategoryLength - 1, 'prev');
            return true;
        } else {
            // At the beginning
            this.gallery.renderer.showRubberbandEffect(currentSlide, 'up');
            return false;
        }
    }

    async goToNextCategory() {
        if (this.isTransitioning) return false;
        
        const { currentCategory } = this.gallery.getState();
        
        if (currentCategory < this.gallery.getTotalCategories() - 1) {
            // Save current position before switching
            this.gallery.saveCategoryPosition();
            // Switch to next category instantly
            await this.switchToCategory(currentCategory + 1, null, 'right');
            return true;
        } else {
            this.gallery.renderer.showRubberbandEffect(this.gallery.currentSlide, 'right');
            return false;
        }
    }

    async goToPreviousCategory() {
        if (this.isTransitioning) return false;
        
        const { currentCategory } = this.gallery.getState();
        
        if (currentCategory > 0) {
            // Save current position before switching
            this.gallery.saveCategoryPosition();
            // Switch to previous category instantly
            await this.switchToCategory(currentCategory - 1, null, 'left');
            return true;
        } else {
            this.gallery.renderer.showRubberbandEffect(this.gallery.currentSlide, 'left');
            return false;
        }
    }

    async transitionToSlide(newSlide) {
        this.isTransitioning = true;
        
        return new Promise((resolve) => {
            // Update slide index
            this.gallery.setCurrentSlide(newSlide);
            
            // Determine direction for vertical scrolling
            const direction = newSlide > this.gallery.currentSlide ? 'down' : 'up';
            
            // Render if needed
            this.gallery.renderVideos(direction);
            
            // Update UI
            this.gallery.updateProgressDots();
            this.gallery.updateLikeButton();
            this.gallery.resetVideoProgress();
            
            // Wait for transition
            setTimeout(() => {
                this.isTransitioning = false;
                if (this.gallery.isPlaying) {
                    this.gallery.startVideoProgress();
                }
                resolve();
            }, this.transitionDuration);
        });
    }

    async switchToCategory(categoryIndex, slideIndex = null, direction = null) {
        if (categoryIndex === this.gallery.currentCategory && slideIndex === null) {
            return;
        }
        
        this.isTransitioning = true;
        
        // Save current position
        this.gallery.saveCategoryPosition();
        
        // Clear current videos
        this.gallery.renderer.clearAllVideos();
        
        // Update to new category
        this.gallery.setCurrentCategory(categoryIndex);
        
        if (slideIndex !== null) {
            this.gallery.setCurrentSlide(slideIndex);
        } else {
            // Restore the last viewed position in this category
            this.gallery.restoreCategoryPosition();
        }
        
        // Render new videos immediately
        this.gallery.renderVideos(direction);
        
        // Update UI
        this.gallery.updateCategoryUI();
        this.gallery.updateProgressDots();
        this.gallery.updateLikeButton();
        this.gallery.resetVideoProgress();
        
        // Start video progress if playing
        if (this.gallery.isPlaying) {
            this.gallery.startVideoProgress();
        }
        
        // Reset transition state after a short delay
        setTimeout(() => {
            this.isTransitioning = false;
        }, 50);
    }

    handleWheel(deltaX, deltaY) {
        if (this.isTransitioning) return;
        
        // Clear any pending wheel timeout
        if (this.wheelTimeout) {
            clearTimeout(this.wheelTimeout);
        }
        
        // Debounce wheel events
        this.wheelTimeout = setTimeout(() => {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal scroll
                if (deltaX > 0) {
                    this.goToNextCategory();
                } else {
                    this.goToPreviousCategory();
                }
            } else {
                // Vertical scroll
                if (deltaY > 0) {
                    this.goToNext();
                } else {
                    this.goToPrevious();
                }
            }
        }, 50); // 50ms debounce
    }
}

export default NavigationController;