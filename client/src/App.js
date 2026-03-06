import React, { useState } from 'react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [securityTip, setSecurityTip] = useState('');

    const checkPasswordStrength = (pass) => {
        if (pass.length === 0) return "";
        if (pass.length < 6) return "even joshi could crack this in seconds!";
        if (!/[0-9]/.test(pass)) return "⚠️ WEAK:even joshi could crack this in seconds!";
        return "✅ STRONG: BUT NOT FOR ME!";
    };

    const handlePasswordChange = (e) => {
        const pass = e.target.value;
        setFormData({ ...formData, password: pass });
        setSecurityTip(checkPasswordStrength(pass));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/login' : '/register';
        const response = await fetch(`https://gyan-chodo-backend.onrender.com${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            alert("Logged in! Now you can post Gyans securely.");
        } else {
            alert(data.message || data.error);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
            <h2>{isLogin ? "Welcome Back" : "Join the Awareness Program"}</h2>
            <form onSubmit={handleSubmit}>
                {!isLogin && (
                    <input 
                        type="text" placeholder="Username" 
                        onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    />
                )}
                <input 
                    type="email" placeholder="Email" 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                />
                <input 
                    type="password" placeholder="Password" 
                    onChange={handlePasswordChange} 
                />
                
                {/* THE AWARENESS TOOL TIP */}
                <p style={{ color: securityTip.includes('✅') ? 'green' : 'red', fontSize: '0.8rem' }}>
                    {securityTip}
                </p>

                <button type="submit">{isLogin ? "Login" : "Register"}</button>
            </form>
            <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
            </button>
        </div>
    );
};

export default Auth;
