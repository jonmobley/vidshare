// js/main-simplified.js - Application entry point for simplified gallery

import SimplifiedVideoGallery from './SimplifiedVideoGallery.js';

let gallery = null;

// Initialize the gallery when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        gallery = new SimplifiedVideoGallery();
        
        // Add scroll listener for seamless navigation
        const container = document.getElementById('videoContainer');
        if (container) {
            let scrollTimeout;
            container.addEventListener('scroll', () => {
                if (scrollTimeout) clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    gallery.handleScroll();
                }, 100);
            }, { passive: true });
        }
        
        console.log('✅ Simplified video gallery initialized');
    } catch (error) {
        console.error('❌ Error initializing gallery:', error);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (gallery) {
        gallery.destroy();
    }
});

// Handle visibility changes (tab switching, app backgrounding)
document.addEventListener('visibilitychange', () => {
    if (gallery) {
        if (document.hidden) {
            // Pause when hidden
            console.log('📱 App hidden, pausing playback');
        } else {
            // Resume when visible
            console.log('📱 App visible, resuming playback');
        }
    }
});

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    if (gallery) {
        setTimeout(() => {
            // Refresh layout after orientation change
            gallery.scrollToVideo(gallery.currentIndex, false);
        }, 100);
    }
});

// Export for debugging
window.gallery = gallery;
