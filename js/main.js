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
        this.wendyModel = null;
        this.mendyModel = null;
        
        // Audio
        this.wendyAudio = null;
        
        // State
        this.experienceStarted = false;
        this.isXRActive = false;
        this.isPaused = false;
        
        this.init();
    }
    
    init() {
        // Simple start button click
        document.getElementById('startButton').addEventListener('click', () => {
            this.startARExperience();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    async startARExperience() {
        try {
            console.log('Starting AR experience...');
            
            // Hide landing page, show AR view
            document.getElementById('landingPage').style.display = 'none';
            document.getElementById('arView').style.display = 'block';
            
            // Initialize Three.js
            await this.initThreeJS();
            
            // Try to start WebXR, fallback to regular 3D
            await this.initWebXR();
            
            // Start the experience
            this.startScene();
            
        } catch (error) {
            console.error('Failed to start:', error);
            alert('Failed to start AR experience: ' + error.message);
        }
    }
    
    async initThreeJS() {
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
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = false; // Disable shadows for performance
        
        // Comprehensive lighting for all devices
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Bright ambient
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-1, -1, -1);
        this.scene.add(directionalLight2);
        
        // Load models and audio
        await this.loadModels();
        this.loadAudio();
        
        console.log('Three.js initialized');
    }
    
    async initWebXR() {
        // Enable XR
        this.renderer.xr.enabled = true;
        
        if (navigator.xr) {
            try {
                // Check for immersive AR support
                const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
                
                if (isARSupported) {
                    console.log('Starting immersive AR session');
                    this.session = await navigator.xr.requestSession('immersive-ar', {
                        requiredFeatures: ['local'],
                        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
                    });
                    
                    await this.renderer.xr.setSession(this.session);
                    this.isXRActive = true;
                    
                    // Position for AR
                    this.setupARPositioning();
                    
                } else {
                    console.log('AR not supported, using fallback 3D mode');
                    this.setupFallbackMode();
                }
                
            } catch (error) {
                console.log('WebXR failed, using fallback:', error.message);
                this.setupFallbackMode();
            }
        } else {
            console.log('WebXR not available, using fallback mode');
            this.setupFallbackMode();
        }
        
        // Start render loop
        this.renderer.setAnimationLoop((timestamp, frame) => {
            this.render(timestamp, frame);
        });
    }
    
    setupARPositioning() {
        // For AR devices - models appear in real space
        console.log('Setting up AR positioning');
        // Camera is controlled by WebXR
    }
    
    setupFallbackMode() {
        // For non-AR devices - position camera manually
        console.log('Setting up fallback 3D mode');
        this.camera.position.set(0, 1.6, 0);
        
        // Add mouse/touch controls for fallback
        this.addFallbackControls();
    }
    
    addFallbackControls() {
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
    
    async loadModels() {
        const loader = new THREE.GLTFLoader();
        
        console.log('Loading models...');
        
        try {
            // Load button
            const buttonGLB = await this.loadGLB(loader, './assets/models/button.glb');
            this.startButtonModel = buttonGLB.scene;
            this.scaleModel(this.startButtonModel, 1.0);
            
            // TODO: Load pause button GLB when available
            // const pauseGLB = await this.loadGLB(loader, './assets/models/pause.glb');
            // this.pauseButtonModel = pauseGLB.scene;
            // For now, create placeholder pause button
            this.createPauseButtonPlaceholder();
            
            // Load next button
            const nextGLB = await this.loadGLB(loader, './assets/models/next.glb');
            this.nextButtonModel = nextGLB.scene;
            this.scaleModel(this.nextButtonModel, 1.0);
            
            // Load Wendy
            const wendyGLB = await this.loadGLB(loader, './assets/models/wendy.glb');
            this.wendyModel = wendyGLB.scene;
            this.scaleModel(this.wendyModel, 1.0);
            
            // Load Mendy
            const mendyGLB = await this.loadGLB(loader, './assets/models/mendy.glb');
            this.mendyModel = mendyGLB.scene;
            this.scaleModel(this.mendyModel, 1.0);
            
            console.log('All models loaded successfully');
            
        } catch (error) {
            console.error('Model loading failed:', error);
            // Create fallback models
            this.createFallbackModels();
        }
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
    
    createFallbackModels() {
        console.log('Creating fallback models');
        
        // Fallback button
        const buttonGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.05);
        const buttonMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444 });
        this.startButtonModel = new THREE.Mesh(buttonGeometry, buttonMaterial);
        
        // Fallback pause button
        this.createPauseButtonPlaceholder();
        
        // Fallback next button
        const nextGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 6);
        const nextMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        this.nextButtonModel = new THREE.Mesh(nextGeometry, nextMaterial);
        
        // Fallback Wendy
        const wendyGeometry = new THREE.CapsuleGeometry(0.3, 1.5);
        const wendyMaterial = new THREE.MeshPhongMaterial({ color: 0x44ff44 });
        this.wendyModel = new THREE.Mesh(wendyGeometry, wendyMaterial);
        
        // Fallback Mendy
        const mendyGeometry = new THREE.CapsuleGeometry(0.3, 1.5);
        const mendyMaterial = new THREE.MeshPhongMaterial({ color: 0x4444ff });
        this.mendyModel = new THREE.Mesh(mendyGeometry, mendyMaterial);
    }
    
    loadGLB(loader, path) {
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
    }
    
    loadAudio() {
        this.wendyAudio = new Audio('./assets/audio/ElevenLabs_audio.mp3');
        this.wendyAudio.preload = 'auto';
        
        this.wendyAudio.addEventListener('ended', () => {
            console.log('Wendy audio finished');
            this.endWendySpeech();
        });
        
        this.wendyAudio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
        });
        
        console.log('Audio loaded');
    }
    
    startScene() {
        // Position start button in front of user
        this.startButtonModel.position.set(0, 1.6, -2);
        this.scene.add(this.startButtonModel);
        
        // Prepare other models (hidden)
        this.wendyModel.visible = false;
        this.wendyModel.position.set(-1.5, 0, -2);
        this.scene.add(this.wendyModel);
        
        this.mendyModel.visible = false;
        this.mendyModel.position.set(0, 0, 2);
        this.scene.add(this.mendyModel);
        
        // Add pause button to scene (hidden initially)
        this.pauseButtonModel.visible = false;
        this.pauseButtonModel.position.set(1, 1.8, -2); // Top right area
        this.scene.add(this.pauseButtonModel);
        
        // Add next button to scene (hidden initially)
        this.nextButtonModel.visible = false;
        this.nextButtonModel.position.set(0, 1.2, -2); // Center-bottom area
        this.scene.add(this.nextButtonModel);
        
        // Setup interaction
        this.setupInteraction();
        
        console.log('Scene ready - button should be visible');
    }
    
    setupInteraction() {
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        
        const onPointerDown = (event) => {
            // Get pointer position
            pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Raycast
            raycaster.setFromCamera(pointer, this.camera);
            
            if (!this.experienceStarted) {
                // Check for start button
                const startIntersects = raycaster.intersectObject(this.startButtonModel, true);
                if (startIntersects.length > 0) {
                    console.log('Start button clicked!');
                    this.beginCybersecurityExperience();
                }
            } else if (this.pauseButtonModel.visible) {
                // Check for pause button
                const pauseIntersects = raycaster.intersectObject(this.pauseButtonModel, true);
                if (pauseIntersects.length > 0) {
                    console.log('Pause button clicked!');
                    this.togglePause();
                }
            } else if (this.nextButtonModel.visible) {
                // Check for next button
                const nextIntersects = raycaster.intersectObject(this.nextButtonModel, true);
                if (nextIntersects.length > 0) {
                    console.log('Next button clicked!');
                    this.handleNext();
                }
            }
        };
        
        // Support both mouse and touch
        document.addEventListener('pointerdown', onPointerDown);
        
        // Keyboard backup
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !this.experienceStarted) {
                this.beginCybersecurityExperience();
            } else if (event.code === 'KeyP' && this.experienceStarted && this.pauseButtonModel.visible) {
                this.togglePause();
            } else if (event.code === 'KeyN' && this.nextButtonModel.visible) {
                this.handleNext();
            }
        });
    }
    
    beginCybersecurityExperience() {
        this.experienceStarted = true;
        console.log('Starting cybersecurity experience...');
        
        // Hide start button
        this.startButtonModel.visible = false;
        
        // Show Wendy and pause button
        this.wendyModel.visible = true;
        this.pauseButtonModel.visible = true;
        
        // Update instructions
        document.getElementById('arInstructions').textContent = 
            'Wendy is talking about cybersecurity. Click the pause button or press P to pause.';
        
        // Play audio
        this.wendyAudio.play().catch(error => {
            console.error('Audio play failed:', error);
            // Fallback timer
            setTimeout(() => this.endWendySpeech(), 10000);
        });
    }
    
    togglePause() {
        if (this.isPaused) {
            // Resume
            this.wendyAudio.play();
            this.isPaused = false;
            document.getElementById('arInstructions').textContent = 
                'Wendy is talking about cybersecurity. Click the pause button or press P to pause.';
            console.log('Audio resumed');
        } else {
            // Pause
            this.wendyAudio.pause();
            this.isPaused = true;
            document.getElementById('arInstructions').textContent = 
                'Audio paused. Click the pause button or press P to resume.';
            console.log('Audio paused');
        }
    }
    
    endWendySpeech() {
        console.log('Wendy finished speaking');
        
        // Hide pause button
        this.pauseButtonModel.visible = false;
        this.isPaused = false;
        
        document.getElementById('arInstructions').textContent = 
            'Turn around! Someone has been watching...';
        
        setTimeout(() => this.revealMendy(), 2000);
    }
    
    revealMendy() {
        console.log('Revealing Mendy');
        
        this.mendyModel.visible = true;
        
        // Show next button
        this.nextButtonModel.visible = true;
        
        document.getElementById('arInstructions').textContent = 
            'Mendy was spying on you all along! Stay aware of your surroundings. Click Next or press N to continue.';
    }
    
    handleNext() {
        console.log('Next button clicked - experience complete!');
        
        // Hide all models
        this.wendyModel.visible = false;
        this.mendyModel.visible = false;
        this.nextButtonModel.visible = false;
        
        // Update instructions
        document.getElementById('arInstructions').textContent = 
            'Cybersecurity experience complete! Thank you for staying aware.';
        
        // Optional: Return to landing page after a delay
        setTimeout(() => {
            this.resetExperience();
        }, 3000);
    }
    
    resetExperience() {
        console.log('Resetting experience');
        
        // Reset state
        this.experienceStarted = false;
        this.isPaused = false;
        
        // Show landing page again
        document.getElementById('arView').style.display = 'none';
        document.getElementById('landingPage').style.display = 'flex';
        
        // Reset start button
        this.startButtonModel.visible = true;
        
        // Reset audio
        this.wendyAudio.currentTime = 0;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render(timestamp, frame) {
        // Rotate start button for visibility
        if (this.startButtonModel && this.startButtonModel.visible) {
            this.startButtonModel.rotation.y = timestamp * 0.001;
        }
        
        // Animate pause button
        if (this.pauseButtonModel && this.pauseButtonModel.visible) {
            this.pauseButtonModel.rotation.y = Math.sin(timestamp * 0.003) * 0.2;
        }
        
        // Animate next button
        if (this.nextButtonModel && this.nextButtonModel.visible) {
            this.nextButtonModel.rotation.y = timestamp * 0.002;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ARExperience();
});