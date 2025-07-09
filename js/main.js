class ARExperience {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.session = null;
        
        // Models
        this.startButtonModel = null;
        this.pauseButtonModel = null;
        this.nextButtonModel = null;
        this.wendy = null;
        this.mendy = null;
        
        // Audio
        this.wendyAudio_1 = null;
        
        // State
        this.experienceStarted = false;
        this.isXRActive = false;
        this.isPaused = false;
        
        // For managing interactive objects
        this.modelInteractions = new Map();
        
        this.init();
    }
    
    async init() {        
        // hide end page initially
        document.getElementById('endPage').style.display = 'none';
    
        // Add start button event listener
        document.getElementById('startButton').addEventListener('click', async () => {
            try {
                console.log('Starting AR experience...');
                
                // Hide landing page, show AR view
                document.getElementById('landingPage').style.display = 'none';
                document.getElementById('arView').style.display = 'block';
                
                // -------- THREE.JS INITIALIZATION --------
                // Scene
                this.scene = new THREE.Scene();
                
                // Camera - responsive setup
                this.camera = new THREE.PerspectiveCamera(
                    70, // FOV - good for mobile
                    window.innerWidth / window.innerHeight,
                    0.01, // Near plane - close objects
                    100   // Far plane
                );
                
                // Renderer - mobile optimized
                const canvas = document.getElementById('arCanvas');
                this.renderer = new THREE.WebGLRenderer({ 
                    canvas: canvas, 
                    antialias: true,
                    alpha: true,
                    precision: 'mediump' // Better mobile performance
                });
                
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                this.renderer.outputEncoding = THREE.sRGBEncoding;
                this.renderer.shadowMap.enabled = false; // Disable shadows for performance
                
                // Comprehensive lighting for all devices
                const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
                this.scene.add(ambientLight);
                
                const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
                directionalLight.position.set(1, 1, 1);
                this.scene.add(directionalLight);
                
                const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
                directionalLight2.position.set(-1, -1, -1);
                this.scene.add(directionalLight2);
                
                // -------- RESOURCE LOADING --------
                // Load models and audio (unchanged)
                await this.loadResources();
                
                // -------- WEBXR INITIALIZATION --------
                this.renderer.xr.enabled = true;
                
                // Set up either WebXR or fallback controls
                await this.setupControls();
                
                // Start render loop
                this.renderer.setAnimationLoop((timestamp, frame) => {
                    this.render(timestamp, frame);
                });
                
                // Start the interactive scene
                this.startScene();
                
            } catch (error) {
                console.error('Failed to start:', error);
                alert('Failed to start AR experience: ' + error.message);
            }
        });    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    }

    // New helper method to load resources
    async loadResources() {
        const loader = new THREE.GLTFLoader();
        console.log('Loading models...');
        
        // Internal helper function to load GLB models
        const loadGLB = (path) => {
            return new Promise((resolve, reject) => {
                loader.load(
                    path,
                    (gltf) => {
                        console.log(`Loaded: ${path}`);
                        resolve(gltf);
                    },
                    (progress) => {
                        console.log(`Loading ${path}: ${(progress.loaded / progress.total * 100)}%`);
                    },
                    (error) => {
                        console.error(`Failed to load ${path}:`, error);
                        reject(error);
                    }
                );
            });
    };
    
    try {
        // Load button
        const buttonGLB = await loadGLB('./assets/models/button.glb');
        this.startButtonModel = buttonGLB.scene;
        this.scaleModel(this.startButtonModel, 1.0);
        
        this.createPauseButtonPlaceholder();
        
        // Load next button
        const nextGLB = await loadGLB('./assets/models/next.glb');
        this.nextButtonModel = nextGLB.scene;
        this.scaleModel(this.nextButtonModel, 1.0);
        
        // Load Wendy
        const wendyGLB = await loadGLB('./assets/models/wendy.glb');
        this.wendy = wendyGLB.scene;
        this.scaleModel(this.wendy, 1.0);
        
        // Load Mendy
        const mendyGLB = await loadGLB('./assets/models/mendy.glb');
        this.mendy = mendyGLB.scene;
        this.scaleModel(this.mendy, 1.0);
        
        console.log('All models loaded successfully');
        
        } catch (error) {
            console.error('Model loading failed:', error);
            throw error;
        }
        
        // Load audio
        this.wendyAudio_1 = new Audio('./assets/audio/wendy_1.mp3');
        this.wendyAudio_1.preload = 'auto';

        this.wendyAudio_2 = new Audio('./assets/audio/wendy_2.mp3');
        this.wendyAudio_2.preload = 'auto';
        
        this.wendyAudio_1.addEventListener('ended', () => {
        console.log('Wendy audio finished');
        this.endWendySpeech();
    });
    }

    // Helper method to setup controls
   async setupControls() {
    // 1. Check for WebXR support
    if (navigator.xr) {
        try {
            // Check for immersive AR or VR support
            const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
            const isVRSupported = await navigator.xr.isSessionSupported('immersive-vr');
            
            if (isARSupported || isVRSupported) {
                console.log(`Starting immersive ${isARSupported ? 'AR' : 'VR'} session`);
                const sessionType = isARSupported ? 'immersive-ar' : 'immersive-vr';
                
                // Request XR session with needed features
                this.session = await navigator.xr.requestSession(sessionType, {
                    requiredFeatures: ['local'],
                    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'hit-test']
                });
                
                await this.renderer.xr.setSession(this.session);
                this.isXRActive = true;
                
                // Set up XR controller (moved from setupInteraction)
                this.controller = this.renderer.xr.getController(0);
                this.scene.add(this.controller);
                
                // Set up the controller's select event for interaction
                this.controller.addEventListener('select', (event) => {
                    console.log("XR Select event received");
                    
                    // Set up raycaster from controller
                    const tempMatrix = new THREE.Matrix4();
                    tempMatrix.identity().extractRotation(this.controller.matrixWorld);
                    
                    const controllerRaycaster = new THREE.Raycaster();
                    controllerRaycaster.ray.origin.setFromMatrixPosition(this.controller.matrixWorld);
                    controllerRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
                    
                    // Check for interactive object intersections
                    this.checkInteractions(controllerRaycaster);
                });
                
                // Adjust for VR if needed (particularly for Meta Quest)
                if (isVRSupported && !isARSupported) {
                    this.adjustForVR();
                }
                
            } else {
                console.log('XR not supported, using fallback 3D mode');
                this.setupFallbackCameraControls();
            }
            
        } catch (error) {
            console.log('WebXR failed, using fallback:', error.message);
            this.setupFallbackCameraControls();
        }
    } else {
        console.log('WebXR not available, using fallback mode');
        this.setupFallbackCameraControls();
    }
    
    // Set up non-XR interaction (mouse/touch)
    // (This would replace the duplicate code in makeModelClickable)
    if (!this.modelInteractionHandlerActive) {
        this.modelInteractionHandlerActive = true;
        
        // Set up shared raycaster for interactions
        this.interactionRaycaster = new THREE.Raycaster();
        this.interactionPointer = new THREE.Vector2();
        
        // Track pointer for click vs. drag detection
        let pointerStartX = 0;
        let pointerStartY = 0;
        let isDragging = false;
        
        // Set up pointer event handlers
        const handlePointerDown = (event) => {
            pointerStartX = event.clientX;
            pointerStartY = event.clientY;
            isDragging = false;
        };
        
        const handlePointerMove = (event) => {
            if (!isDragging) {
                const deltaX = Math.abs(event.clientX - pointerStartX);
                const deltaY = Math.abs(event.clientY - pointerStartY);
                if (deltaX > 5 || deltaY > 5) {
                    isDragging = true;
                }
            }
        };
        
        const handlePointerUp = (event) => {
            if (!isDragging) {
                this.interactionPointer.x = (event.clientX / window.innerWidth) * 2 - 1;
                this.interactionPointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
                this.interactionRaycaster.setFromCamera(this.interactionPointer, this.camera);
                this.checkInteractions(this.interactionRaycaster);
            }
        };
        
        // Add event listeners
        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        
        // Store handlers for cleanup
        this.interactionHandlers = {
            pointerDown: handlePointerDown,
            pointerMove: handlePointerMove,
            pointerUp: handlePointerUp
        };
        
        // Add helper method for checking interactions
        this.checkInteractions = (raycaster) => {
            if (!this.modelInteractions || this.modelInteractions.size === 0) return;
            
            // Get all active, visible interactive models
            const interactiveModels = Array.from(this.modelInteractions.keys())
                .filter(model => {
                    const data = this.modelInteractions.get(model);
                    return data.active && model.visible && (!data.once || !data.triggered);
                });
            
            if (interactiveModels.length === 0) return;
            
            // Check for intersections
            const intersects = raycaster.intersectObjects(interactiveModels, true);
            
            if (intersects.length > 0) {
                const intersect = intersects[0];
                let currentObj = intersect.object;
                
                while (currentObj) {
                    if (this.modelInteractions.has(currentObj)) {
                        const data = this.modelInteractions.get(currentObj);
                        if (data.active && (!data.once || !data.triggered)) {
                            console.log(`Model clicked: ${currentObj.name || 'unnamed'}`);
                            data.callback(currentObj, intersect);
                            
                            if (data.once) {
                                data.triggered = true;
                            }
                        }
                        break;
                    }
                    currentObj = currentObj.parent;
                }
            }
        };
    }
}


    // Simplified fallback camera controls
    setupFallbackCameraControls() {
        // For non-AR devices - position camera for good view
        console.log('Setting up camera controls for non-AR mode');
        this.camera.position.set(0, 0, 0);
        
        // Add mouse/touch camera rotation controls
        let isPointerDown = false;
        let pointerX = 0;
        let pointerY = 0;
        
        const onPointerMove = (event) => {
            if (!isPointerDown) return;
            
            const deltaX = event.clientX - pointerX;
            const deltaY = event.clientY - pointerY;
            
            this.camera.rotation.y -= deltaX * 0.005;
            this.camera.rotation.x -= deltaY * 0.005;
            this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation.x));
            
            pointerX = event.clientX;
            pointerY = event.clientY;
        };
        
        document.addEventListener('pointerdown', (event) => {
            isPointerDown = true;
            pointerX = event.clientX;
            pointerY = event.clientY;
        });
        
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', () => { isPointerDown = false; });
    } 

    startScene() {  
        
        console.log('Start scene started ...');
        // Initial text plate creation
        this.createTextPlate('Start!', {
            backgroundColor: 0x3366cc,
            width: 0.5,
            height: 0.2,
            yOffset: -0.29  // Slightly below center
        });    
        
        // Start button
        this.startButtonModel.position.set(0, -1, -1.0); // 1m in front
        this.scene.add(this.startButtonModel);
        
        // Wendy model
        this.wendy.visible = false;
        this.wendy.position.set(0, 0, -2.0); // 2m in front
        this.scene.add(this.wendy);
        this.wendy.name = 'wendy';

        //this.playModelAnimation("wendy", 'Anim_0', true);
        this.listAllModelsAndAnimations();

        // Mendy model
        this.mendy.visible = false;
        this.mendy.position.set(0, 0, -1); // 1m behind
        this.scene.add(this.mendy);
        
        // Pause button
        this.pauseButtonModel.visible = false;
        this.pauseButtonModel.position.set(0, -1.5, -1.0); // Top right, 1m in front
        this.scene.add(this.pauseButtonModel);
        
        // Next button - fix variable name from nextModel to nextButtonModel
        this.nextButtonModel.visible = false;
        this.nextButtonModel.position.set(0.5, -1, -1.0); // Center-bottom, 1m in front
        this.scene.add(this.nextButtonModel);

        this.makeModelClickable(this.startButtonModel, () => {
            console.log('Start button clicked!');
            this.firstScene();
        });      
        
        console.log('Scene ready - should be visible');
    }    
    
    firstScene() {
        this.experienceStarted = true;
        console.log('First scene started ...');
            
        // Hide start button
        this.startButtonModel.visible = false;
        
        // Show Wendy and pause button
        this.wendy.visible = true;
        this.pauseButtonModel.visible = true;
        this.wendy.rotation.y = -Math.PI/1.5;

        this.makeModelClickable(this.pauseButtonModel, () => {
            console.log('Pause button clicked!');
            this.togglePause();
        });

        this.makeModelClickable(this.wendy, (model) => {
            console.log('Wendy was clicked!');
            this.wendyAudio_2.play();
            const movement = this.moveModel("wendy", 
                {x: 1, y: 0, z: -3},  // Target position
                0.7                   // Speed (units per second)
            );            
            
            if (this.textPlate) {
                this.textPlate.updateText("Wendy says: Hey, this tickles!!");
            }            
        });

        this.makeModelClickable(this.mendy, (model) => {
            console.log('Mendy was clicked!');
            // You could add additional effects when Mendy is clicked
            if (this.textPlate) {
                this.textPlate.updateText("Mendy says: Leave me alone ...");
            }     
        });

        this.makeModelClickable(this.nextButtonModel, () => {
            console.log('Next button clicked!');
            this.handleNext();
        });     
      
        
        if (this.textPlate) {
            this.textPlate.updateText('Wendy is talking about cybersecurity. Click the pause button or press P to pause.');
          }

        // Play audio
        this.wendyAudio_1.play().catch(error => {
            console.error('Audio play failed:', error);
            // Fallback timer
            setTimeout(() => this.endWendySpeech(), 10000);
        });
    }
  
    playModelAnimation(modelName, animationName, loop = false) {
        // Find the model in the scene
        const model = this.scene.getObjectByName(modelName);
        
        if (!model) {
            console.error(`Model "${modelName}" not found in the scene`);
            return null;
        }
        
        // Check if model has animations
        if (!model.animations || model.animations.length === 0) {
            console.error(`Model "${modelName}" has no animations`);
            return null;
        }
        
        // Log all available animations
        console.log(`Available animations for "${modelName}":`);
        model.animations.forEach((anim, index) => {
            console.log(`${index}: ${anim.name}`);
        });
        
        // Find the requested animation
        const animation = model.animations.find(anim => anim.name === animationName);
        
        if (!animation) {
            console.error(`Animation "${animationName}" not found in model "${modelName}"`);
            return null;
        }
        
        // Ensure animation mixer exists
        if (!model.mixer) {
            model.mixer = new THREE.AnimationMixer(model);
            
            // Add mixer to update list if we have an update loop
            if (this.mixers) {
                this.mixers.push(model.mixer);
            }
        }
        
        // Create and play the animation action
        const action = model.mixer.clipAction(animation);
        
        // Set loop mode
        if (loop) {
            action.loop = THREE.LoopRepeat;
        } else {
            action.loop = THREE.LoopOnce;
            action.clampWhenFinished = true;
        }
        
        // Stop any current actions
        model.mixer.stopAllAction();
        
        // Play the animation
        action.reset();
        action.play();
        
        console.log(`Playing animation "${animationName}" on model "${modelName}" (loop: ${loop})`);
        
        return action;
    }

    listAllModelsAndAnimations() {
        // Create a results object to store information about all models
        const results = {
            modelCount: 0,
            models: []
        };
        
        // Helper function to process an object and its children
        const processObject = (object) => {
            // Check if the object is a model with animations
            if (object.animations && object.animations.length > 0) {
                const modelInfo = {
                    name: object.name || "Unnamed Model",
                    uuid: object.uuid,
                    animationCount: object.animations.length,
                    animations: []
                };
                
                // Log model information
                console.log(`Model: "${modelInfo.name}" (${modelInfo.animationCount} animations)`);
                
                // Process and log all animations
                object.animations.forEach((anim, index) => {
                    const animInfo = {
                        index: index,
                        name: anim.name || `Unnamed Animation ${index}`,
                        duration: anim.duration
                    };
                    
                    console.log(`  Animation ${index}: "${animInfo.name}" (${animInfo.duration}s)`);
                    modelInfo.animations.push(animInfo);
                });
                
                // Add model to results
                results.models.push(modelInfo);
                results.modelCount++;
            }
            
            // Process children
            if (object.children && object.children.length > 0) {
                object.children.forEach(child => processObject(child));
            }
        };
        
        // Start processing from the scene root
        if (this.scene) {
            console.log("Scanning scene for models with animations...");
            processObject(this.scene);
            
            console.log(`Found ${results.modelCount} models with animations in the scene`);
            if (results.modelCount === 0) {
                console.log("No models with animations found in the scene");
            }
        } else {
            console.error("Scene is not available");
        }
        
        return results;
    }    

    createPauseButtonPlaceholder() {
        // Create a simple pause button placeholder (two vertical bars)
        const group = new THREE.Group();
        
        const barGeometry = new THREE.BoxGeometry(0.03, 0.1, 0.02);
        const barMaterial = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
        
        const bar1 = new THREE.Mesh(barGeometry, barMaterial);
        bar1.position.x = -0.02;
        group.add(bar1);
        
        const bar2 = new THREE.Mesh(barGeometry, barMaterial);
        bar2.position.x = 0.02;
        group.add(bar2);
        
        this.pauseButtonModel = group;
        console.log('Pause button placeholder created');
    } 
    
    moveModel(modelName, targetPos, speed) {
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
                
                console.log(`Model "${modelName}" movement complete`);
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
        
        console.log(`Starting movement of model "${modelName}" from (${startPos.x}, ${startPos.y}, ${startPos.z}) to (${targetPos.x}, ${targetPos.y}, ${targetPos.z}) at speed ${speed} units/second`);
        
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
    }  

    loadAudio() {       
        this.wendyAudio_1.addEventListener('ended', () => {
            console.log('Wendy audio finished');
            this.endWendySpeech();
        });      
    }   

    makeModelClickable(model, callback, once = false) {
        if (!model || typeof callback !== 'function') {
            console.error('makeModelClickable requires a valid model and callback function');
            return null;
        }
        
        // Ensure the model interactions map exists
        if (!this.modelInteractions) {
            this.modelInteractions = new Map();
        }
        
        // Register the model with its callback
        this.modelInteractions.set(model, {
            callback,
            once,
            active: true,
            triggered: false
        });   

        
        // Return methods to control this interactive model
        return {
            disable: () => {
                if (this.modelInteractions.has(model)) {
                    const data = this.modelInteractions.get(model);
                    data.active = false;
                }
            },
            enable: () => {
                if (this.modelInteractions.has(model)) {
                    const data = this.modelInteractions.get(model);
                    data.active = true;
                }
            },
            remove: () => {
                if (this.modelInteractions) {
                    this.modelInteractions.delete(model);
                }
            }
        };
    }   
        
    scaleModel(model, targetSize) {
        // Auto-scale models to reasonable size
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        
        if (maxDimension > 0) {
            const scale = targetSize / maxDimension;
            model.scale.setScalar(scale);
        }
        
        console.log(`Model scaled to: ${model.scale.x}`);
    }  

    createTextPlate(text, options = {}) {
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
    }     

    togglePause() {
        if (this.isPaused) {
            // Resume
            this.wendyAudio_1.play();
            this.isPaused = false;
            
            // document.getElementById('arInstructions').textContent = 
            //     'Wendy is talking about cybersecurity. Click the pause button or press P to pause.';
            
            console.log('Audio resumed');
        } else {
            // Pause
            this.wendyAudio_1.pause();
            this.isPaused = true;
            
            // document.getElementById('arInstructions').textContent = 
            //     'Audio paused. Click the pause button or press P to resume.';

            if (this.textPlate) {
                this.textPlate.updateText('Wendy is talking about cybersecurity. Click the pause button or press P to pause.');
              }
            
            console.log('Audio paused');
        }
    }
    
    endWendySpeech() {
        console.log('Wendy finished speaking');
        
        // Hide pause button
        this.pauseButtonModel.visible = false;
        this.isPaused = false;
        
        if (this.textPlate) {
            this.textPlate.updateText('Turn around! Someone has been watching...');
        }       
        
        setTimeout(() => {
            console.log('Revealing Mendy');
            
            this.mendy.visible = true;
            
            // Show next button
            this.nextButtonModel.visible = true;
            
            if (this.textPlate) {
                this.textPlate.updateText('Mendy was spying on you all along! Stay aware of your surroundings. Click Next to continue.');
            }
        }, 2000);
    }    
    
    handleNext() {
        console.log('Next button clicked - experience complete!');
        
        // Hide all models
        this.wendy.visible = false;
        this.mendy.visible = false;
        this.nextButtonModel.visible = false;
        
        // Update instructions
        // document.getElementById('arInstructions').textContent = 
        //     'Cybersecurity experience complete! Thank you for staying aware.';
        
        if (this.textPlate) {
            this.textPlate.updateText('Cybersecurity experience complete! Thank you for staying aware.');
            }
        
        // Optional: Return to landing page after a delay
        setTimeout(() => {
            this.resetScene();
        }, 3000);
    }
    
    resetScene() {
        console.log('Resetting experience - clearing everything');

        // Clean up interactions
        if (this.modelInteractions) {
            this.modelInteractions.clear();
        }

        // Remove interaction handlers
        if (this.interactionHandlers) {
            document.removeEventListener('pointerdown', this.interactionHandlers.pointerDown);
            document.removeEventListener('pointermove', this.interactionHandlers.pointerMove);
            document.removeEventListener('pointerup', this.interactionHandlers.pointerUp);
            
            if (this.controller && this.interactionHandlers.xrSelect) {
                console.log("Removing XR controller event listener");
                this.controller.removeEventListener('select', this.interactionHandlers.xrSelect);
            }
            
            this.interactionHandlers = null;
            this.modelInteractionHandlerActive = false;
        }
        
        // Stop any audio that might be playing
        if (this.wendyAudio_1) {
            this.wendyAudio_1.pause();
            this.wendyAudio_1.currentTime = 0;
        }
        
        if (this.wendyAudio_2) {
            this.wendyAudio_2.pause();
            this.wendyAudio_2.currentTime = 0;
        }
        
        // Remove text plate from camera or scene before clearing everything
        if (this.textPlate) {
            if (this.uiGroup && this.textPlate.parent === this.uiGroup) {
                this.uiGroup.remove(this.textPlate);
            } else if (this.scene) {
                this.scene.remove(this.textPlate);
            }
            
            // Dispose text plate resources
            if (this.textPlate.material && this.textPlate.material.map) {
                this.textPlate.material.map.dispose();
            }
            this.disposeObject(this.textPlate);
        }
        
        // Remove UI group from camera if it exists
        if (this.uiGroup && this.camera) {
            this.camera.remove(this.uiGroup);
        }
        
        // Clear UI references to ensure they're recreated
        this.textPlate = null;
        this.uiGroup = null;
        
        // Remove all models from scene
        if (this.scene) {
            // Remove all objects from the scene
            while (this.scene.children.length > 0) {
                const object = this.scene.children[0];
                this.scene.remove(object);
            }
        }
        
        // Dispose of all resources to prevent memory leaks
        if (this.startButtonModel) this.disposeObject(this.startButtonModel);
        if (this.pauseButtonModel) this.disposeObject(this.pauseButtonModel);
        if (this.nextButtonModel) this.disposeObject(this.nextButtonModel);
        if (this.wendy) this.disposeObject(this.wendy);
        if (this.mendy) this.disposeObject(this.mendy);
        
        // Clear all models
        this.startButtonModel = null;
        this.pauseButtonModel = null;
        this.nextButtonModel = null;
        this.wendy = null;
        this.mendy = null;
        
        // End WebXR session if active
        if (this.session) {
            this.session.end().catch(error => console.error('Error ending XR session:', error));
            this.session = null;
        }
        
        // Stop animation loop
        if (this.renderer) {
            this.renderer.setAnimationLoop(null);
        }
        
        // Reset state
        this.experienceStarted = false;
        this.isPaused = false;
        this.isXRActive = false;
        
        // Reset UI
        document.getElementById('arView').style.display = 'none';
        document.getElementById('landingPage').style.display = 'none';
        document.getElementById('endPage').style.display = 'block';
        
        // Set up restart button
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            // Remove any existing event listeners to avoid duplicates
            const newButton = restartButton.cloneNode(true);
            restartButton.parentNode.replaceChild(newButton, restartButton);
            
            // Add fresh event listener
            newButton.addEventListener('click', () => {
                // Clear display
                document.getElementById('endPage').style.display = 'none';
                document.getElementById('landingPage').style.display = 'block';
                
                // Start fresh
                this.init();
            });
        }
        
        // Remove window resize listener
        window.removeEventListener('resize', this.onWindowResize);
    }     
    
    idleMove(model, timestamp, amplitude = 0.05, speed = 0.001, axis = 'y') {
        if (!model || !model.visible) return;
        
        // Store the original position if not yet stored
        const positionKey = `original${axis.toUpperCase()}`;
        if (!model.userData[positionKey]) {
            model.userData[positionKey] = model.position[axis];
        }
        
        // Move along the specified axis in a sine wave pattern
        const originalPos = model.userData[positionKey];
        model.position[axis] = originalPos + Math.sin(timestamp * speed) * amplitude;
    }

   // Helper method to properly dispose of 3D objects
    disposeObject(object) {
        if (!object) return;
        
        // Recursively dispose of all children
        if (object.children) {
            while (object.children.length > 0) {
                this.disposeObject(object.children[0]);
                object.remove(object.children[0]);
            }
        }
        
        // Dispose of geometries
        if (object.geometry) object.geometry.dispose();
        
        // Dispose of materials
        if (object.material) {
            const disposeMaterial = (material) => {
                // Dispose of material's textures
                Object.keys(material).forEach(prop => {
                    if (!material[prop]) return;
                    if (material[prop].isTexture) {
                        material[prop].dispose();
                    }
                });
                
                // Dispose of the material itself
                material.dispose();
            };
            
            if (Array.isArray(object.material)) {
                object.material.forEach(disposeMaterial);
            } else {
                disposeMaterial(object.material);
            }
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render(timestamp) {            
        
        if (this.startButtonModel) {
            this.idleMove(this.startButtonModel, timestamp);
        }
        
        if (this.pauseButtonModel) {
            this.idleMove(this.pauseButtonModel, timestamp);
        }
        
        if (this.nextButtonModel) {
            this.idleMove(this.nextButtonModel, timestamp);
        }
        
        // You can also animate Wendy and Mendy with different parameters
        if (this.wendy && this.wendy.visible) {
            this.idleMove(this.wendy, timestamp, 0.03, 0.001); // Slower, smaller movement
        }
        
        if (this.mendy && this.mendy.visible) {
            this.idleMove(this.mendy, timestamp, 0.03, 0.0001); // Slower, smaller movement
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ARExperience();
});