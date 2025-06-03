// js/core/VideoRenderer.js - Handles rendering and state management of videos

import VideoProgressManager from './VideoProgressManager.js';
import VideoPlaybackController from './VideoPlaybackController.js';
import AnimationManager from './AnimationManager.js';
import VideoStateManager from './VideoStateManager.js';

class VideoRenderer {
    constructor(videoPool, gallery) {
        this.videoPool = videoPool;
        this.gallery = gallery;
        this.renderedVideos = new Map(); // Maps index to element
        this.progressManager = new VideoProgressManager();
        this.animationManager = new AnimationManager();
        this.stateManager = new VideoStateManager();
    }

    renderAllCategories() {
        const container = document.getElementById('videoWrapper');
        if (!container) {
            console.error('Video container not found');
            return;
        }

        // Only render once - create seamless scroll experience
        if (container.children.length === 0) {
            container.innerHTML = '';
            this.renderedVideos.clear();
            
            // Import video data
            import('/vertical/js/data/videoData.js').then(module => {
                const videoData = module.videoData;
                let globalIndex = 0;
                
                // Render all categories in sequence for seamless scrolling
                Object.keys(videoData).forEach(categoryIndex => {
                    const categoryData = videoData[categoryIndex];
                    console.log(`Rendering category ${categoryIndex} with ${categoryData.length} videos`);
                    categoryData.forEach((videoInfo, localIndex) => {
                        const element = this.createVideoElement(videoInfo, globalIndex, categoryIndex, localIndex);
                        container.appendChild(element);
                        this.renderedVideos.set(globalIndex, element);
                        console.log(`Created video element: global ${globalIndex}, category ${categoryIndex}, local ${localIndex}, title: ${videoInfo.title}`);
                        globalIndex++;
                    });
                });
                
                // Store category boundaries for scroll detection
                this.calculateCategoryBoundaries(videoData);
            });
        }
    }

    calculateCategoryBoundaries(videoData) {
        this.categoryBoundaries = [];
        let globalIndex = 0;
        
        Object.keys(videoData).forEach(categoryIndex => {
            const categoryData = videoData[categoryIndex];
            this.categoryBoundaries.push({
                category: parseInt(categoryIndex),
                startIndex: globalIndex,
                endIndex: globalIndex + categoryData.length - 1,
                length: categoryData.length
            });
            globalIndex += categoryData.length;
        });
        
        console.log('Category boundaries:', this.categoryBoundaries);
    }

    getCurrentCategoryFromGlobalIndex(globalIndex) {
        for (const boundary of this.categoryBoundaries) {
            if (globalIndex >= boundary.startIndex && globalIndex <= boundary.endIndex) {
                return {
                    category: boundary.category,
                    localIndex: globalIndex - boundary.startIndex
                };
            }
        }
        return { category: 0, localIndex: 0 };
    }

    renderVisibleVideos(currentSlide, totalSlides, videoData, currentCategory, direction = null) {
        // Use the new seamless rendering approach
        this.renderAllCategories();
        
        // Update active states
        this.updateActiveVideo(currentSlide);
    }

    createVideoElement(videoInfo, globalIndex, categoryIndex, localIndex) {
        const slide = document.createElement('div');
        slide.className = 'video-slide';
        slide.dataset.globalIndex = globalIndex;
        slide.dataset.category = categoryIndex;
        slide.dataset.localIndex = localIndex;

        // Create iframe to load the HTML video content
        const iframe = document.createElement('iframe');
        iframe.src = videoInfo.videoUrl || '/vertical/videos/categories/videos/video-1.html'; // fallback
        iframe.className = 'video-iframe';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('frameborder', '0');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        // Create overlay with video info
        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';
        
        const title = document.createElement('h2');
        title.className = 'video-title';
        title.textContent = videoInfo.title;
        
        const description = document.createElement('p');
        description.className = 'video-description';
        description.textContent = videoInfo.description;
        
        overlay.appendChild(title);
        overlay.appendChild(description);
        
        slide.appendChild(iframe);
        slide.appendChild(overlay);

        // Setup iframe communication for video control
        iframe.addEventListener('load', () => {
            this.setupVideoControl(iframe, videoInfo);
        });

        return slide;
    }

    setupVideoControl(iframe, videoInfo) {
        // Send playback settings to the iframe
        const settings = {
            type: 'playbackSettings',
            autoplay: this.gallery.settings.autoplay,
            loop: this.gallery.settings.loop,
            muted: this.gallery.settings.muted
        };
        
        try {
            iframe.contentWindow.postMessage(settings, '*');
        } catch (error) {
            console.warn('Could not communicate with iframe:', error);
        }
    }

    updateActiveVideo(currentSlide) {
        this.renderedVideos.forEach((element, index) => {
            if (index === currentSlide) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        });
    }

    scrollToVideo(videoIndex) {
        const container = document.getElementById('videoContainer');
        const videoElement = this.renderedVideos.get(videoIndex);
        
        if (container && videoElement) {
            const targetScrollTop = videoIndex * window.innerHeight;
            container.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
            
            // Ensure precise positioning after a short delay
            setTimeout(() => {
                if (Math.abs(container.scrollTop - targetScrollTop) > 5) {
                    container.scrollTop = targetScrollTop;
                }
            }, 350);
        }
    }

    getCurrentVideoElement(index) {
        return this.renderedVideos.get(index);
    }

    getRenderedCount() {
        return this.renderedVideos.size;
    }

    updateVideoStates(currentSlide, direction = null) {
        this.updateActiveVideo(currentSlide);
        
        // Update video playback states via iframe communication
        this.renderedVideos.forEach((element, index) => {
            const iframe = element.querySelector('.video-iframe');
            if (iframe && iframe.contentWindow) {
                const isActive = index === currentSlide;
                const settings = {
                    type: 'playbackSettings',
                    autoplay: isActive && this.gallery.settings.autoplay,
                    loop: this.gallery.settings.loop,
                    muted: this.gallery.settings.muted
                };
                
                try {
                    iframe.contentWindow.postMessage(settings, '*');
                } catch (error) {
                    console.warn('Could not communicate with iframe:', error);
                }
            }
        });
    }

    clearAllVideos() {
        this.renderedVideos.clear();
        const container = document.getElementById('videoWrapper');
        if (container) {
            container.innerHTML = '';
            delete container.dataset.category;
        }
    }

    cleanup() {
        this.clearAllVideos();
    }
}

export default VideoRenderer;