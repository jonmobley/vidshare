// js/main.js - Application entry point

import VirtualVideoGallery from './VirtualVideoGallery.js';

let gallery = null;

// Initialize the gallery when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        gallery = new VirtualVideoGallery();
    } catch (error) {
        console.error('Error initializing gallery:', error);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (gallery) {
        gallery.destroy();
    }
});