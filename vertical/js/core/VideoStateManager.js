class VideoStateManager {
    constructor() {
        this.states = new Map(); // Maps element to its state
    }

    setState(element, state, direction = null) {
        // Remove all state classes
        element.classList.remove('rubberband-up', 'rubberband-down', 
                               'rubberband-left', 'rubberband-right',
                               'category-exit-left', 'category-exit-right',
                               'category-enter-left', 'category-enter-right');
        
        // Check if this is a horizontal category switch
        const isHorizontalSwitch = direction === 'left' || direction === 'right';
        
        // Set appropriate state
        element.dataset.state = state;
        
        switch(state) {
            case 'active':
                element.style.transform = 'translateY(0)';
                element.style.opacity = '1';
                element.style.visibility = 'visible';
                element.style.zIndex = '10';
                break;
            case 'prev':
                element.style.transform = 'translateY(-100vh)';
                element.style.opacity = '1';
                element.style.visibility = 'visible';
                element.style.zIndex = '9';
                break;
            case 'next':
                element.style.transform = 'translateY(100vh)';
                element.style.opacity = '1';
                element.style.visibility = 'visible';
                element.style.zIndex = '9';
                break;
        }
        
        // Set transition
        if (isHorizontalSwitch) {
            element.style.transition = 'none';
        } else {
            element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        }
        
        // Force reflow
        void element.offsetWidth;
        
        // Store state
        this.states.set(element, { state, direction });
    }

    showRubberbandEffect(element, direction) {
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
        }, 300);
    }

    setTransitioning(element, isTransitioning) {
        element.dataset.isTransitioning = isTransitioning;
    }

    getState(element) {
        return this.states.get(element);
    }

    cleanup(element) {
        this.states.delete(element);
    }
}

export default VideoStateManager; 