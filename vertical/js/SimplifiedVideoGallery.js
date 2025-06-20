// js/SimplifiedVideoGallery.js - Simplified, robust TikTok-style video gallery

import { videoData } from './data/videoData.js';

class SimplifiedVideoGallery {
    constructor() {
        // Simple state management
        this.videos = this.flattenVideoData();
        this.currentIndex = 0;
        this.isPlaying = true;
        this.isMuted = false;
        this.currentCategory = 0;
        
        // Touch/gesture state
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.isDragging = false;
        this.threshold = 50;
        
        // Initialize
        this.init();
    }

    flattenVideoData() {
        // Create a flat array of all videos with category info
        const flatVideos = [];
        Object.keys(videoData).forEach(categoryIndex => {
            videoData[categoryIndex].forEach((video, localIndex) => {
                flatVideos.push({
                    ...video,
                    category: parseInt(categoryIndex),
                    localIndex: localIndex,
                    globalIndex: flatVideos.length,
                    categoryName: this.getCategoryName(parseInt(categoryIndex))
                });
            });
        });
        return flatVideos;
    }

    getCategoryName(categoryIndex) {
        const names = ['For You', 'Gaming', 'Music', 'Tacos', 'Magic', 'Puppets'];
        return names[categoryIndex] || `Category ${categoryIndex}`;
    }

    init() {
        this.createVideoElements();
        this.setupControls();
        this.setupGestures();
        this.setupKeyboard();
        this.updateUI();
        
        console.log(`✅ SimplifiedVideoGallery initialized with ${this.videos.length} videos`);
    }

    createVideoElements() {
        const container = document.getElementById('videoWrapper');
        if (!container) {
            console.error('Video wrapper not found');
            return;
        }

        container.innerHTML = '';
        
        this.videos.forEach((video, index) => {
            const slide = document.createElement('div');
            slide.className = 'video-slide';
            slide.dataset.index = index;
            slide.dataset.category = video.category;
            
            slide.innerHTML = `
                <div class="video-content">
                    <iframe 
                        src="${video.path}" 
                        frameborder="0" 
                        allowfullscreen
                        loading="${index < 3 ? 'eager' : 'lazy'}"
                        title="${video.title}"
                    ></iframe>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
                    <p class="video-description">${video.description}</p>
                    <span class="video-category">${video.categoryName}</span>
                </div>
            `;
            
            container.appendChild(slide);
        });

        // Set initial position
        this.scrollToVideo(0, false);
    }

    setupControls() {
        // Volume control
        const volumeBtn = document.querySelector('.volume-control');
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }

        // Like control
        const likeBtn = document.querySelector('.like-control');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.toggleLike());
        }

        // Share control
        const shareBtn = document.querySelector('.share-control');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareVideo());
        }

        // Download control
        const downloadBtn = document.querySelector('.download-control');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadVideo());
        }

        // Category pills
        const categoryPills = document.querySelectorAll('.category-pill');
        categoryPills.forEach(pill => {
            pill.addEventListener('click', () => {
                const categoryIndex = parseInt(pill.dataset.category);
                this.switchToCategory(categoryIndex);
            });
        });

        // Back arrow
        const backBtn = document.getElementById('backArrow');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }
    }

    setupGestures() {
        const container = document.getElementById('videoContainer');
        if (!container) return;

        // Touch events
        container.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
            this.touchStartX = e.touches[0].clientX;
            this.isDragging = true;
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
        }, { passive: false });

        container.addEventListener('touchend', (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;

            const touchEndY = e.changedTouches[0].clientY;
            const touchEndX = e.changedTouches[0].clientX;
            const deltaY = this.touchStartY - touchEndY;
            const deltaX = this.touchStartX - touchEndX;

            // Determine swipe direction
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > this.threshold) {
                // Vertical swipe
                if (deltaY > 0) {
                    this.goToNext();
                } else {
                    this.goToPrevious();
                }
            } else if (Math.abs(deltaX) > this.threshold) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.switchToNextCategory();
                } else {
                    this.switchToPreviousCategory();
                }
            }
        }, { passive: true });

        // Mouse wheel
        let wheelTimeout;
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            if (wheelTimeout) return;
            wheelTimeout = setTimeout(() => {
                wheelTimeout = null;
            }, 300);

            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                // Vertical scroll
                if (e.deltaY > 0) {
                    this.goToNext();
                } else {
                    this.goToPrevious();
                }
            } else {
                // Horizontal scroll
                if (e.deltaX > 0) {
                    this.switchToNextCategory();
                } else {
                    this.switchToPreviousCategory();
                }
            }
        }, { passive: false });

        // Click to play/pause
        container.addEventListener('click', (e) => {
            if (!e.target.closest('.controls-container') && 
                !e.target.closest('.category-navigation')) {
                this.togglePlayPause();
            }
        });
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.goToPrevious();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.goToNext();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.switchToPreviousCategory();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.switchToNextCategory();
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'p':
                case 'P':
                    this.togglePerformanceStats();
                    break;
            }
        });
    }

    goToNext() {
        if (this.currentIndex < this.videos.length - 1) {
            this.currentIndex++;
            this.scrollToVideo(this.currentIndex);
            this.updateUI();
        }
    }

    goToPrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.scrollToVideo(this.currentIndex);
            this.updateUI();
        }
    }

    switchToCategory(categoryIndex) {
        // Find first video in the category
        const firstVideoInCategory = this.videos.find(v => v.category === categoryIndex);
        if (firstVideoInCategory) {
            this.currentIndex = firstVideoInCategory.globalIndex;
            this.currentCategory = categoryIndex;
            this.scrollToVideo(this.currentIndex);
            this.updateUI();
        }
    }

    switchToNextCategory() {
        const maxCategory = Math.max(...this.videos.map(v => v.category));
        if (this.currentCategory < maxCategory) {
            this.switchToCategory(this.currentCategory + 1);
        }
    }

    switchToPreviousCategory() {
        if (this.currentCategory > 0) {
            this.switchToCategory(this.currentCategory - 1);
        }
    }

    scrollToVideo(index, smooth = true) {
        const container = document.getElementById('videoContainer');
        if (!container) return;

        container.scrollTo({
            top: index * window.innerHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    updateUI() {
        this.updateProgressDots();
        this.updateCategoryPills();
        this.updatePerformanceStats();
        
        // Update current category based on current video
        if (this.videos[this.currentIndex]) {
            this.currentCategory = this.videos[this.currentIndex].category;
        }
    }

    updateProgressDots() {
        const indicator = document.getElementById('progressIndicator');
        if (!indicator) return;

        indicator.innerHTML = '';
        
        // Show simplified progress for many videos
        if (this.videos.length > 50) {
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar-simplified';
            progressBar.innerHTML = `
                <div class="progress-fill" style="height: ${((this.currentIndex + 1) / this.videos.length) * 100}%"></div>
                <div class="progress-text">${this.currentIndex + 1}/${this.videos.length}</div>
            `;
            indicator.appendChild(progressBar);
        } else {
            // Show individual dots
            for (let i = 0; i < this.videos.length; i++) {
                const dot = document.createElement('div');
                dot.className = `progress-dot ${i === this.currentIndex ? 'active' : ''}`;
                indicator.appendChild(dot);
            }
        }
    }

    updateCategoryPills() {
        const pills = document.querySelectorAll('.category-pill');
        pills.forEach(pill => {
            const categoryIndex = parseInt(pill.dataset.category);
            pill.classList.toggle('active', categoryIndex === this.currentCategory);
        });
    }

    updatePerformanceStats() {
        const stats = document.getElementById('performanceStats');
        if (!stats) return;

        const currentVideo = this.videos[this.currentIndex];
        document.getElementById('renderedCount').textContent = this.videos.length;
        document.getElementById('totalCount').textContent = this.videos.length;
        document.getElementById('currentIndex').textContent = `${this.currentIndex + 1} (${currentVideo ? currentVideo.categoryName : 'Unknown'})`;
        document.getElementById('memoryUsage').textContent = '~5';
        document.getElementById('poolStatus').textContent = 'N/A';
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        // Note: Since we're using iframes, we can't directly control video playback
        // This would need to be handled by the iframe content
        console.log(this.isPlaying ? 'Playing' : 'Paused');
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        // Update volume icon
        const volumeIcon = document.querySelector('.volume-icon path');
        if (volumeIcon && this.isMuted) {
            volumeIcon.setAttribute('d', 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z');
        } else if (volumeIcon) {
            volumeIcon.setAttribute('d', 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z');
        }
        console.log(this.isMuted ? 'Muted' : 'Unmuted');
    }

    toggleLike() {
        const currentVideo = this.videos[this.currentIndex];
        if (!currentVideo) return;

        currentVideo.liked = !currentVideo.liked;
        
        // Update like button appearance
        const likeBtn = document.querySelector('.like-control');
        if (likeBtn) {
            likeBtn.classList.toggle('liked', currentVideo.liked);
        }
        
        console.log(`${currentVideo.liked ? 'Liked' : 'Unliked'}: ${currentVideo.title}`);
    }

    shareVideo() {
        const currentVideo = this.videos[this.currentIndex];
        if (!currentVideo) return;

        if (navigator.share) {
            navigator.share({
                title: currentVideo.title,
                text: currentVideo.description,
                url: window.location.href + `#video-${currentVideo.id}`
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            const url = window.location.href + `#video-${currentVideo.id}`;
            navigator.clipboard.writeText(url).then(() => {
                console.log('Video URL copied to clipboard');
            }).catch(console.error);
        }
    }

    downloadVideo() {
        const currentVideo = this.videos[this.currentIndex];
        if (!currentVideo) return;

        // Open the video page in a new tab for download
        window.open(currentVideo.path, '_blank');
    }

    togglePerformanceStats() {
        const stats = document.getElementById('performanceStats');
        if (stats) {
            stats.classList.toggle('show');
        }
    }

    goBack() {
        // Navigate back in browser history or to a default page
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    }

    // Handle scroll events to update current index
    handleScroll() {
        const container = document.getElementById('videoContainer');
        if (!container) return;

        const scrollTop = container.scrollTop;
        const videoHeight = window.innerHeight;
        const newIndex = Math.round(scrollTop / videoHeight);
        
        if (newIndex !== this.currentIndex && newIndex >= 0 && newIndex < this.videos.length) {
            this.currentIndex = newIndex;
            this.updateUI();
        }
    }

    destroy() {
        // Cleanup event listeners if needed
        console.log('SimplifiedVideoGallery destroyed');
    }
}

export default SimplifiedVideoGallery;
