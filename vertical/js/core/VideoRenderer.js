// js/core/VideoRenderer.js - Handles rendering and state management of videos

import VideoProgressManager from './VideoProgressManager.js';
import VideoPlaybackController from './VideoPlaybackController.js';
import AnimationManager from './AnimationManager.js';
import VideoStateManager from './VideoStateManager.js';

class VideoRenderer {
    constructor(gallery) {
        this.gallery = gallery;
        this.renderedVideos = new Map(); // Maps poolId to { video, element, controller }
        this.progressManager = new VideoProgressManager();
        this.animationManager = new AnimationManager();
        this.stateManager = new VideoStateManager();
    }

    renderVideo(poolId, category) {
        if (this.renderedVideos.has(poolId)) {
            return this.renderedVideos.get(poolId).element;
        }

        const element = document.createElement('div');
        element.className = 'video-container';
        element.dataset.poolId = poolId;
        element.dataset.category = category;

        const video = document.createElement('video');
        video.playsInline = true;
        video.muted = this.gallery.settings.muted;
        video.loop = this.gallery.settings.loop;
        video.autoplay = this.gallery.settings.autoplay;

        const videoContent = document.createElement('div');
        videoContent.className = 'video-content';
        
        const title = document.createElement('h2');
        title.className = 'video-title';
        title.textContent = this.gallery.settings.title || '';
        
        const description = document.createElement('p');
        description.className = 'video-description';
        description.textContent = this.gallery.settings.description || '';
        
        videoContent.appendChild(title);
        videoContent.appendChild(description);
        element.appendChild(video);
        element.appendChild(videoContent);

        // Load video source based on category
        if (category === 'real') {
            this.loadRealVideo(video, poolId);
        } else {
            this.loadPlaceholderVideo(video, poolId);
        }

        // Create playback controller
        const controller = new VideoPlaybackController(video, this.progressManager);
        controller.setupEventListeners();

        this.renderedVideos.set(poolId, { video, element, controller });
        return element;
    }

    loadRealVideo(video, poolId) {
        const videoUrl = this.gallery.settings.videoUrl;
        if (videoUrl) {
            video.src = videoUrl;
            video.load();
        }
    }

    loadPlaceholderVideo(video, poolId) {
        // Create canvas for placeholder animation
        const canvas = this.animationManager.createPlaceholderAnimation(poolId);
        video.appendChild(canvas);
        
        // Set fixed duration for placeholder videos
        Object.defineProperty(video, 'duration', {
            get: () => 15 // 15 seconds for placeholder videos
        });
    }

    updateVideoStates(activeElement, direction = null) {
        const activePoolId = activeElement.dataset.poolId;
        const activeVideo = this.renderedVideos.get(activePoolId)?.video;
        
        if (!activeVideo) return;

        // Update states for all videos
        this.renderedVideos.forEach(({ element, video, controller }, poolId) => {
            if (element === activeElement) {
                this.stateManager.setState(element, 'active', direction);
                controller.setTransitioning(true);
                video.play();
            } else if (this.isPreviousVideo(element, activeElement)) {
                this.stateManager.setState(element, 'prev', direction);
                controller.setTransitioning(true);
                video.pause();
                video.currentTime = 0;
            } else if (this.isNextVideo(element, activeElement)) {
                this.stateManager.setState(element, 'next', direction);
                controller.setTransitioning(true);
                video.pause();
                video.currentTime = 0;
            } else {
                element.style.visibility = 'hidden';
                element.style.opacity = '0';
                element.style.zIndex = '0';
                video.pause();
                video.currentTime = 0;
            }
        });

        // Reset transitioning state after animation
        setTimeout(() => {
            this.renderedVideos.forEach(({ element, controller }) => {
                controller.setTransitioning(false);
            });
        }, 300);
    }

    isPreviousVideo(element, activeElement) {
        const elementIndex = Array.from(this.gallery.container.children).indexOf(element);
        const activeIndex = Array.from(this.gallery.container.children).indexOf(activeElement);
        return elementIndex < activeIndex;
    }

    isNextVideo(element, activeElement) {
        const elementIndex = Array.from(this.gallery.container.children).indexOf(element);
        const activeIndex = Array.from(this.gallery.container.children).indexOf(activeElement);
        return elementIndex > activeIndex;
    }

    showRubberbandEffect(element, direction) {
        this.stateManager.showRubberbandEffect(element, direction);
    }

    cleanup(poolId) {
        const videoData = this.renderedVideos.get(poolId);
        if (videoData) {
            videoData.controller.cleanup();
            this.animationManager.cleanup(poolId);
            this.stateManager.cleanup(videoData.element);
            this.renderedVideos.delete(poolId);
        }
    }
}

export default VideoRenderer;