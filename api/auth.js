export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { password } = req.body;
    
    // Get password from environment variable (set in Vercel dashboard)
    const correctPassword = process.env.APP_PASSWORD || "WendyMendy";
    
    if (password === correctPassword) {
        // Set secure HTTP-only cookie that expires in 1 hour
        res.setHeader('Set-Cookie', [
            'authenticated=true; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600',
            `auth-timestamp=${Date.now()}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
        ]);
        
        res.status(200).json({ 
            success: true, 
            message: 'Authentication successful' 
        });
    } else {
        // Add a small delay to prevent brute force attacks
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        res.status(401).json({ 
            success: false, 
            message: 'Invalid password' 
        });
    }
}