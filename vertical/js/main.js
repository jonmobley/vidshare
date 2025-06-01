// js/main.js - Application entry point

let gallery = null;

// Initialize the gallery when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    gallery = new VirtualVideoGallery();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (gallery) {
        gallery.destroy();
    }
});