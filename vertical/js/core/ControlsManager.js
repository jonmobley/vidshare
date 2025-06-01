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

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
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

    updateCategoryPills(category) {
        const pills = document.querySelectorAll('.category-pill');
        pills.forEach(pill => {
            pill.classList.toggle('active', parseInt(pill.dataset.category) === category);
        });
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