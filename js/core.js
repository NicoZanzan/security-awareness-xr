// core.js - Main class initialization and WebXR setup

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
                this.scene1();
                
            } catch (error) {
                console.error('Failed to start:', error);
                alert('Failed to start project: ' + error.message);
            }
        });    
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    // New helper method to load resources
    async loadResources() {
        const loader = new THREE.GLTFLoader();
                
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
            
            //Load all assets        
            const buttonGLB = await loadGLB('./assets/models/button.glb');
            this.startButtonModel = buttonGLB.scene;       

            const laptopGLB = await loadGLB('./assets/models/laptop.glb');
            this.laptopModel = laptopGLB.scene; 
            
            const flatTableGLB = await loadGLB('./assets/models/flatTable.glb');
            this.flatTableModel = flatTableGLB.scene;      

            const roomGLB = await loadGLB('./assets/models/room.glb');
            this.roomModel = roomGLB.scene; 
             this.roomAnimation = roomGLB.animations; 

            if (roomGLB.animations && roomGLB.animations.length > 0) {
                this.RoomAnimation = roomGLB.animations[0];
            }           

            const tableGLB = await loadGLB('./assets/models/table.glb');
            this.tableModel = tableGLB.scene;       
            this.tableAnimation = tableGLB.animations; 

            if (tableGLB.animations && tableGLB.animations.length > 0) {
                this.TableAnimation = tableGLB.animations[0];
            }

            const pauseGLB = await loadGLB('./assets/models/pauseButton.glb');
            this.pauseButtonModel = pauseGLB.scene;        

            const quitGLB = await loadGLB('./assets/models/quitButton.glb');
            this.quitButtonModel = quitGLB.scene;       
                  
            // Load next button
            const nextGLB = await loadGLB('./assets/models/next.glb');
            this.nextButtonModel = nextGLB.scene;      

            const doc1GLB = await loadGLB('./assets/models/doc1.glb');
            this.doc1Model = doc1GLB.scene;      
            
            // Load Wendy
            const wendyGLB = await loadGLB('./assets/models/wendy.glb');
            this.wendy = wendyGLB.scene;           
            
            // Load Mendy
            const mendyGLB = await loadGLB('./assets/models/mendy.glb');
            this.mendy = mendyGLB.scene;            
            
            console.log('All models loaded successfully');
            
            } catch (error) {
                console.error('Model loading failed:', error);
                throw error;
            }
        
        // Load audio
        this.wendyAudio_1 = new Audio('./assets/audio/wendy_test.mp3');
        this.wendyAudio_1.preload = 'auto';

        this.wendyAudio_2 = new Audio('./assets/audio/wendy_2.mp3');
        this.wendyAudio_2.preload = 'auto';         
        
        // Playback assets for scene2:
        this.scene2ModelAnimations = [
            { modelName: 'tableModel', animationName: 'TableAnimation' },
            { modelName: 'roomModel', animationName: 'RoomAnimation' },
        ];

        this.scene2AudioTracks = ['wendyAudio_1', 'wendyAudio_2'];
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
                        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'hit-test']
                    });
                    
                    await this.renderer.xr.setSession(this.session);
                    this.isXRActive = true;                
                    
                    // Set up XR controller (moved from setupInteraction)
                    this.controller = this.renderer.xr.getController(0);
                    this.scene.add(this.controller);

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
                    
                    // Set up the controller's select event for interaction
                    this.controller.addEventListener('select', (event) => {
                                            
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
                        //this.adjustForVR();
                        //this.camera.position.set(0, -1.6, 0);
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