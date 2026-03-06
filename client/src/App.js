import React, { useState, useEffect } from 'react';

const GyanApp = () => {
    // --- STATE MANAGEMENT ---
    const [isLogin, setIsLogin] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(localStorage.getItem('username'));
    const [gyans, setGyans] = useState([]);
    const [newGyan, setNewGyan] = useState("");
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });

    const backendURL = "https://gyan-chodo-backend.onrender.com";

    // --- API CALLS ---
    const fetchFeed = async () => {
        try {
            const res = await fetch(`${backendURL}/feed`);
            const data = await res.json();
            setGyans(data);
        } catch (err) { console.error("Feed Fetch Error", err); }
    };

    useEffect(() => { fetchFeed(); }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/login' : '/register';
        const res = await fetch(`${backendURL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            setToken(data.token);
            setUser(data.username);
        } else {
            alert(data.message || data.error);
            if (!isLogin && data.message) setIsLogin(true); // Switch to login after register
        }
    };

    const postGyan = async () => {
        if (!newGyan) return;
        await fetch(`${backendURL}/post-gyan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: newGyan })
        });
        setNewGyan("");
        fetchFeed();
    };

    const handleReaction = async (gyanId, type) => {
        await fetch(`${backendURL}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ gyan_id: gyanId, type })
        });
        fetchFeed();
    };

    const logout = () => {
        localStorage.clear();
        window.location.reload();
    };

    // --- STYLES ---
    const s = {
        container: { backgroundColor: '#0d1117', color: '#c9d1d9', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' },
        card: { background: '#161b22', padding: '20px', borderRadius: '8px', border: '1px solid #30363d', marginBottom: '15px', maxWidth: '500px', margin: '15px auto' },
        input: { width: '100%', padding: '12px', margin: '10px 0', backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#00ff88', borderRadius: '5px', boxSizing: 'border-box' },
        btn: { padding: '10px 15px', cursor: 'pointer', fontWeight: 'bold', border: 'none', borderRadius: '4px', marginRight: '10px' },
        postBtn: { backgroundColor: '#238636', color: 'white', width: '100%' },
        reactBtn: { backgroundColor: '#30363d', color: '#c9d1d9', fontSize: '0.7rem' }
    };

    // --- UI LOGIC ---
    if (!token) {
        return (
            <div style={s.container}>
                <div style={s.card}>
                    <h2 style={{color: '#58a6ff'}}>{isLogin ? '> AUTH_LOGIN' : '> CREATE_USER'}</h2>
                    <form onSubmit={handleAuth}>
                        {!isLogin && <input style={s.input} placeholder="username" onChange={e => setFormData({...formData, username: e.target.value})} />}
                        <input style={s.input} type="email" placeholder="email" onChange={e => setFormData({...formData, email: e.target.value})} />
                        <input style={s.input} type="password" placeholder="password" onChange={e => setFormData({...formData, password: e.target.value})} />
                        <button type="submit" style={{...s.btn, ...s.postBtn}}>{isLogin ? 'EXECUTE LOGIN' : 'INITIALIZE'}</button>
                    </form>
                    <p onClick={() => setIsLogin(!isLogin)} style={{cursor: 'pointer', color: '#58a6ff', marginTop: '15px'}}>[ {isLogin ? 'Register New' : 'Back to Login'} ]</p>
                </div>
            </div>
        );
    }

    return (
        <div style={s.container}>
            <div style={{display: 'flex', justifyContent: 'space-between', maxWidth: '500px', margin: '0 auto'}}>
                <span>USER: {user}</span>
                <span onClick={logout} style={{cursor: 'pointer', color: 'red'}}>[ LOGOUT ]</span>
            </div>

            <div style={s.card}>
                <textarea style={{...s.input, height: '80px'}} value={newGyan} onChange={e => setNewGyan(e.target.value)} placeholder="Enter new Gyan for the database..." />
                <button onClick={postGyan} style={{...s.btn, ...s.postBtn}}>UPLOAD_GYAN</button>
            </div>

            {gyans.map(g => (
                <div key={g.gyan_id} style={s.card}>
                    <p style={{fontSize: '1.1rem'}}>{`>> ${g.content}`}</p>
                    <small style={{color: '#58a6ff'}}>SOURCE: {g.username || "Legacy_Admin"}</small>
                    <div style={{marginTop: '15px'}}>
                        <button onClick={() => handleReaction(g.gyan_id, 'wah_wah')} style={{...s.btn, ...s.reactBtn}}>👏 WAH_WAH ({g.wah_wah_count || 0})</button>
                        <button onClick={() => handleReaction(g.gyan_id, 'chup_kar')} style={{...s.btn, ...s.reactBtn}}>🤫 CHUP_KAR ({g.chup_kar_count || 0})</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GyanApp;
