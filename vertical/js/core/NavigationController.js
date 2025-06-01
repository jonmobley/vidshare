// js/core/NavigationController.js - Handles navigation between videos and categories

class NavigationController {
    constructor(gallery) {
        this.gallery = gallery;
        this.isTransitioning = false;
        this.transitionDuration = 400;
        this.transitionPromise = null;
    }

    async goToNext() {
        if (this.isTransitioning) return false;
        
        const { currentSlide, totalSlides, currentCategory } = this.gallery.getState();
        
        if (currentSlide < totalSlides - 1) {
            await this.transitionToSlide(currentSlide + 1);
            return true;
        } else if (currentCategory < this.gallery.getTotalCategories() - 1) {
            // Move to next category
            await this.switchToCategory(currentCategory + 1, 0);
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
            // Move to previous category's last video
            const prevCategoryLength = this.gallery.getCategoryLength(currentCategory - 1);
            await this.switchToCategory(currentCategory - 1, prevCategoryLength - 1);
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
            await this.switchToCategory(currentCategory + 1);
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
            await this.switchToCategory(currentCategory - 1);
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
            
            // Render if needed
            this.gallery.renderVideos();
            
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

    async switchToCategory(categoryIndex, slideIndex = null) {
        if (categoryIndex === this.gallery.currentCategory && slideIndex === null) {
            return;
        }
        
        this.isTransitioning = true;
        
        return new Promise((resolve) => {
            // Save current position
            this.gallery.saveCategoryPosition();
            
            // Clear current videos
            this.gallery.renderer.clearAllVideos();
            
            // Update to new category
            this.gallery.setCurrentCategory(categoryIndex);
            
            if (slideIndex !== null) {
                this.gallery.setCurrentSlide(slideIndex);
            } else {
                this.gallery.restoreCategoryPosition();
            }
            
            // Render new videos
            this.gallery.renderVideos();
            
            // Update UI
            this.gallery.updateCategoryUI();
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

    handleWheel(deltaX, deltaY) {
        if (this.isTransitioning) return;
        
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
    }
}