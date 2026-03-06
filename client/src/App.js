import React, { useState } from 'react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [securityAnalysis, setSecurityAnalysis] = useState({ message: '', color: '#888' });

    const analyzePassword = (pass) => {
        if (!pass) return { message: '', color: '#888' };
        if (pass.length < 6) return { message: '❌ HACKABLE IN MILLISECONDS', color: '#ff4d4d' };
        if (!/[0-9]/.test(pass) || !/[A-Z]/.test(pass)) return { message: '⚠️ VULNERABLE TO BRUTE FORCE', color: '#ffa500' };
        return { message: '🛡️ SECURE ENCRYPTION READY', color: '#00ff88' };
    };

    const handlePasswordChange = (e) => {
        const pass = e.target.value;
        setFormData({ ...formData, password: pass });
        setSecurityAnalysis(analyzePassword(pass));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/login' : '/register';
        // REPLACE THE URL BELOW WITH YOUR ACTUAL RENDER URL
        const backendURL = `https://YOUR-RENDER-URL.onrender.com${endpoint}`;

        console.log(`Attempting to ${isLogin ? 'Login' : 'Register'} at: ${backendURL}`);

        try {
            const response = await fetch(backendURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log("Server Response:", data);

            if (response.ok) {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.username || formData.username);
                    alert(`SUCCESS: ${isLogin ? 'Logged In' : 'User Initialized'}`);
                    // You can redirect to feed here: window.location.href = '/feed';
                } else {
                    alert(data.message || "Action Successful");
                }
            } else {
                alert(`FAILED: ${data.error || data.message || 'Unknown Error'}`);
            }
        } catch (err) {
            console.error("Connection error:", err);
            alert("CANNOT REACH SERVER. Is the Render backend awake?");
        }
    };

    const styles = {
        container: {
            backgroundColor: '#0d1117',
            color: '#c9d1d9',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace'
        },
        card: {
            background: '#161b22',
            padding: '40px',
            borderRadius: '8px',
            border: '1px solid #30363d',
            width: '350px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        },
        input: {
            width: '100%',
            padding: '12px',
            margin: '10px 0',
            backgroundColor: '#0d1117',
            border: '1px solid #30363d',
            color: 'white',
            borderRadius: '5px',
            boxSizing: 'border-box',
            outline: 'none'
        },
        button: {
            width: '100%',
            padding: '12px',
            backgroundColor: '#238636',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '10px'
        },
        toggle: {
            marginTop: '20px',
            color: '#58a6ff',
            cursor: 'pointer',
            fontSize: '0.8rem',
            textAlign: 'center',
            textDecoration: 'underline'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={{ textAlign: 'center', color: '#58a6ff', marginBottom: '20px' }}>
                    {isLogin ? '> AUTH_LOGIN' : '> CREATE_USER'}
                </h1>
                
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input 
                            style={styles.input}
                            placeholder="username" 
                            required
                            onChange={(e) => setFormData({...formData, username: e.target.value})} 
                        />
                    )}
                    <input 
                        style={styles.input}
                        type="email"
                        placeholder="email_address" 
                        required
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                    <input 
                        style={styles.input}
                        type="password" 
                        placeholder="password" 
                        required
                        onChange={handlePasswordChange} 
                    />
                    
                    <div style={{ fontSize: '0.7rem', color: securityAnalysis.color, marginBottom: '15px', minHeight: '1rem' }}>
                        {securityAnalysis.message}
                    </div>

                    <button type="submit" style={styles.button}>
                        {isLogin ? 'EXECUTE LOGIN' : 'INITIALIZE USER'}
                    </button>
                </form>

                <div style={styles.toggle} onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? '[ Register New Account ]' : '[ Existing User Login ]'}
                </div>
            </div>
        </div>
    );
};

export default Auth;
