class ARExperience {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Models
        this.startButtonModel = null;
        this.wendyModel = null;
        this.mendyModel = null;
        
        // Audio
        this.wendyAudio = null;
        
        // State
        this.experienceStarted = false;
        
        this.init();
    }
    
    init() {
        // Simple start button click
        document.getElementById('startButton').addEventListener('click', () => {
            this.startARExperience();
        });
    }
    
    async startARExperience() {
        try {
            console.log('Starting AR experience...');
            
            // Hide landing page, show AR view
            document.getElementById('landingPage').style.display = 'none';
            document.getElementById('arView').style.display = 'block';
            
            // Initialize Three.js
            await this.initThreeJS();
            
            // Start the experience
            this.startScene();
            
        } catch (error) {
            console.error('Failed to start:', error);
            alert('Failed to start AR experience: ' + error.message);
        }
    }
    
    async initThreeJS() {
        // Basic Three.js setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        const canvas = document.getElementById('arCanvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Basic lighting
        const light = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(light);
        
        // Load models
        await this.loadModels();
        
        // Load audio
        this.loadAudio();
        
        // Position camera
        this.camera.position.set(0, 1.6, 0);
        
        // Start render loop
        this.renderer.setAnimationLoop(() => this.render());
    }
    
    async loadModels() {
        const loader = new THREE.GLTFLoader();
        
        console.log('Loading models...');
        
        // Load button
        const buttonGLB = await this.loadGLB(loader, './assets/models/button.glb');
        this.startButtonModel = buttonGLB.scene;
        
        // Load Wendy
        const wendyGLB = await this.loadGLB(loader, './assets/models/wendy.glb');
        this.wendyModel = wendyGLB.scene;
        
        // Load Mendy
        const mendyGLB = await this.loadGLB(loader, './assets/models/mendy.glb');
        this.mendyModel = mendyGLB.scene;
        
        console.log('All models loaded');
    }
    
    loadAudio() {
        this.wendyAudio = new Audio('./assets/audio/ElevenLabs_audio.mp3');
        this.wendyAudio.preload = 'auto';
        
        // When audio ends, automatically proceed to next step
        this.wendyAudio.addEventListener('ended', () => {
            console.log('Wendy audio finished');
            this.endWendySpeech();
        });
        
        console.log('Audio loaded');
    }
    
    loadGLB(loader, path) {
        return new Promise((resolve, reject) => {
            loader.load(path, resolve, undefined, reject);
        });
    }
    
    startScene() {
        // Add start button to scene
        this.startButtonModel.position.set(0, 1.6, -3);
        this.scene.add(this.startButtonModel);
        
        // Hide other models initially
        this.wendyModel.visible = false;
        this.mendyModel.visible = false;
        this.scene.add(this.wendyModel);
        this.scene.add(this.mendyModel);
        
        // Add click detection
        this.setupClicking();
        
        console.log('Scene ready - you should see the start button');
    }
    
    setupClicking() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        document.addEventListener('click', (event) => {
            if (this.experienceStarted) return;
            
            // Get mouse position
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Check if we hit the button
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObject(this.startButtonModel, true);
            
            if (intersects.length > 0) {
                console.log('Button clicked!');
                this.beginCybersecurityExperience();
            }
        });
        
        // Backup: press SPACE to start
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !this.experienceStarted) {
                console.log('Space pressed - starting experience');
                this.beginCybersecurityExperience();
            }
        });
    }
    
    beginCybersecurityExperience() {
        this.experienceStarted = true;
        
        console.log('Starting cybersecurity experience...');
        
        // Hide start button
        this.startButtonModel.visible = false;
        
        // Show Wendy
        this.wendyModel.position.set(-1, 0, -3);
        this.wendyModel.visible = true;
        
        // Update instructions
        document.getElementById('arInstructions').textContent = 
            'Wendy is talking about cybersecurity. Listen carefully!';
        
        // Play Wendy's audio
        this.wendyAudio.play().catch(error => {
            console.error('Failed to play audio:', error);
            // Fallback: use timer if audio fails
            setTimeout(() => {
                this.endWendySpeech();
            }, 5000);
        });
        
        console.log('Wendy is now speaking...');
    }
    
    endWendySpeech() {
        console.log('Wendy finished speaking');
        
        // Update instructions
        document.getElementById('arInstructions').textContent = 
            'Turn around! Someone has been watching...';
        
        // After 2 seconds, reveal Mendy
        setTimeout(() => {
            this.revealMendy();
        }, 2000);
    }
    
    revealMendy() {
        console.log('Revealing Mendy');
        
        // Show Mendy behind the user
        this.mendyModel.position.set(0, 0, 3);
        this.mendyModel.visible = true;
        
        // Final message
        document.getElementById('arInstructions').textContent = 
            'Mendy was spying on you all along! Stay aware of your surroundings.';
    }
    
    render() {
        // Simple rotation animation for the start button
        if (this.startButtonModel && this.startButtonModel.visible) {
            this.startButtonModel.rotation.y += 0.01;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ARExperience();
});