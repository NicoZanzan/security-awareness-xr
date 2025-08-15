// utilities.js - Helper functions and cleanup
console.log('utilities.js loading...');

ARExperience.prototype.scaleModel = function(model, targetSize) {
    // Auto-scale models to reasonable size
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    if (maxDimension > 0) {
        const scale = targetSize / maxDimension;
        model.scale.setScalar(scale);
    }       
};

ARExperience.prototype.disposeObject = function(object) {
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
};

ARExperience.prototype.finishAR = function() {
    console.log('🔄 Finishing AR experience...');

    // 1. Clean up XR session if active
    const cleanupXR = async () => {
        try {
            if (this.renderer?.xr?.isPresenting) {
                await this.renderer.xr.getSession().end();
                console.log('✅ XR session ended');
            }
        } catch (e) {
            console.warn('XR cleanup error:', e);
        }
    };

    // 2. Show end page
    document.getElementById('arView').style.display = 'none';
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('endPage').style.display = 'block';

    // 3. Setup restart button with proper cleanup
    const setupRestartButton = () => {
    const restartButton = document.getElementById('restartButton');
    if (!restartButton) return;

    const newButton = restartButton.cloneNode(true);
    restartButton.parentNode.replaceChild(newButton, restartButton);

    newButton.addEventListener('click', () => {
        console.log('🔄 Restarting experience...');
        window.location.reload();
    });
    };

        // Initialize
        cleanupXR().then(setupRestartButton);

        console.log('✅ Ready for restart');
};



ARExperience.prototype.playAudio = function(audioName) {
    console.log(`🔍 Trying to play: '${audioName}'`);
    
    const audio = this[audioName];
    
    if (!audio) {
        console.error(`❌ Audio property '${audioName}' not found`);
        
        // Show available audio properties for debugging
        console.log('🔍 Available audio properties:');
        Object.getOwnPropertyNames(this).forEach(prop => {
            if (prop.toLowerCase().includes('audio') && this[prop] instanceof Audio) {
                console.log(`  - ${prop}`);
            }
        });
        return;
    }
    
    if (!(audio instanceof Audio)) {
        console.error(`❌ '${audioName}' is not an Audio element`);
        return;
    }
    
    // Reset audio to beginning
    audio.currentTime = 0;
    
    console.log(`🔊 Playing audio: ${audioName}`);
    
    // Play the audio
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log(`✅ ${audioName} started playing`);
        }).catch(error => {
            console.error(`❌ Failed to play ${audioName}:`, error.message);
            
            // Common solutions for audio play failures
            if (error.name === 'NotAllowedError') {
                console.log('💡 Try playing after user interaction (click/touch)');
            }
        });
    }    
    return audio;
};




