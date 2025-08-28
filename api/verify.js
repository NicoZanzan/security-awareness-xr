// === FILE 2: /api/verify.js ===
// Endpoint to verify if user is still authenticated

export default function handler(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const isAuthenticated = cookies.authenticated === 'true';
    const authTimestamp = parseInt(cookies['auth-timestamp'] || '0');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Check if authentication is valid and not expired
    const isValid = isAuthenticated && (now - authTimestamp < oneHour);
    
    res.status(200).json({ 
        authenticated: isValid,
        remainingTime: isValid ? Math.max(0, oneHour - (now - authTimestamp)) : 0
    });
}

// Helper function to parse cookies
function parseCookies(cookieString) {
    const cookies = {};
    if (cookieString) {
        cookieString.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = decodeURIComponent(value);
            }
        });
    }
    return cookies;
}