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
            // Use seamless scrolling to next category
            const container = document.getElementById('videoContainer');
            const currentGlobalIndex = this.gallery.globalVideoIndex;
            const nextGlobalIndex = currentGlobalIndex + 1;
            
            container.classList.add('transitioning');
            container.scrollTo({
                top: nextGlobalIndex * window.innerHeight,
                behavior: 'smooth'
            });
            
            setTimeout(() => {
                container.classList.remove('transitioning');
            }, 300);
            return true;
        } else {
            // At the end - show rubberband effect
            this.gallery.renderer.showRubberbandEffect(this.gallery.globalVideoIndex, 'down');
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
            // Use seamless scrolling to previous category
            const container = document.getElementById('videoContainer');
            const currentGlobalIndex = this.gallery.globalVideoIndex;
            const prevGlobalIndex = currentGlobalIndex - 1;
            
            container.classList.add('transitioning');
            container.scrollTo({
                top: prevGlobalIndex * window.innerHeight,
                behavior: 'smooth'
            });
            
            setTimeout(() => {
                container.classList.remove('transitioning');
            }, 300);
            return true;
        } else {
            // At the beginning - show rubberband effect
            this.gallery.renderer.showRubberbandEffect(this.gallery.globalVideoIndex, 'up');
            return false;
        }
    }

    async goToNextCategory() {
        if (this.isTransitioning) return false;
        
        const { currentCategory } = this.gallery.getState();
        
        if (currentCategory < this.gallery.getTotalCategories() - 1) {
            // Save current position before switching
            this.gallery.saveCategoryPosition();
            
            // Calculate target global index for next category
            const nextCategory = currentCategory + 1;
            const savedPosition = this.gallery.categorySlidePositions[nextCategory] || 0;
            let targetGlobalIndex = 0;
            
            // Calculate global index for the saved position in next category
            for (let i = 0; i < nextCategory; i++) {
                targetGlobalIndex += this.gallery.getCategoryLength(i);
            }
            targetGlobalIndex += savedPosition;
            
            // Scroll to the saved position in next category
            const container = document.getElementById('videoContainer');
            container.classList.add('transitioning');
            
            container.scrollTo({
                top: targetGlobalIndex * window.innerHeight,
                behavior: 'smooth'
            });
            
            // Remove transition class after animation
            setTimeout(() => {
                container.classList.remove('transitioning');
            }, 300);
            
            console.log(`🔄 Switched to category ${nextCategory}, slide ${savedPosition} (global: ${targetGlobalIndex})`);
            return true;
        } else {
            this.gallery.renderer.showRubberbandEffect(this.gallery.globalVideoIndex, 'right');
            return false;
        }
    }

    async goToPreviousCategory() {
        if (this.isTransitioning) return false;
        
        const { currentCategory } = this.gallery.getState();
        
        if (currentCategory > 0) {
            // Save current position before switching
            this.gallery.saveCategoryPosition();
            
            // Calculate target global index for previous category
            const prevCategory = currentCategory - 1;
            const savedPosition = this.gallery.categorySlidePositions[prevCategory] || 0;
            let targetGlobalIndex = 0;
            
            // Calculate global index for the saved position in previous category
            for (let i = 0; i < prevCategory; i++) {
                targetGlobalIndex += this.gallery.getCategoryLength(i);
            }
            targetGlobalIndex += savedPosition;
            
            // Scroll to the saved position in previous category
            const container = document.getElementById('videoContainer');
            container.classList.add('transitioning');
            
            container.scrollTo({
                top: targetGlobalIndex * window.innerHeight,
                behavior: 'smooth'
            });
            
            // Remove transition class after animation
            setTimeout(() => {
                container.classList.remove('transitioning');
            }, 300);
            
            console.log(`🔄 Switched to category ${prevCategory}, slide ${savedPosition} (global: ${targetGlobalIndex})`);
            return true;
        } else {
            this.gallery.renderer.showRubberbandEffect(this.gallery.globalVideoIndex, 'left');
            return false;
        }
    }

    async transitionToSlide(newSlide) {
        this.isTransitioning = true;
        
        return new Promise((resolve) => {
            // Update slide index
            this.gallery.setCurrentSlide(newSlide);
            
            // Calculate global index and scroll to it
            const container = document.getElementById('videoContainer');
            let globalIndex = 0;
            for (let i = 0; i < this.gallery.currentCategory; i++) {
                globalIndex += this.gallery.getCategoryLength(i);
            }
            globalIndex += newSlide;
            
            // Add transition class
            container.classList.add('transitioning');
            
            container.scrollTo({
                top: globalIndex * window.innerHeight,
                behavior: 'smooth'
            });
            
            // Update UI
            this.gallery.updateProgressDots();
            this.gallery.updateLikeButton();
            this.gallery.resetVideoProgress();
            
            // Wait for transition
            setTimeout(() => {
                this.isTransitioning = false;
                container.classList.remove('transitioning');
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
        
        // Scroll to the correct position
        this.gallery.renderer.scrollToVideo(this.gallery.currentSlide);
        
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