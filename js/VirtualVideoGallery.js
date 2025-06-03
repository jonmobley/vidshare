import VideoRenderer from './core/VideoRenderer.js';
import VideoPool from './core/VideoPool.js';
import NavigationController from './core/NavigationController.js';
import ControlsManager from './core/ControlsManager.js';
import GestureHandler from './core/GestureHandler.js';
import { videoData } from './data/videoData.js';

class VirtualVideoGallery {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element with id "${containerId}" not found`);
        }

        // Initialize components
        this.videoPool = new VideoPool();
        this.renderer = new VideoRenderer(this);
        this.navigation = new NavigationController(this);
        this.controls = new ControlsManager(this);
        this.gestureHandler = new GestureHandler(this);

        // Settings
        this.settings = {
            muted: true,
            loop: true,
            autoplay: true,
            title: '',
            description: '',
            videoUrl: ''
        };

        // State
        this.currentSlide = 0;
        this.currentCategory = 0;
        this.isPlaying = true;
        this.isTransitioning = false;

        // Initialize
        this.initialize();
    }

    // ... rest of the class implementation ...
}

export default VirtualVideoGallery; 