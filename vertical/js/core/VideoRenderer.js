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
        this.categoryBoundaries = []; // Initialize empty boundaries
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
            import('../data/videoData.js').then(module => {
                const videoData = module.videoData;
                let globalIndex = 0;
                
                console.log('🎬 Starting video rendering for all categories...');
                
                // Render all categories in sequence for seamless scrolling
                Object.keys(videoData).forEach(categoryIndex => {
                    const categoryData = videoData[categoryIndex];
                    console.log(`📂 Rendering category ${categoryIndex} (${this.getCategoryName(categoryIndex)}) with ${categoryData.length} videos`);
                    
                    categoryData.forEach((videoInfo, localIndex) => {
                        const element = this.createVideoElement(videoInfo, globalIndex, categoryIndex, localIndex);
                        container.appendChild(element);
                        this.renderedVideos.set(globalIndex, element);
                        console.log(`✅ Video ${globalIndex}: ${videoInfo.title} (cat ${categoryIndex})`);
                        globalIndex++;
                    });
                });
                
                console.log(`🎯 Total videos rendered: ${globalIndex}`);
                
                // Store category boundaries for scroll detection
                this.calculateCategoryBoundaries(videoData);
                
                // Setup scroll container for seamless scrolling
                this.setupScrollContainer(container);
                
                // Notify gallery that rendering is complete
                if (this.gallery.onRenderingComplete) {
                    this.gallery.onRenderingComplete();
                }
            }).catch(error => {
                console.error('❌ Error loading video data:', error);
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
        // Safety check in case boundaries aren't initialized yet
        if (!this.categoryBoundaries || this.categoryBoundaries.length === 0) {
            console.warn('Category boundaries not yet initialized, defaulting to category 0');
            return { category: 0, localIndex: globalIndex };
        }
        
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
        iframe.src = videoInfo.path || 'videos/categories/foryou/video-1.html'; // fallback
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
        
        // Create expandable description container
        const descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'video-description-container';
        
        const description = document.createElement('p');
        description.className = 'video-description';
        description.textContent = videoInfo.description;
        
        // Create expanded overlay for full description
        const expandedOverlay = document.createElement('div');
        expandedOverlay.className = 'description-expanded-overlay';
        expandedOverlay.style.display = 'none';
        
        const expandedContent = document.createElement('div');
        expandedContent.className = 'description-expanded-content';
        
        const expandedTitle = document.createElement('h2');
        expandedTitle.className = 'video-title expanded';
        expandedTitle.textContent = videoInfo.title;
        
        const expandedDescription = document.createElement('p');
        expandedDescription.className = 'video-description expanded';
        expandedDescription.textContent = videoInfo.description;
        
        expandedContent.appendChild(expandedTitle);
        expandedContent.appendChild(expandedDescription);
        expandedOverlay.appendChild(expandedContent);
        
        descriptionContainer.appendChild(description);
        
        overlay.appendChild(title);
        overlay.appendChild(descriptionContainer);
        slide.appendChild(expandedOverlay);
        
        slide.appendChild(iframe);
        slide.appendChild(overlay);

        // Setup description click interaction
        this.setupDescriptionInteraction(description, expandedOverlay, videoInfo);

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

    setupDescriptionInteraction(description, expandedOverlay, videoInfo) {
        // Check if description needs truncation (more than ~50 characters or multiple lines)
        const maxLength = 50;
        const originalText = videoInfo.description;
        
        if (originalText.length > maxLength) {
            // Truncate and add ellipsis
            const truncatedText = originalText.substring(0, maxLength).trim() + '...';
            description.textContent = truncatedText;
            description.dataset.isTruncated = 'true';
            description.dataset.originalText = originalText;
            
            // Make description clickable
            description.style.cursor = 'pointer';
            description.style.pointerEvents = 'auto';
            
            // Add click handler
            description.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDescriptionExpanded(expandedOverlay);
            });
        } else {
            description.dataset.isTruncated = 'false';
        }
        
        // Setup close handler for expanded overlay
        expandedOverlay.addEventListener('click', (e) => {
            if (e.target === expandedOverlay) {
                this.toggleDescriptionExpanded(expandedOverlay);
            }
        });
    }

    toggleDescriptionExpanded(expandedOverlay) {
        const isExpanded = expandedOverlay.style.display !== 'none';
        
        if (isExpanded) {
            // Close expanded view
            expandedOverlay.classList.add('closing');
            setTimeout(() => {
                expandedOverlay.style.display = 'none';
                expandedOverlay.classList.remove('closing');
            }, 300);
        } else {
            // Open expanded view
            expandedOverlay.style.display = 'flex';
            // Trigger animation
            requestAnimationFrame(() => {
                expandedOverlay.classList.add('opening');
                setTimeout(() => {
                    expandedOverlay.classList.remove('opening');
                }, 300);
            });
        }
    }

    updateActiveVideo(globalVideoIndex) {
        this.renderedVideos.forEach((element, index) => {
            const elementGlobalIndex = parseInt(element.dataset.globalIndex);
            if (elementGlobalIndex === globalVideoIndex) {
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

    getCategoryName(index) {
        const names = {
            0: "For You",
            1: "Gaming", 
            2: "Music",
            3: "Videos"
        };
        return names[index] || `Category ${index}`;
    }

    setupScrollContainer(container) {
        // Ensure proper scroll behavior
        const videoContainer = document.getElementById('videoContainer');
        if (videoContainer) {
            videoContainer.style.height = '100vh';
            videoContainer.style.overflowY = 'auto';
            videoContainer.style.scrollSnapType = 'y mandatory';
            console.log('📱 Scroll container configured');
        }
    }

    showRubberbandEffect(slideIndex, direction) {
        const element = this.getCurrentVideoElement(slideIndex);
        if (!element) {
            console.warn('Could not find video element for rubberband effect');
            return;
        }
        
        // Remove any existing rubberband classes
        element.classList.remove('rubberband-up', 'rubberband-down', 
                               'rubberband-left', 'rubberband-right');
        
        // Force reflow
        void element.offsetWidth;
        
        // Add new rubberband class
        element.classList.add(`rubberband-${direction}`);
        
        // Remove after animation
        setTimeout(() => {
            element.classList.remove(`rubberband-${direction}`);
        }, 400);
        
        console.log(`🔄 Rubberband effect: ${direction} on slide ${slideIndex}`);
    }
}

export default VideoRenderer;