class AnimationManager {
    constructor() {
        this.animationStates = new Map();
        this.colorSets = [
            { start: '#667eea', end: '#764ba2' },
            { start: '#f093fb', end: '#f5576c' },
            { start: '#4facfe', end: '#00f2fe' },
            { start: '#43e97b', end: '#38f9d7' },
            { start: '#fa709a', end: '#fee140' },
            { start: '#ff416c', end: '#ff4b2b' },
            { start: '#11998e', end: '#38ef7d' },
            { start: '#7f00ff', end: '#e100ff' }
        ];
    }

    createPlaceholderAnimation(poolId, videoNumber) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        
        // Pick a random color set based on video number for consistency
        const colors = this.colorSets[(videoNumber - 1) % this.colorSets.length];
        
        // Animation variables
        let frameCount = 0;
        
        const animate = () => {
            const state = this.animationStates.get(poolId);
            if (!state || !state.isAnimating) return;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Create animated gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, colors.start);
            gradient.addColorStop(1, colors.end);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add floating shapes with smoother animation
            const shapes = [
                { 
                    type: 'circle', 
                    x: canvas.width * 0.2 + Math.sin(frameCount * 0.005) * 150, 
                    y: canvas.height * 0.3 + Math.cos(frameCount * 0.005) * 80,
                    size: 180,
                    opacity: 0.15,
                    rotation: frameCount * 0.005
                },
                { 
                    type: 'square', 
                    x: canvas.width * 0.7 + Math.cos(frameCount * 0.003) * 120, 
                    y: canvas.height * 0.6 + Math.sin(frameCount * 0.003) * 90,
                    size: 160,
                    opacity: 0.15,
                    rotation: frameCount * 0.003
                },
                { 
                    type: 'triangle', 
                    x: canvas.width * 0.3 + Math.sin(frameCount * 0.004) * 180, 
                    y: canvas.height * 0.7 + Math.cos(frameCount * 0.004) * 100,
                    size: 200,
                    opacity: 0.15,
                    rotation: frameCount * 0.004
                }
            ];
            
            shapes.forEach(shape => {
                ctx.save();
                ctx.globalAlpha = shape.opacity;
                ctx.fillStyle = 'white';
                
                // Move to shape center for rotation
                ctx.translate(shape.x, shape.y);
                ctx.rotate(shape.rotation);
                
                switch(shape.type) {
                    case 'circle':
                        ctx.beginPath();
                        ctx.arc(0, 0, shape.size/2, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    case 'square':
                        ctx.fillRect(-shape.size/2, -shape.size/2, shape.size, shape.size);
                        break;
                    case 'triangle':
                        ctx.beginPath();
                        ctx.moveTo(0, -shape.size/2);
                        ctx.lineTo(-shape.size/2, shape.size/2);
                        ctx.lineTo(shape.size/2, shape.size/2);
                        ctx.closePath();
                        ctx.fill();
                        break;
                }
                ctx.restore();
            });
            
            // Increment frame counter
            frameCount++;
            
            // Request next frame
            requestAnimationFrame(animate);
        };
        
        // Store animation state and function
        this.animationStates.set(poolId, { 
            isAnimating: true,
            animate: animate
        });
        
        // Start animation
        animate();
        
        return canvas;
    }

    setAnimationState(poolId, isAnimating) {
        const state = this.animationStates.get(poolId);
        if (state) {
            state.isAnimating = isAnimating;
        }
    }

    cleanup(poolId) {
        this.animationStates.delete(poolId);
    }
}

export default AnimationManager; 