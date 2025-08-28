// main.js - Application entry point with server-side authentication

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.checkingAuth = false;
    }

    // Check if user is authenticated via server
    async checkAuthentication() {
        try {
            const response = await fetch('/api/verify');
            const data = await response.json();
            this.isAuthenticated = data.authenticated;
            return this.isAuthenticated;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    // Show login form
    showLoginForm() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
            ">
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    text-align: center;
                    min-width: 300px;
                ">
                    <h2 style="color: #333; margin-bottom: 1.5rem;">AR App Access</h2>
                    <form id="loginForm">
                        <div style="margin-bottom: 1rem;">
                            <input 
                                type="password" 
                                id="passwordInput" 
                                placeholder="Enter password"
                                style="
                                    width: 100%;
                                    padding: 12px;
                                    border: 2px solid #ddd;
                                    border-radius: 5px;
                                    font-size: 16px;
                                    box-sizing: border-box;
                                "
                                required
                            />
                        </div>
                        <button 
                            type="submit"
                            style="
                                width: 100%;
                                padding: 12px;
                                background: linear-gradient(45deg, #667eea, #764ba2);
                                color: white;
                                border: none;
                                border-radius: 5px;
                                font-size: 16px;
                                cursor: pointer;
                                transition: opacity 0.3s;
                            "
                            onmouseover="this.style.opacity='0.9'"
                            onmouseout="this.style.opacity='1'"
                        >
                            Access AR App
                        </button>
                    </form>
                    <div id="errorMessage" style="
                        color: #d32f2f;
                        margin-top: 1rem;
                        display: none;
                    "></div>
                    <div id="loadingMessage" style="
                        color: #666;
                        margin-top: 1rem;
                        display: none;
                    ">Verifying...</div>
                </div>
            </div>
        `;

        // Add form submission handler
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        // Focus on password input
        document.getElementById('passwordInput').focus();
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        
        const passwordInput = document.getElementById('passwordInput');
        const errorMessage = document.getElementById('errorMessage');
        const loadingMessage = document.getElementById('loadingMessage');
        
        const password = passwordInput.value;
        
        if (!password) {
            this.showError('Please enter a password');
            return;
        }

        // Show loading state
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        passwordInput.disabled = true;

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.success) {
                this.isAuthenticated = true;
                this.initializeARApp();
            } else {
                this.showError('Invalid password. Please try again.');
                passwordInput.disabled = false;
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showError('Connection error. Please try again.');
            passwordInput.disabled = false;
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    // Show error message
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    // Initialize the AR application
    initializeARApp() {
        // Restore original page content
        document.body.innerHTML = `
            <!-- Landing Page -->
            <div class="landing-page" id="landingPage" style="text-align: center; margin: 0 auto; width: 100%;">
                <div style="margin-bottom: 1rem;">
                    <img src="./assets/images/startscreen.png" alt="" style="width: 50%; height: auto; display: inline-block;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <button class="start-button" id="startButton" style="display: inline-block;">Start</button>
                </div>
                <p class="device-note" style="text-align: center;">Note: Best experienced with an WebXR compatible device</p>
            </div>

            <div class="landing-page" id="endPage">
                <h1>That's all Folks!</h1>
                <p class="subtitle">Want to dive in again? Use button RESTART</p>
                <button class="start-button" id="restartButton">Restart</button>      
            </div>

            <!-- AR View -->
            <div class="ar-view" id="arView">       
                <canvas id="arCanvas"></canvas>
            </div>
        `;
        
        // Initialize AR experience after DOM is ready
        this.setupARExperience();
    }

    // Setup AR experience with page transitions
    setupARExperience() {
        const startButton = document.getElementById('startButton');
        const restartButton = document.getElementById('restartButton');
        const landingPage = document.getElementById('landingPage');
        const endPage = document.getElementById('endPage');
        const arView = document.getElementById('arView');

        // Start AR experience
        startButton.addEventListener('click', () => {
            this.startARExperience(landingPage, arView);
        });

        // Restart AR experience
        restartButton.addEventListener('click', () => {
            this.restartARExperience(endPage, landingPage);
        });

        // Initialize your AR experience class
        try {
            this.arExperience = new ARExperience();
            
            // Listen for AR experience end event (you may need to add this to your ARExperience class)
            document.addEventListener('arExperienceEnded', () => {
                this.endARExperience(arView, endPage);
            });
        } catch (error) {
            console.error('Failed to initialize AR experience:', error);
            this.showARError('Failed to initialize AR experience. Please check your device compatibility.');
        }
    }

    // Start AR experience
    startARExperience(landingPage, arView) {
        landingPage.style.display = 'none';
        arView.style.display = 'block';
        document.body.classList.add('ar-active');
        
        // Start your AR experience
        if (this.arExperience && typeof this.arExperience.start === 'function') {
            this.arExperience.start();
        }
    }

    // End AR experience and show end page
    endARExperience(arView, endPage) {
        arView.style.display = 'none';
        endPage.style.display = 'flex';
        document.body.classList.remove('ar-active');
        
        // Stop AR experience
        if (this.arExperience && typeof this.arExperience.stop === 'function') {
            this.arExperience.stop();
        }
    }

    // Restart AR experience
    restartARExperience(endPage, landingPage) {
        endPage.style.display = 'none';
        landingPage.style.display = 'flex';
        document.body.classList.remove('ar-active');
        
        // Reset AR experience
        if (this.arExperience && typeof this.arExperience.reset === 'function') {
            this.arExperience.reset();
        }
    }

    // Show AR error
    showARError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h3>AR Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                margin-top: 10px;
                padding: 8px 16px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            ">Reload Page</button>
        `;
        document.body.appendChild(errorDiv);
    }

    // Start the authentication flow
    async start() {
        if (this.checkingAuth) return;
        this.checkingAuth = true;

        // First check if already authenticated
        const isAuth = await this.checkAuthentication();
        
        if (isAuth) {
            this.initializeARApp();
        } else {
            this.showLoginForm();
        }
        
        this.checkingAuth = false;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const authManager = new AuthManager();
    authManager.start();
});