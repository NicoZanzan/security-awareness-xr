// core.js - Main class initialization and WebXR setup with batched loading

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
        this.quitButtonModel = null;
        this.laptopModel = null;
        this.wendy = null;
        this.mendy = null;
        this.tableModel = null;     
        
        // Audio
        this.wendyAudio_1 = null;
        this.wendyAudio_2 = null;
        
        // State
        this.experienceStarted = false;
        this.isXRActive = false;
        this.isPaused = false;
        this.currentScene = null;
        
        // Loading state
        this.loadingStates = {
            scene1: false,
            scene2: false,
            scene3: false,
            scene4: false
        };
        
        // For managing interactive objects
        this.modelInteractions = new Map();

        //Raycaster for XR interaction
        this.raycasterLine = null;
        this.rayLength = 5; // Length of visible ray in meters  

        this.mixers = [];
        this.clock = new THREE.Clock();

        this.init();
    }
    
    async init() {        
        // hide end page initially
        document.getElementById('endPage').style.display = 'none';
    
        // Add start button event listener
        document.getElementById('startButton').addEventListener('click', async () => {
            try {                  
                // Hide landing page, show AR view
                document.getElementById('landingPage').style.display = 'none';
                document.getElementById('arView').style.display = 'block';
                
                // Show loading progress
                this.showLoadingProgress();
                
                // -------- THREE.JS INITIALIZATION --------
                this.updateLoadingProgress('Initializing 3D environment...');
                this.initializeThreeJS();
                
                // -------- LOAD SCENE 1 RESOURCES (ESSENTIAL) --------
                this.updateLoadingProgress('Loading Scene 1 resources...');
                await this.loadScene1Resources();
                
                // -------- WEBXR INITIALIZATION --------
                this.updateLoadingProgress('Setting up controls...');
                this.renderer.xr.enabled = true;
                await this.setupControls();
                
                // -------- START THE APP --------
                this.updateLoadingProgress('Starting experience...');
                
                // Start render loop
                this.renderer.setAnimationLoop((timestamp, frame) => {
                    this.render(timestamp, frame);
                });
                
                // Hide loading and start
                this.hideLoadingProgress();
                this.startExperience();
                
                // Load remaining scenes in background
                this.loadRemainingResources();
                
            } catch (error) {
                this.hideLoadingProgress();
                console.error('Failed to start:', error);
                alert('Failed to start project: ' + error.message);
            }
        });    
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    initializeThreeJS() {
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
    }

    // Loading Progress UI
    showLoadingProgress() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingProgress';
        loadingDiv.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 30px; border-radius: 15px; text-align: center; z-index: 1000; min-width: 300px;">
                <h3 style="margin-bottom: 20px; color: #fff;">Loading...</h3>
                <div id="loadingText" style="margin-bottom: 15px;">Preparing experience...</div>
                <div style="background: #333; height: 4px; border-radius: 2px; overflow: hidden;">
                    <div id="loadingBar" style="background: #4CAF50; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }

    updateLoadingProgress(text, progress = null) {
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.textContent = text;
        }
        
        if (progress !== null) {
            const loadingBar = document.getElementById('loadingBar');
            if (loadingBar) {
                loadingBar.style.width = progress + '%';
            }
        }
    }

    hideLoadingProgress() {
        const loadingDiv = document.getElementById('loadingProgress');
        if (loadingDiv) {
            document.body.removeChild(loadingDiv);
        }
    }

    // SCENE 1 RESOURCES (Essential - loaded first)
    async loadScene1Resources() {
        const loader = new THREE.GLTFLoader();
        
        const loadGLB = (path, name) => {
            return new Promise((resolve, reject) => {
                loader.load(
                    path,
                    (gltf) => {
                        console.log(`✅ Loaded: ${name}`);
                        resolve(gltf);
                    },
                    (progress) => {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        this.updateLoadingProgress(`Loading ${name}: ${percent}%`, percent);
                    },
                    (error) => {
                        console.error(`❌ Failed to load ${path}:`, error);
                        reject(error);
                    }
                );
            });
        };

        try {
            console.log('📦 Loading Scene 1 (Essential) Resources...');
            
            // Scene 1 Models (blocking - needed immediately)
            this.startButtonModelGLB = await loadGLB('./assets/models/startButtonModel.glb', 'Start Button');
            this.startButtonModel = this.startButtonModelGLB.scene;
            
            this.wendyNTModelGLB = await loadGLB('./assets/models/wendyNTModel.glb', 'Wendy NT');
            this.wendyNTModel = this.wendyNTModelGLB.scene;

            // Scene 1 Audio (essential)
            this.audioIntroMsg = new Audio('./assets/audio/audioIntroMsg.mp3');
            // Don't preload - let it load when played
            
            this.loadingStates.scene1 = true;
            console.log('✅ Scene 1 resources loaded - app ready to start');
            
        } catch (error) {
            console.error('❌ Scene 1 loading failed:', error);
            throw error;
        }
    }

    // Load remaining scenes in background (non-blocking)
    async loadRemainingResources() {
        console.log('🔄 Loading remaining scenes in background...');
        
        // Load scenes in parallel for faster loading
        Promise.all([
            this.loadScene2Resources(),
            this.loadScene3Resources(), 
            this.loadScene4Resources()
        ]).then(() => {
            console.log('✅ All scenes loaded successfully');
            this.showModelsAnimations();
        }).catch((error) => {
            console.warn('⚠️ Some background loading failed:', error);
        });
    }

    // SCENE 2 RESOURCES (3D Video scene)
    async loadScene2Resources() {
        const loader = new THREE.GLTFLoader();
        
        const loadGLB = (path, name) => {
            return new Promise((resolve, reject) => {
                loader.load(path, resolve, undefined, (error) => {
                    console.warn(`⚠️ Failed to load ${name}:`, error);
                    reject(error);
                });
            });
        };

        try {
            console.log('📦 Loading Scene 2 Resources...');
            
            // Load Scene 2 models in parallel
            const scene2Loads = [
                loadGLB('./assets/models/cafeModelS3.glb', 'Cafe'),
                loadGLB('./assets/models/wendyModel.glb', 'Wendy'),
                loadGLB('./assets/models/mendyModel.glb', 'Mendy'),
                loadGLB('./assets/models/doc1Model.glb', 'Document 1'),
                loadGLB('./assets/models/doc2Model.glb', 'Document 2'),
                loadGLB('./assets/models/word1Model.glb', 'Word 1'),
                loadGLB('./assets/models/word2Model.glb', 'Word 2'),
                loadGLB('./assets/models/word3Model.glb', 'Word 3'),
                loadGLB('./assets/models/sunglassesModel.glb', 'Sunglasses'),
                loadGLB('./assets/models/wendyGlassesModelS3.glb', 'Wendy Glasses')
            ];

            const results = await Promise.all(scene2Loads);
            
            // Assign results
            [this.cafeModelS3GLB, this.wendyModelGLB, this.mendyModelGLB, 
             this.doc1ModelGLB, this.doc2ModelGLB, this.word1ModelGLB, 
             this.word2ModelGLB, this.word3ModelGLB, this.sunglassesModelGLB, 
             this.wendyGlassesModelS3GLB] = results;
            
            // Extract scenes
            this.cafeModelS3 = this.cafeModelS3GLB.scene;
            this.wendyModel = this.wendyModelGLB.scene;
            this.mendyModel = this.mendyModelGLB.scene;
            this.doc1Model = this.doc1ModelGLB.scene;
            this.doc2Model = this.doc2ModelGLB.scene;
            this.word1Model = this.word1ModelGLB.scene;
            this.word2Model = this.word2ModelGLB.scene;
            this.word3Model = this.word3ModelGLB.scene;
            this.sunglassesModel = this.sunglassesModelGLB.scene;
            this.wendyGlassesModelS3 = this.wendyGlassesModelS3GLB.scene;

            // Scene 2 Audio
            this.audioS2 = new Audio('./assets/audio/audioS2.mp3');
            
            // Scene 2 Animation configuration
            this.scene2ModelAnimations = [
                { modelName: 'cafeModelS3', animationName: 'CafeAction' },
                { modelName: 'doc1Model', animationName: 'document_1Action' },
                { modelName: 'doc2Model', animationName: 'document_2Action' },
                { modelName: 'mendyModel', animationName: 'MendyAction' },
                { modelName: 'wendyModel', animationName: 'Romy-WendyAction' },
                { modelName: 'word1Model', animationName: 'S1_wordAction' },
                { modelName: 'word2Model', animationName: 'S2_wordAction' },
                { modelName: 'word3Model', animationName: 'S3_wordAction' },
                { modelName: 'sunglassesModel', animationName: 'sunglassesAction' },
                { modelName: 'wendyGlassesModelS3', animationName: 'Romy-Wendy+glassesAction' },              
            ];

            this.scene2AudioTracks = ['audioS2'];
            
            this.loadingStates.scene2 = true;
            console.log('✅ Scene 2 resources loaded');
            
        } catch (error) {
            console.warn('⚠️ Scene 2 loading failed:', error);
        }
    }

    // SCENE 3 RESOURCES (Quiz scene)
    async loadScene3Resources() {
        const loader = new THREE.GLTFLoader();
        
        const loadGLB = (path, name) => {
            return new Promise((resolve, reject) => {
                loader.load(
                    path,
                    (gltf) => resolve(gltf),
                    (progress) => {
                        // SAFETY CHECK HERE
                        let percent = 0;
                        if (progress.total > 0 && progress.loaded >= 0) {
                            percent = Math.round((progress.loaded / progress.total) * 100);
                            // Clamp between 0-100
                            percent = Math.min(100, Math.max(0, percent));
                        } else if (progress.loaded > 0) {
                            // If total is unknown but we have loaded data, show indeterminate
                            percent = 50; // or use a spinner instead
                        }
                        
                        this.updateLoadingProgress(`Loading ${name}: ${percent}%`, percent);
                    },
                    (error) => reject(error)
                );
            });
        };

        try {
            console.log('📦 Loading Scene 3 Resources...');
            
            // Load Scene 3 models in parallel
            const scene3Loads = [
                loadGLB('./assets/models/laptopModel.gltf', 'Laptop'),
                loadGLB('./assets/models/tabletModel.gltf', 'Tablet'),
                loadGLB('./assets/models/tableModel.glb', 'Table'),
                loadGLB('./assets/models/flatTableModel.glb', 'Flat Table'),
                loadGLB('./assets/models/notebookModel.gltf', 'Notebook')
            ];

            const results = await Promise.all(scene3Loads);
            
            // Assign results  
            [this.laptopModelGLB, this.tabletModelGLB, this.tableModelGLB,
             this.flatTableModelGLB, this.notebookModelGLB] = results;
            
            // Extract scenes
            this.laptopModel = this.laptopModelGLB.scene;
            this.tabletModel = this.tabletModelGLB.scene;
            this.tableModel = this.tableModelGLB.scene;
            this.flatTableModel = this.flatTableModelGLB.scene;
            this.notebookModel = this.notebookModelGLB.scene;

            // Scene 3 Audio
            this.audioQuizIntro = new Audio('./assets/audio/audioQuizIntro.mp3');
            this.audioCorrectAnswer = new Audio('./assets/audio/audioCorrectAnswer.mp3');
            this.audioWrongAnswer = new Audio('./assets/audio/audioWrongAnswer.mp3');
            
            this.loadingStates.scene3 = true;
            console.log('✅ Scene 3 resources loaded');
            
        } catch (error) {
            console.warn('⚠️ Scene 3 loading failed:', error);
        }
    }

    // SCENE 4 RESOURCES (Finale scene)  
    async loadScene4Resources() {
        const loader = new THREE.GLTFLoader();
        
        const loadGLB = (path, name) => {
            return new Promise((resolve, reject) => {
                loader.load(path, resolve, undefined, (error) => {
                    console.warn(`⚠️ Failed to load ${name}:`, error);
                    reject(error);
                });
            });
        };

        try {
            console.log('📦 Loading Scene 4 Resources...');
            
            // Load Scene 4 models
            const scene4Loads = [
                loadGLB('./assets/models/quitButtonModel.glb', 'Quit Button'),
                loadGLB('./assets/models/pauseButtonModel.glb', 'Pause Button'),
                loadGLB('./assets/models/nextButtonModel.glb', 'Next Button')
            ];

            const results = await Promise.all(scene4Loads);
            
            // Assign results
            [this.quitButtonModelGLB, this.pauseButtonModelGLB, 
             this.nextButtonModelGLB] = results;
            
            // Extract scenes
            this.quitButtonModel = this.quitButtonModelGLB.scene;
            this.pauseButtonModel = this.pauseButtonModelGLB.scene;
            this.nextButtonModel = this.nextButtonModelGLB.scene;
            
            this.loadingStates.scene4 = true;
            console.log('✅ Scene 4 resources loaded');
            
        } catch (error) {
            console.warn('⚠️ Scene 4 loading failed:', error);
        }
    }

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
                        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
                    });
                    
                    await this.renderer.xr.setSession(this.session);
                    this.isXRActive = true;                
                    
                    // Set up XR controller (moved from setupInteraction)
                    // this.controller = this.renderer.xr.getController(0);
                    // this.scene.add(this.controller);

                    // Create raycaster line for controller when in AR/VR mode
                     if (this.session) {  // If we're in AR/VR mode
                        // Set up XR controller
                        this.controller = this.renderer.xr.getController(0);
                        this.scene.add(this.controller);
                        
                        // Create visible ray
                        this.createRaycasterRay();
                        
                        // Set up controller select event
                        this.controller.addEventListener('select', (event) => {
                            const tempMatrix = new THREE.Matrix4();
                            tempMatrix.identity().extractRotation(this.controller.matrixWorld);
                            
                            const controllerRaycaster = new THREE.Raycaster();
                            controllerRaycaster.ray.origin.setFromMatrixPosition(this.controller.matrixWorld);
                            controllerRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
                            
                            this.checkInteractions(controllerRaycaster);
                        });
                    }                  
                    
                    // Adjust for VR if needed (particularly for Meta Quest)
                    if (isVRSupported && !isARSupported) {
                 
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
        }
    }
  

// Separate method for controller select handling
handleControllerSelect(controller, event) {
    console.log('handleControllerSelect called');
    
    // Check if controller has valid pose
    const frame = this.renderer.xr.getFrame();
    if (!frame) {
        console.warn('No XR frame available');
        return;
    }

    const referenceSpace = this.renderer.xr.getReferenceSpace();
    if (!referenceSpace) {
        console.warn('No reference space available');
        return;
    }

    // Get controller pose from input source
    const inputSource = event.inputSource;
    if (inputSource && inputSource.targetRaySpace) {
        const targetRayPose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
        
        if (targetRayPose) {
            console.log('Using input source target ray pose');
            
            // Create raycaster from controller pose
            const tempMatrix = new THREE.Matrix4();
            tempMatrix.fromArray(targetRayPose.transform.matrix);
            
            const controllerRaycaster = new THREE.Raycaster();
            controllerRaycaster.ray.origin.setFromMatrixPosition(tempMatrix);
            
            // Extract rotation and apply to direction
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.extractRotation(tempMatrix);
            controllerRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotationMatrix).normalize();
            
            // Check for interactions
            this.checkInteractions(controllerRaycaster);
        } else {
            console.warn('No target ray pose available');
            this.fallbackControllerInteraction(controller);
        }
    } else {
        console.warn('No input source or target ray space, using fallback');
        this.fallbackControllerInteraction(controller);
    }
}

// Fallback method when pose data isn't available
fallbackControllerInteraction(controller) {
    // Fallback: use controller matrix world
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    
    const controllerRaycaster = new THREE.Raycaster();
    controllerRaycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    controllerRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    
    console.log('Using fallback controller interaction');
    this.checkInteractions(controllerRaycaster);
}

// Extract mouse/touch interaction setup
setupMouseTouchInteraction() {
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
    }
}

// Debug method to check controller status
debugControllers() {
    if (!this.session) {
        console.log('No XR session active');
        return;
    }

    console.log('=== Controller Debug Info ===');
    console.log('Input sources count:', this.session.inputSources.length);
    
    this.session.inputSources.forEach((inputSource, index) => {
        console.log(`Input Source ${index}:`, {
            handedness: inputSource.handedness,
            targetRayMode: inputSource.targetRayMode,
            profiles: inputSource.profiles,
            hasTargetRaySpace: !!inputSource.targetRaySpace,
            hasGripSpace: !!inputSource.gripSpace
        });
    });

    if (this.controllers) {
        console.log('Controller objects:', this.controllers.length);
        this.controllers.forEach((controller, index) => {
            console.log(`Controller ${index}:`, {
                visible: controller.visible,
                hasMatrixWorld: !!controller.matrixWorld,
                position: controller.position
            });
        });
    }

    // Test raycaster setup
    if (this.raycasterLine) {
        console.log('Raycaster line exists:', !!this.raycasterLine);
        }
    }

    // Update the ray visualization method (improved)
    updateRaycastRay() {
        if (!this.raycasterLine || !this.controllers || !this.controllers[0]) return;

        const frame = this.renderer.xr.getFrame();
        if (!frame) return;

        const referenceSpace = this.renderer.xr.getReferenceSpace();
        if (!referenceSpace) return;

        // Try to get controller input source
        const inputSources = this.session.inputSources;
        let targetRayPose = null;

        for (const inputSource of inputSources) {
            if (inputSource.targetRaySpace) {
                targetRayPose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
                if (targetRayPose) break;
            }
        }

        if (targetRayPose) {
            // Update ray from input source pose
            const matrix = new THREE.Matrix4().fromArray(targetRayPose.transform.matrix);
            const position = new THREE.Vector3().setFromMatrixPosition(matrix);
            
            const rotationMatrix = new THREE.Matrix4().extractRotation(matrix);
            const direction = new THREE.Vector3(0, 0, -1).applyMatrix4(rotationMatrix).normalize();

            const endPoint = position.clone().add(direction.multiplyScalar(this.rayLength));
            
            const positions = this.raycasterLine.geometry.attributes.position;
            positions.setXYZ(0, position.x, position.y, position.z);
            positions.setXYZ(1, endPoint.x, endPoint.y, endPoint.z);
            positions.needsUpdate = true;
        } else {
            // Fallback to controller matrix world
            const controller = this.controllers[0];
            if (controller.visible) {
                const position = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
                const tempMatrix = new THREE.Matrix4().extractRotation(controller.matrixWorld);
                const direction = new THREE.Vector3(0, 0, -1).applyMatrix4(tempMatrix).normalize();
                const endPoint = position.clone().add(direction.multiplyScalar(this.rayLength));
                
                const positions = this.raycasterLine.geometry.attributes.position;
                positions.setXYZ(0, position.x, position.y, position.z);
                positions.setXYZ(1, endPoint.x, endPoint.y, endPoint.z);
                positions.needsUpdate = true;
            }
        }
    }

    // Simplified fallback camera controls for non-AR devices
    setupFallbackCameraControls() {
        // For non-AR devices - position camera for good view
        console.log('Setting up camera controls for non-AR mode');
        // Adjusted camera height to better frame objects at Y=0, which are 1.5m in front of the origin.
        // A height of 0.7m allows for a natural slight downward gaze to see objects on the floor.
        this.camera.position.set(0, 0.7, 0); // Changed from 1.6 to 0.7

        this.camera.rotation.set(0, 0, 0); 
        
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

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render(timestamp) {            
        
        if (this.startButtonModel) {
            this.idleMove(this.startButtonModel, timestamp);
        }
        
        // if (this.pauseButtonModel) {
        //     this.idleMove(this.pauseButtonModel, timestamp);
        // }
        
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

        if (this.isXRActive && this.raycasterLine) {
            this.updateRaycastRay();
        }

        const delta = this.clock ? this.clock.getDelta() : 0;
    
        if (this.mixers) {
            this.mixers.forEach(mixer => {
                if (mixer) mixer.update(delta);
            });
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}



