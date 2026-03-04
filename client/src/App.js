import React, { useEffect, useState } from 'react';
import './App.css';

// The base URL for your backend on Render
const API_BASE_URL = "https://gyan-chodo-backend.onrender.com";

function App() {
  const [gyans, setGyans] = useState([]);
  const [newGyan, setNewGyan] = useState("");
  const [loading, setLoading] = useState(true);
  const [votedItems, setVotedItems] = useState({}); // Stores { gyan_id: "wah_wah" OR "chup_kar" }

  // 1. FETCH ALL GYANS
  const fetchGyan = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/feed`);
      const data = await response.json();
      setGyans(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };

  
  
  
  
  
  // 2. POST NEW GYAN
  const postGyan = async (e) => {
    e.preventDefault();
    if (!newGyan.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/post-gyan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newGyan, author: "Founder" })
      });
      
      if (response.ok) {
        setNewGyan(""); 
        // Small delay to let DB update before refreshing
        setTimeout(fetchGyan, 300);
      }
    } catch (err) {
      console.error("Post Error:", err);
    }
  };

  // 3. SEND VOTE TO BACKEND (Used by handleVote)
  const sendVoteUpdate = async (id, type, direction) => {
    try {
      await fetch(`${API_BASE_URL}/update-count/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, direction })
      });
    } catch (err) {
      console.error("Vote Update Error:", err);
    }
  };

  // 4. THE MASTER VOTE HANDLER (Toggle Logic)
  const handleVote = async (id, clickedType) => {
    const existingVote = votedItems[id];

    // Situation 1: Clicking the same button again -> Remove the vote
    if (existingVote === clickedType) {
      await sendVoteUpdate(id, clickedType, 'down');
      setVotedItems(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } 
    // Situation 2: Clicking the OTHER button -> Switch the vote
    else if (existingVote && existingVote !== clickedType) {
      await sendVoteUpdate(id, existingVote, 'down');
      await sendVoteUpdate(id, clickedType, 'up');
      setVotedItems(prev => ({ ...prev, [id]: clickedType }));
    } 
    // Situation 3: First time voting on this item
    else {
      await sendVoteUpdate(id, clickedType, 'up');
      setVotedItems(prev => ({ ...prev, [id]: clickedType }));
    }

    // Refresh data to see the counts update
    fetchGyan();
  };

  // INITIAL LOAD & AUTO-REFRESH
  useEffect(() => {
    fetchGyan();
    // Refresh every 10 seconds to see other people's gyan
    const interval = setInterval(fetchGyan, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>✨ GYAN CHODO ✨</h1>
        
        <form onSubmit={postGyan} className="gyan-form">
          <input 
            type="text" 
            placeholder="Share some wisdom..." 
            value={newGyan}
            onChange={(e) => setNewGyan(e.target.value)}
          />
          <button type="submit" className="drop-btn">Drop Gyan 🚀</button>
        </form>
        
        <div className="feed">
          {loading ? (
            <p>Waking up the server... Please wait.</p>
          ) : (
            gyans.map((g) => (
              <div key={g.gyan_id} className="gyan-card">
                <p className="content">"{g.content}"</p>
                <p className="author">— {g.author_name || "Anonymous"}</p>
                
                <div className="actions">
                  <button 
                    className={`wah-btn ${votedItems[g.gyan_id] === 'wah_wah' ? 'active' : ''}`}
                    onClick={() => handleVote(g.gyan_id, 'wah_wah')}
                  >
                    🙏 Wah Wah ({g.wah_wah_count || 0})
                  </button>
                  
                  <button 
                    className={`chup-btn ${votedItems[g.gyan_id] === 'chup_kar' ? 'active' : ''}`}
                    onClick={() => handleVote(g.gyan_id, 'chup_kar')}
                  >
                    🤫 Chup Kar ({g.chup_kar_count || 0})
                  </button>
                </div>
              </div>
            ))
          )}
          {!loading && gyans.length === 0 && <p>No wisdom here yet. Be the first!</p>}
        </div>
      </header>
    </div>
  );
}

export default App;
