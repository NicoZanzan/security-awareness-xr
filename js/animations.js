// animations.js - Animation, movement, and UI
console.log('animations.js loading...');

ARExperience.prototype.moveModel = function(modelName, targetPos, speed) {
    // Find the model in the scene
    const model = this.scene.getObjectByName(modelName);
    
    if (!model) {
        console.error(`Model "${modelName}" not found in the scene`);
        return null;
    }
    
    // Use the current position as the starting point
    const startPos = {
        x: model.position.x,
        y: model.position.y,
        z: model.position.z
    };
    
    // Calculate total distance for the movement
    const distance = new THREE.Vector3(
        targetPos.x - startPos.x,
        targetPos.y - startPos.y,
        targetPos.z - startPos.z
    ).length();
    
    // Calculate total duration based on speed (distance units per second)
    const duration = distance / speed;
    
    // Create animation data
    const animationData = {
        startTime: performance.now(),
        duration: duration * 1000, // Convert to milliseconds
        startPos: new THREE.Vector3(startPos.x, startPos.y, startPos.z),
        endPos: new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z),
        active: true,
        onComplete: null
    };
    
    // Store the animation data on the model for reference
    if (!model.userData.animations) {
        model.userData.animations = {};
    }
    model.userData.animations.movement = animationData;
    
    // Helper function for smooth easing (cubic ease-in-out)
    const easeInOutCubic = (x) => {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    };
    
    // Create update function for animation
    const updateMovement = (currentTime) => {
        if (!model || !model.userData.animations || !model.userData.animations.movement) {
            return false; // Stop animation if model or data no longer exists
        }
        
        const moveData = model.userData.animations.movement;
        if (!moveData.active) {
            return false; // Animation has been stopped manually
        }
        
        // Calculate progress (0 to 1)
        const elapsed = currentTime - moveData.startTime;
        let progress = Math.min(elapsed / moveData.duration, 1.0);
        
        // Apply easing for smooth motion
        progress = easeInOutCubic(progress);
        
        // Interpolate position
        model.position.lerpVectors(
            moveData.startPos,
            moveData.endPos,
            progress
        );
        
        // Check if animation is complete
        if (progress >= 1.0) {
            // Set final position precisely
            model.position.copy(moveData.endPos);
            
            // Mark animation as inactive
            moveData.active = false;
            
            // Call completion callback if provided
            if (moveData.onComplete && typeof moveData.onComplete === 'function') {
                moveData.onComplete(model);
            }                
            
            return false; // Stop animation
        }
        
        return true; // Continue animation
    };
    
    // Add the animation to the renderer's animation loop
    if (!this._animationCallbacks) {
        this._animationCallbacks = [];
        
        // Hook into the existing render loop
        const originalRender = this.render.bind(this);
        this.render = (timestamp, frame) => {
            // Run all active animations
            this._animationCallbacks = this._animationCallbacks.filter(callback => callback(performance.now()));
            
            // Call the original render method
            originalRender(timestamp, frame);
        };
    }
    
    // Add our movement animation to the callback list
    this._animationCallbacks.push(updateMovement);
            
    // Return object with control methods
    return {
        // Stop the animation
        stop: () => {
            if (model.userData.animations && model.userData.animations.movement) {
                model.userData.animations.movement.active = false;
            }
        },
        
        // Set completion callback
        onComplete: (callback) => {
            if (model.userData.animations && model.userData.animations.movement) {
                model.userData.animations.movement.onComplete = callback;
            }
            return this; // For chaining
        }
    };
};

ARExperience.prototype.playModelAnimation = function(modelName, animationName, loop = false) {
    // Use the model stored as class property
    const model = this[modelName];
    
    if (!model) {
        console.error(`Model "${modelName}" not found as class property`);
        return null;
    }    
    
    // Get the animation from class property (the stored animation clip)
    const animation = this[animationName];
    
    if (!animation) {
        console.error(`Animation "${animationName}" not found as class property`);
        console.log('Available animation properties:', Object.keys(this).filter(key => 
            key.includes('Animation') || key.includes('animation')
        ));
        return null;
    }
    
    console.log(`Found animation "${animationName}":`, animation);
    console.log(`Animation name: ${animation.name}, duration: ${animation.duration}`);
    
    // Create a mixer if it doesn't exist
    if (!model.userData) {
        model.userData = {};
    }
    
    if (!model.userData.mixer) {
        model.userData.mixer = new THREE.AnimationMixer(model);
        this.mixers.push(model.userData.mixer);
        console.log(`Created new mixer for model "${modelName}"`);
    }
    
    // Create and play the animation action
    const action = model.userData.mixer.clipAction(animation);
    
    // Set loop mode
    action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
    action.clampWhenFinished = true; // Keep final pose when animation ends
    
    // Stop any existing actions on this mixer (optional)
    model.userData.mixer.stopAllAction();
    
    // Play the animation
    action.reset();
    action.play();
    
    console.log(`✅ Playing animation "${animationName}" on model "${modelName}"`);
    console.log(`Loop: ${loop}, Duration: ${animation.duration}s`);
    
    return action;
};


ARExperience.prototype.idleMove = function(model, timestamp, amplitude = 0.05, speed = 0.001, axis = 'y') {
    if (!model || !model.visible) return;
    
    // Store the original position if not yet stored
    const positionKey = `original${axis.toUpperCase()}`;
    if (!model.userData[positionKey]) {
        model.userData[positionKey] = model.position[axis];
    }
    
    // Move along the specified axis in a sine wave pattern
    const originalPos = model.userData[positionKey];
    model.position[axis] = originalPos + Math.sin(timestamp * speed) * amplitude;
};

ARExperience.prototype.playback3D = function(modelAnimationPairs, audioFileNames, offsetMs = 0) {
    console.log('Starting combined animations and audio playback...');

    // 1. Play animations for each specified model
    modelAnimationPairs.forEach(pair => {
        // Destructuring only modelName and animationName
        const { modelName, animationName } = pair;
        
        // Check if the model exists as a class property
        if (this[modelName]) {
            // `playModelAnimation` expects the string name of the model and the animation.
            // Since 'loop' is removed from the input, playModelAnimation will use its default (false).
            this.playModelAnimation(modelName, animationName); 
        } else {
            console.warn(`Model '${modelName}' not found. Animation '${animationName}' will be skipped.`);
        }
    });

    // 2. Play audio files with the specified offset
    setTimeout(() => {
        audioFileNames.forEach(audioName => {
            const audio = this[audioName]; // Access the audio property of the class
            
            // Check if it's a valid HTML Audio object
            if (audio instanceof Audio) {
                audio.play().catch(error => {
                    // Log error if playback fails (e.g., due to browser autoplay policies)
                    console.error(`Error playing audio '${audioName}':`, error);
                });
                console.log(`Audio '${audioName}' started.`);
            } else {
                console.warn(`Audio file '${audioName}' not found or is not a valid Audio object. Playback will be skipped.`);
            }
        });
    }, offsetMs);

    console.log('Request for animations and audio playback initiated.');
};

ARExperience.prototype.createTextPlate = function(text, options = {}) {
    // Extract options with defaults
    const {
        width = 0.4,
        height = 0.15,
        distance = 0.5,
        yOffset = 0,
        backgroundColor = 0x222222,
        backgroundOpacity = 0.7,
        textColor = 0xffffff,
        fontSize = 32,
        padding = 0.02
    } = options;

    // Check camera is initialized
    if (!this.camera) {
        console.error("Cannot create text plate: camera not initialized");
        return null;
    }
    
    // Setup UI group if needed
    if (!this.uiGroup) {
        this.uiGroup = new THREE.Group();
        if (this.scene && !this.camera.parent) {
            this.scene.add(this.camera);
        }
        this.camera.add(this.uiGroup);
    }

    // Clean up any existing text plate
    if (this.textPlate) {
        this.uiGroup.remove(this.textPlate);
        if (this.textPlate.material?.map) {
            this.textPlate.material.map.dispose();
        }
        this.disposeObject(this.textPlate);
        this.textPlate = null;
    }
    
    // Create canvas with high resolution
    const pixelRatio = Math.min(window.devicePixelRatio, 3);
    const baseWidth = 1024;
    const baseHeight = 392;
    
    const canvas = document.createElement('canvas');
    canvas.width = baseWidth * pixelRatio;
    canvas.height = baseHeight * pixelRatio;
    
    const context = canvas.getContext('2d');
    context.scale(pixelRatio, pixelRatio);
    
    // Setup text rendering properties
    const scaledFontSize = fontSize * 1.5;
    context.font = `500 ${scaledFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    // Helper functions for text wrapping and layout
    const calculateWrappedText = (ctx, txt, maxWidth) => {
        if (!txt) return [];
        const words = txt.split(' ');
        let lines = [];
        let currentLine = '';
        
        for (let n = 0; n < words.length; n++) {
            const testLine = currentLine + words[n] + ' ';
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                lines.push(currentLine.trim());
                currentLine = words[n] + ' ';
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine.trim() !== '') {
            lines.push(currentLine.trim());
        }
        return lines;
    };
    
    const getMaxLineWidth = (ctx, lines) => {
        return Math.max(...lines.map(line => ctx.measureText(line).width));
    };
    
    const drawRoundedRect = (ctx, x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };
    
    // Layout calculation
    const paddingX = 40;
    const paddingY = 25;
    const cornerRadius = 20;
    const lineHeight = scaledFontSize * 1.1;
    const maxTextWidth = baseWidth - (paddingX * 2);
    
    // Wrap text and calculate dimensions
    const wrappedLines = calculateWrappedText(context, text, maxTextWidth);
    const totalTextHeight = wrappedLines.length * lineHeight;
    
    const bgWidth = Math.min(
        baseWidth - 20,
        getMaxLineWidth(context, wrappedLines) + (paddingX * 2)
    );
    const bgHeight = totalTextHeight + (paddingY * 2);
    
    const bgX = (baseWidth - bgWidth) / 2;
    const bgY = (baseHeight - bgHeight) / 2;
    
    // Draw background
    const r = (backgroundColor >> 16) & 0xff;
    const g = (backgroundColor >> 8) & 0xff;
    const b = backgroundColor & 0xff;
    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`;
    drawRoundedRect(context, bgX, bgY, bgWidth, bgHeight, cornerRadius);
    context.fill();
    
    // Draw text
    context.shadowColor = 'rgba(0, 0, 0, 0.3)';
    context.shadowBlur = 4;
    context.shadowOffsetY = 1;
    
    const textR = (textColor >> 16) & 0xff;
    const textG = (textColor >> 8) & 0xff;
    const textB = textColor & 0xff;
    context.fillStyle = `rgba(${textR}, ${textG}, ${textB}, 1.0)`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    const textX = baseWidth / 2;
    let textY = bgY + paddingY + (lineHeight / 2);
    
    wrappedLines.forEach(line => {
        context.fillText(line, textX, Math.round(textY));
        textY += lineHeight;
    });
    
    context.shadowColor = 'rgba(0, 0, 0, 0)';
    context.shadowBlur = 0;
    
    // Create Three.js objects
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    texture.encoding = THREE.sRGBEncoding;
    texture.generateMipmaps = false;
    
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        premultipliedAlpha: true
    });
    
    // Create and position mesh
    const aspectRatio = canvas.width / canvas.height;
    const adjustedHeight = width / aspectRatio;
    const geometry = new THREE.PlaneGeometry(width, adjustedHeight);
    this.textPlate = new THREE.Mesh(geometry, material);
    this.textPlate.position.set(0, yOffset, -distance);
    this.uiGroup.add(this.textPlate);
    
    // Store references
    this.textPlate.userData.texture = texture;
    this.textPlate.userData.text = text;
    
    // Add method to update text
    this.textPlate.updateText = (newText) => {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.scale(pixelRatio, pixelRatio);
        
        const wrappedLines = calculateWrappedText(context, newText, maxTextWidth);
        const totalTextHeight = wrappedLines.length * lineHeight;
        
        const bgWidth = Math.min(
            baseWidth - 20,
            getMaxLineWidth(context, wrappedLines) + (paddingX * 2)
        );
        const bgHeight = totalTextHeight + (paddingY * 2);
        
        const bgX = (baseWidth - bgWidth) / 2;
        const bgY = (baseHeight - bgHeight) / 2;
        
        // Redraw background
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`;
        drawRoundedRect(context, bgX, bgY, bgWidth, bgHeight, cornerRadius);
        context.fill();
        
        // Redraw text
        context.shadowColor = 'rgba(0, 0, 0, 0.3)';
        context.shadowBlur = 4;
        context.shadowOffsetY = 1;
        
        context.font = `500 ${scaledFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = `rgba(${textR}, ${textG}, ${textB}, 1.0)`;
        
        let textY = bgY + paddingY + (lineHeight / 2);
        wrappedLines.forEach(line => {
            context.fillText(line, textX, Math.round(textY));
            textY += lineHeight;
        });
        
        context.shadowColor = 'rgba(0, 0, 0, 0)';
        context.shadowBlur = 0;
        
        // Update texture
        texture.needsUpdate = true;
        this.textPlate.userData.text = newText;
    };
    
    return this.textPlate;
};

ARExperience.prototype.togglePause = function(audio, textPlate = null) {
    if (audio.paused) {
        audio.play();
        if (textPlate) {
            textPlate.updateText('Playing audio');
        }
    } else {
        audio.pause();
        if (textPlate) {
            textPlate.updateText('Audio paused – click again to resume');
        }
    }
};