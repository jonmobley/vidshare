// js/core/ControlsManager.js - Manages all UI controls and interactions

class ControlsManager {
    constructor(gallery) {
        this.gallery = gallery;
        this.likedVideos = new Set();
        this.autoplayMode = 'loop';
        this.isMuted = false;
        
        this.initializeControls();
    }

    initializeControls() {
        // Volume control
        const volumeButton = document.querySelector('.volume-control');
        volumeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleVolume();
        });

        // Like control
        const likeButton = document.querySelector('.like-control');
        likeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLike();
        });

        // Share control
        const shareButton = document.querySelector('.share-control');
        shareButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.shareVideo();
        });

        // Download control
        const downloadButton = document.querySelector('.download-control');
        downloadButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadVideo();
        });

        // Autoplay control
        const autoplayButton = document.querySelector('.autoplay-control');
        autoplayButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleAutoplaySettings();
        });

        // Autoplay options
        const autoplayOptions = document.querySelectorAll('.autoplay-option');
        autoplayOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = option.dataset.mode;
                this.setAutoplayMode(mode);
            });
        });

        // Close autoplay panel on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autoplay-control') && !e.target.closest('.autoplay-settings-panel')) {
                this.closeAutoplaySettings();
            }
        });

        // Category pills
        const categoryPills = document.querySelectorAll('.category-pill');
        categoryPills.forEach((pill) => {
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = parseInt(pill.dataset.category);
                this.gallery.navigation.switchToCategory(category);
            });
        });

        // Initialize category pills fade effect and swipe behavior
        this.initializeCategoryPillsFade();
        this.initializeCategoryPillsSwipe();

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Add desktop mouse controls
        this.initializeDesktopControls();
    }

    handleKeyboard(e) {
        if (this.gallery.navigation.isTransitioning) return;

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.gallery.navigation.goToPrevious();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.gallery.navigation.goToNext();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.gallery.navigation.goToPreviousCategory();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.gallery.navigation.goToNextCategory();
                break;
            case ' ':
                e.preventDefault();
                this.gallery.togglePlayPause();
                break;
            case 'p':
            case 'P':
                this.togglePerformanceStats();
                break;
        }
    }

    initializeDesktopControls() {
        // Mouse wheel navigation
        let wheelTimeout = null;
        document.addEventListener('wheel', (e) => {
            if (this.gallery.navigation.isTransitioning) return;
            
            // Clear any pending wheel timeout
            if (wheelTimeout) {
                clearTimeout(wheelTimeout);
            }
            
            // Debounce wheel events to prevent rapid firing
            wheelTimeout = setTimeout(() => {
                const deltaX = e.deltaX;
                const deltaY = e.deltaY;
                
                // Determine if this is a trackpad gesture (usually smaller delta values)
                const isTrackpad = Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal scroll - category navigation
                    e.preventDefault();
                    if (deltaX > 0) {
                        this.gallery.navigation.goToNextCategory();
                    } else {
                        this.gallery.navigation.goToPreviousCategory();
                    }
                } else {
                    // Vertical scroll - video navigation
                    e.preventDefault();
                    if (deltaY > 0) {
                        this.gallery.navigation.goToNext();
                    } else {
                        this.gallery.navigation.goToPrevious();
                    }
                }
            }, isTrackpad ? 100 : 150); // Longer debounce for mouse wheel
        }, { passive: false });

        // Mouse click navigation
        const videoContainer = document.getElementById('videoContainer');
        if (videoContainer) {
            let clickStartTime = 0;
            let clickStartY = 0;
            
            videoContainer.addEventListener('mousedown', (e) => {
                clickStartTime = Date.now();
                clickStartY = e.clientY;
            });
            
            videoContainer.addEventListener('mouseup', (e) => {
                const clickDuration = Date.now() - clickStartTime;
                const clickDistance = Math.abs(e.clientY - clickStartY);
                
                // Only treat as click if it was quick and didn't move much
                if (clickDuration < 300 && clickDistance < 10) {
                    const rect = videoContainer.getBoundingClientRect();
                    const clickY = e.clientY - rect.top;
                    const centerY = rect.height / 2;
                    
                    if (clickY < centerY) {
                        // Clicked top half - go to previous video
                        this.gallery.navigation.goToPrevious();
                    } else {
                        // Clicked bottom half - go to next video
                        this.gallery.navigation.goToNext();
                    }
                }
            });
        }

        // Additional keyboard shortcuts for desktop
        document.addEventListener('keydown', (e) => {
            if (this.gallery.navigation.isTransitioning) return;
            
            switch(e.key) {
                case 'Home':
                    e.preventDefault();
                    // Go to first video in current category
                    this.gallery.navigation.goToSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    // Go to last video in current category
                    const totalSlides = this.gallery.getTotalSlides();
                    this.gallery.navigation.goToSlide(totalSlides - 1);
                    break;
                case 'PageUp':
                    e.preventDefault();
                    this.gallery.navigation.goToPreviousCategory();
                    break;
                case 'PageDown':
                    e.preventDefault();
                    this.gallery.navigation.goToNextCategory();
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Close any open panels
                    this.closeAutoplaySettings();
                    break;
            }
        });

        // Add visual feedback for desktop users
        this.addDesktopVisualFeedback();
    }

    addDesktopVisualFeedback() {
        // Add hover effects and visual cues for desktop users
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: hover) and (pointer: fine) {
                .video-container {
                    cursor: pointer;
                }
                
                .video-container:hover::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 50%;
                    background: linear-gradient(to bottom, rgba(255,255,255,0.1), transparent);
                    pointer-events: none;
                    z-index: 5;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .video-container:hover::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 50%;
                    background: linear-gradient(to top, rgba(255,255,255,0.1), transparent);
                    pointer-events: none;
                    z-index: 5;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .video-container:hover::before,
                .video-container:hover::after {
                    opacity: 1;
                }
                
                .control-button:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                
                .category-pill:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
            }
        `;
        document.head.appendChild(style);
    }

    toggleVolume() {
        this.isMuted = !this.isMuted;
        const volumeIcon = document.querySelector('.volume-icon');
        const volumeButton = document.querySelector('.volume-control');
        
        if (this.isMuted) {
            volumeIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
            volumeButton.style.opacity = '0.6';
            volumeButton.title = 'Unmute';
        } else {
            volumeIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
            volumeButton.style.opacity = '1';
            volumeButton.title = 'Mute';
        }
    }

    toggleLike() {
        const { currentCategory, currentSlide } = this.gallery.getState();
        const currentVideoId = `${currentCategory}-${currentSlide}`;
        
        const isCurrentlyLiked = this.likedVideos.has(currentVideoId);
        
        if (isCurrentlyLiked) {
            this.likedVideos.delete(currentVideoId);
            this.updateLikeButtonState(false);
        } else {
            this.likedVideos.add(currentVideoId);
            this.updateLikeButtonState(true);
            this.playLikeAnimation();
        }
    }

    updateLikeButtonState(isLiked) {
        const likeButton = document.querySelector('.like-control');
        
        if (isLiked) {
            likeButton.classList.add('liked');
            likeButton.title = 'Unlike';
        } else {
            likeButton.classList.remove('liked');
            likeButton.title = 'Like';
        }
    }

    updateLikeButton() {
        const { currentCategory, currentSlide } = this.gallery.getState();
        const currentVideoId = `${currentCategory}-${currentSlide}`;
        const isLiked = this.likedVideos.has(currentVideoId);
        this.updateLikeButtonState(isLiked);
    }

    playLikeAnimation() {
        const currentElement = this.gallery.renderer.getCurrentVideoElement(this.gallery.currentSlide);
        if (!currentElement) return;

        const likeBurst = document.createElement('div');
        likeBurst.className = 'like-burst';
        likeBurst.innerHTML = '❤️';
        
        currentElement.appendChild(likeBurst);
        
        setTimeout(() => {
            if (likeBurst.parentNode) {
                likeBurst.remove();
            }
        }, 800);
    }

    shareVideo() {
        const shareButton = document.querySelector('.share-control');
        shareButton.style.transform = 'scale(1.2)';
        setTimeout(() => {
            shareButton.style.transform = '';
        }, 200);
        
        // In a real app, this would open share dialog
        console.log('Share video:', this.gallery.getCurrentVideoData());
    }

    downloadVideo() {
        const downloadButton = document.querySelector('.download-control');
        downloadButton.style.transform = 'scale(1.2)';
        setTimeout(() => {
            downloadButton.style.transform = '';
        }, 200);
        
        // In a real app, this would trigger download
        console.log('Download video:', this.gallery.getCurrentVideoData());
    }

    toggleAutoplaySettings() {
        const panel = document.getElementById('autoplaySettingsPanel');
        panel.classList.toggle('show');
    }

    closeAutoplaySettings() {
        const panel = document.getElementById('autoplaySettingsPanel');
        panel.classList.remove('show');
    }

    setAutoplayMode(mode) {
        this.autoplayMode = mode;
        
        const allOptions = document.querySelectorAll('.autoplay-option');
        allOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.mode === mode);
        });
        
        const autoplayButton = document.querySelector('.autoplay-control');
        autoplayButton.title = `Autoplay: ${mode}`;
        
        this.closeAutoplaySettings();
    }

    togglePerformanceStats() {
        const stats = document.getElementById('performanceStats');
        stats.classList.toggle('show');
    }

    initializeCategoryPillsFade() {
        const categoryPillsContainer = document.getElementById('categoryPillsContainer');
        const categoryPills = document.getElementById('categoryPills');
        
        if (!categoryPillsContainer || !categoryPills) return;

        // Function to update fade state based on scroll position
        const updateFadeState = () => {
            const scrollLeft = categoryPills.scrollLeft;
            const maxScrollLeft = categoryPills.scrollWidth - categoryPills.clientWidth;
            
            // Remove all scroll state classes first
            categoryPillsContainer.classList.remove('scrolled-left', 'scrolled-right', 'scrolled-middle');
            
            // Determine scroll state with better thresholds
            const leftThreshold = 15;
            const rightThreshold = 15;
            
            const isScrolledFromLeft = scrollLeft > leftThreshold;
            const isScrolledToRight = scrollLeft >= maxScrollLeft - rightThreshold;
            
            if (isScrolledFromLeft && !isScrolledToRight) {
                // In the middle - show both fades
                categoryPillsContainer.classList.add('scrolled-middle');
            } else if (isScrolledFromLeft) {
                // At the right edge - show only left fade
                categoryPillsContainer.classList.add('scrolled-left', 'scrolled-right');
            } else if (maxScrollLeft > 0) {
                // At the left edge but content extends right - show only right fade
                // This is the default state, no classes needed (CSS handles this)
            }
        };

        // Listen for scroll events on the pills container with throttling
        let scrollTimeout;
        categoryPills.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateFadeState, 10);
        });
        
        // Initial check after a short delay to ensure layout is complete
        setTimeout(updateFadeState, 150);
        
        // Check again on window resize with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateFadeState, 200);
        });
    }

    updateCategoryPills(category) {
        const pills = document.querySelectorAll('.category-pill');
        pills.forEach(pill => {
            pill.classList.toggle('active', parseInt(pill.dataset.category) === category);
        });

        // Scroll active pill into view with smooth animation
        this.scrollActivePillIntoView(category);
    }

    scrollActivePillIntoView(category) {
        const categoryPills = document.getElementById('categoryPills');
        const activePill = document.querySelector(`.category-pill[data-category="${category}"]`);
        
        if (!categoryPills || !activePill) return;

        const pillsRect = categoryPills.getBoundingClientRect();
        const activePillRect = activePill.getBoundingClientRect();
        
        // Calculate if the active pill is outside the visible area
        const isOutsideLeft = activePillRect.left < pillsRect.left + 30; // Account for fade
        const isOutsideRight = activePillRect.right > pillsRect.right - 30; // Account for fade
        
        if (isOutsideLeft || isOutsideRight) {
            // Scroll to center the active pill with some offset for the fade
            const scrollLeft = activePill.offsetLeft - (categoryPills.clientWidth / 2) + (activePill.clientWidth / 2);
            categoryPills.scrollTo({
                left: Math.max(0, scrollLeft),
                behavior: 'smooth'
            });
        }
    }

    initializeCategoryPillsSwipe() {
        const categoryPills = document.getElementById('categoryPills');
        if (!categoryPills) return;

        // Enable smooth momentum scrolling on iOS
        categoryPills.style.webkitOverflowScrolling = 'touch';
        
        // Prevent interference with vertical scrolling
        let isHorizontalScroll = false;
        let startX, startY;

        categoryPills.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isHorizontalScroll = false;
        }, { passive: true });

        categoryPills.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const deltaX = Math.abs(e.touches[0].clientX - startX);
            const deltaY = Math.abs(e.touches[0].clientY - startY);

            // Determine scroll direction on first significant movement
            if (deltaX > 10 || deltaY > 10) {
                isHorizontalScroll = deltaX > deltaY;
                
                // If horizontal scroll, prevent vertical scrolling
                if (isHorizontalScroll) {
                    e.preventDefault();
                }
            }
        }, { passive: false });

        categoryPills.addEventListener('touchend', () => {
            startX = startY = null;
            isHorizontalScroll = false;
        }, { passive: true });
    }

    showDoubleTapHeart() {
        const currentElement = this.gallery.renderer.getCurrentVideoElement(this.gallery.currentSlide);
        if (!currentElement) return;

        const heart = document.createElement('div');
        heart.className = 'double-tap-heart';
        heart.innerHTML = '❤️';
        
        currentElement.appendChild(heart);
        
        setTimeout(() => {
            if (heart.parentNode) {
                heart.remove();
            }
        }, 800);
    }
}

export default ControlsManager;