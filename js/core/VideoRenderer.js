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

    // ... rest of the class implementation ...
}

export default VideoRenderer; 