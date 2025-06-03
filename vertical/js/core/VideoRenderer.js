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

    renderVisibleVideos(currentSlide, totalSlides, videoData, currentCategory, direction = null) {
        const container = document.getElementById('videoWrapper');
        if (!container) {
            console.error('Video container not found');
            return;
        }

        // Clear existing videos
        container.innerHTML = '';
        this.renderedVideos.clear();

        // Render current video and adjacent ones for smooth scrolling
        const videosToRender = [
            currentSlide - 1,
            currentSlide,
            currentSlide + 1
        ].filter(index => index >= 0 && index < totalSlides);

        videosToRender.forEach(index => {
            const videoInfo = videoData[index];
            const element = this.createVideoElement(videoInfo, index, currentCategory);
            container.appendChild(element);
            this.renderedVideos.set(index, element);
        });

        // Position videos
        this.positionVideos(currentSlide, direction);
    }

    createVideoElement(videoInfo, index, currentCategory) {
        const slide = document.createElement('div');
        slide.className = 'video-slide';
        slide.dataset.index = index;
        slide.dataset.category = currentCategory;

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

    positionVideos(currentSlide, direction = null) {
        this.renderedVideos.forEach((element, index) => {
            const offset = (index - currentSlide) * 100;
            element.style.transform = `translateY(${offset}vh)`;
            
            if (index === currentSlide) {
                element.classList.add('active');
                element.style.zIndex = 10;
            } else {
                element.classList.remove('active');
                element.style.zIndex = 1;
            }
        });
    }

    getCurrentVideoElement(index) {
        return this.renderedVideos.get(index);
    }

    getRenderedCount() {
        return this.renderedVideos.size;
    }

    updateVideoStates(currentSlide, direction = null) {
        this.positionVideos(currentSlide, direction);
        
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

    cleanup() {
        this.renderedVideos.clear();
        const container = document.getElementById('videoWrapper');
        if (container) {
            container.innerHTML = '';
        }
    }
}

export default VideoRenderer;