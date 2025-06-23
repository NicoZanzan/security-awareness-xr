class ARExperience {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.session = null;
        this.frameRequest = null;
        
        // Models
        this.startButtonModel = null;
        this.wendyModel = null;
        this.mendyModel = null;
        
        // Animation state
        this.experienceStarted = false;
        this.wendySpeaking = false;
        this.mendyRevealed = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkWebXRSupport();
    }
    
    setupEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => {
            this.startARExperience();
        });
    }
    
    async checkWebXRSupport() {
        if (!navigator.xr) {
            this.showError('WebXR not supported on this device');
            return;
        }
        
        try {
            const supported = await navigator.xr.isSessionSupported('immersive-ar');
            if (!supported) {
                // For testing on desktop, we'll use inline mode
                console.log('Immersive AR not supported, will use inline mode for testing');
            }
        } catch (error) {
            console.log('WebXR check failed, will attempt inline mode');
        }
    }
    
    async startARExperience() {
        try {
            document.getElementById('startButton').disabled = true;
            document.getElementById('startButton').textContent = 'Starting...';
            
            await this.initThreeJS();
            await this.startXRSession();
            
            document.getElementById('landingPage').style.display = 'none';
            document.getElementById('arView').style.display = 'block';
            
        } catch (error) {
            console.error('Failed to start AR experience:', error);
            this.showError('Failed to start AR experience: ' + error.message);
            document.getElementById('startButton').disabled = false;
            document.getElementById('startButton').textContent = 'Start AR Experience';
        }
    }
    
    async initThreeJS() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Renderer
        const canvas = document.getElementById('arCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 5);
        this.scene.add(directionalLight);
        
        // Load models
        await this.loadModels();
        
        // Setup scene
        this.setupScene();
    }
    
    async loadModels() {
        const loader = new THREE.GLTFLoader();
        
        try {
            // TODO: Replace with your actual GLB models
            // Uncomment and modify paths below:
            
            
            const buttonGLB = await this.loadGLB(loader, './assets/models/button.glb');
            this.startButtonModel = buttonGLB.scene;
            
            const wendyGLB = await this.loadGLB(loader, './assets/models/wendy.glb');
            this.wendyModel = wendyGLB.scene;
            
            const mendyGLB = await this.loadGLB(loader, './assets/models/mendy.glb');
            this.mendyModel = mendyGLB.scene;

            
            // For now, using placeholder geometries
            // Start button (placeholder)
            const buttonGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
            const buttonMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
            this.startButtonModel = new THREE.Mesh(buttonGeometry, buttonMaterial);
            
            // Wendy (placeholder)
            const wendyGeometry = new THREE.CapsuleGeometry(0.2, 1.0, 8, 16);
            const wendyMaterial = new THREE.MeshPhongMaterial({ color: 0x4ecdc4 });
            this.wendyModel = new THREE.Mesh(wendyGeometry, wendyMaterial);
            
            // Mendy (placeholder)
            const mendyGeometry = new THREE.CapsuleGeometry(0.2, 1.0, 8, 16);
            const mendyMaterial = new THREE.MeshPhongMaterial({ color: 0x45b7d1 });
            this.mendyModel = new THREE.Mesh(mendyGeometry, mendyMaterial);
            
            console.log('Models loaded (using placeholders)');
            
        } catch (error) {
            console.error('Error loading models:', error);
            throw new Error('Failed to load 3D models');
        }
    }
    
    loadGLB(loader, path) {
        return new Promise((resolve, reject) => {
            loader.load(path, resolve, undefined, reject);
        });
    }
    
    setupScene() {
        // Position start button
        this.startButtonModel.position.set(0, 0, -2);
        this.scene.add(this.startButtonModel);
        
        // Position Wendy (hidden initially)
        this.wendyModel.position.set(-1, -0.5, -3);
        this.wendyModel.visible = false;
        this.scene.add(this.wendyModel);
        
        // Position Mendy behind user (hidden initially)
        this.mendyModel.position.set(0, -0.5, 2);
        this.mendyModel.visible = false;
        this.scene.add(this.mendyModel);
        
        // Add interaction handling
        this.setupInteractions();
    }
    
    setupInteractions() {
        // Simple click/tap detection for the start button
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        const onPointerDown = (event) => {
            if (this.experienceStarted) return;
            
            // Calculate mouse position
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Raycast
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObject(this.startButtonModel);
            
            if (intersects.length > 0) {
                this.beginExperience();
            }
        };
        
        window.addEventListener('pointerdown', onPointerDown);
    }
    
    beginExperience() {
        this.experienceStarted = true;
        
        // Hide start button
        this.startButtonModel.visible = false;
        
        // Show Wendy
        this.wendyModel.visible = true;
        this.wendySpeaking = true;
        
        // Update instructions
        document.getElementById('arInstructions').textContent = 
            'Wendy is talking about cybersecurity. Listen carefully!';
        
        // Simulate Wendy's speech duration
        setTimeout(() => {
            this.endWendySpeech();
        }, 5000); // 5 seconds for demo
    }
    
    endWendySpeech() {
        this.wendySpeaking = false;
        
        // Update instructions
        document.getElementById('arInstructions').textContent = 
            'Turn around! Someone has been watching...';
        
        // Show Mendy after a delay
        setTimeout(() => {
            this.revealMendy();
        }, 2000);
    }
    
    revealMendy() {
        this.mendyModel.visible = true;
        this.mendyRevealed = true;
        
        // Update instructions
        document.getElementById('arInstructions').textContent = 
            'Mendy was spying on you all along! Stay aware of your surroundings.';
    }
    
    async startXRSession() {
        try {
            // Try immersive AR first
            if (navigator.xr) {
                try {
                    this.session = await navigator.xr.requestSession('immersive-ar', {
                        requiredFeatures: ['local'],
                        optionalFeatures: ['dom-overlay'],
                        domOverlay: { root: document.getElementById('arView') }
                    });
                } catch (arError) {
                    console.log('Immersive AR failed, trying inline mode for desktop testing');
                    // Fallback to inline for desktop testing
                    this.session = await navigator.xr.requestSession('inline');
                }
                
                this.renderer.xr.setSession(this.session);
                this.session.addEventListener('end', () => this.onSessionEnd());
                
                // Start render loop
                this.renderer.setAnimationLoop((time, frame) => this.render(time, frame));
            } else {
                // Fallback for non-WebXR browsers
                this.startFallbackMode();
            }
            
        } catch (error) {
            console.error('XR Session failed:', error);
            // Start fallback mode for testing
            this.startFallbackMode();
        }
    }
    
    startFallbackMode() {
        console.log('Starting fallback mode for desktop testing');
        
        // Position camera for desktop view
        this.camera.position.set(0, 1.6, 0);
        
        // Add basic controls
        this.setupDesktopControls();
        
        // Start render loop
        this.renderer.setAnimationLoop(() => this.render());
    }
    
    setupDesktopControls() {
        // Simple mouse controls for desktop testing
        let mouseX = 0, mouseY = 0;
        
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Rotate camera based on mouse
            this.camera.rotation.y = mouseX * 0.5;
            this.camera.rotation.x = mouseY * 0.3;
        });
    }
    
    render(time, frame) {
        // Simple animations
        if (this.startButtonModel && this.startButtonModel.visible) {
            this.startButtonModel.rotation.y += 0.01;
        }
        
        if (this.wendyModel && this.wendySpeaking) {
            this.wendyModel.rotation.y = Math.sin(time * 0.003) * 0.2;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onSessionEnd() {
        this.session = null;
        document.getElementById('landingPage').style.display = 'flex';
        document.getElementById('arView').style.display = 'none';
        document.getElementById('startButton').disabled = false;
        document.getElementById('startButton').textContent = 'Start AR Experience';
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<h3>Error</h3><p>${message}</p>`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }
}

// Initialize the AR experience when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.arExperience = new ARExperience();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.arExperience && window.arExperience.camera && window.arExperience.renderer) {
        window.arExperience.camera.aspect = window.innerWidth / window.innerHeight;
        window.arExperience.camera.updateProjectionMatrix();
        window.arExperience.renderer.setSize(window.innerWidth, window.innerHeight);
    }
});