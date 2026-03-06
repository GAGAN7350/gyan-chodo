import React, { useState } from 'react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [securityAnalysis, setSecurityAnalysis] = useState({ message: '', color: '#888' });

    const analyzePassword = (pass) => {
        if (!pass) return { message: '', color: '#888' };
        if (pass.length < 6) return { message: ' BRO EVEN JOSHI WILL CRACK THIS', color: '#ff4d4d' };
        if (!/[0-9]/.test(pass) || !/[A-Z]/.test(pass)) return { message: '⚠️ VULNERABLE TO BRUTE FORCE', color: '#ffa500' };
        return { message: '🛡️ SECURE ENCRYPTION READY', color: '#00ff88' };
    };

    const handlePasswordChange = (e) => {
        const pass = e.target.value;
        setFormData({ ...formData, password: pass });
        setSecurityAnalysis(analyzePassword(pass));
    };

    const styles = {
        container: {
            backgroundColor: '#0d1117',
            color: '#c9d1d9',
            height: '100vh',
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
            boxSizing: 'border-box'
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
            textAlign: 'center'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={{ textAlign: 'center', color: '#58a6ff' }}>
                    {isLogin ? '> AUTH_LOGIN' : '> CREATE_USER'}
                </h1>
                <form onSubmit={(e) => e.preventDefault()}>
                    {!isLogin && (
                        <input 
                            style={styles.input}
                            placeholder="username" 
                            onChange={(e) => setFormData({...formData, username: e.target.value})} 
                        />
                    )}
                    <input 
                        style={styles.input}
                        placeholder="email_address" 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                    <input 
                        style={styles.input}
                        type="password" 
                        placeholder="password" 
                        onChange={handlePasswordChange} 
                    />
                    
                    <div style={{ fontSize: '0.7rem', color: securityAnalysis.color, marginBottom: '10px' }}>
                        {securityAnalysis.message}
                    </div>

                    <button style={styles.button}>{isLogin ? 'EXECUTE LOGIN' : 'INITIALIZE USER'}</button>
                </form>
                <div style={styles.toggle} onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? '[ Register New Account ]' : '[ Existing User Login ]'}
                </div>
            </div>
        </div>
    );
};

export default Auth;
