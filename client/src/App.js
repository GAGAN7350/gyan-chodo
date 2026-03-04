import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [gyans, setGyans] = useState([]);
  const [newGyan, setNewGyan] = useState("");
  const [loading, setLoading] = useState(true);
  const [votedItems, setVotedItems] = useState({}); // Stores { gyan_id: "wah_wah" OR "chup_kar" }

  const fetchGyan = async () => {
    try {
      const response = await fetch('http://localhost:5000/feed');
      const data = await response.json();
      setGyans(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };

  const postGyan = async (e) => {
    e.preventDefault();
    if (!newGyan.trim()) return;
    try {
      const response = await fetch(`https://gyan-chodo-backend.onrender.com/update-count/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newGyan, author: "Founder" })
      });
      if (response.ok) {
        setNewGyan(""); 
        setTimeout(fetchGyan, 100);
      }
    } catch (err) {
      console.error("Post Error:", err);
    }
  };

  const sendVoteUpdate = async (id, type, direction) => {
    await fetch(`http://localhost:5000/update-count/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, direction })
    });
  };

  // THE MASTER VOTE HANDLER
  const handleVote = async (id, clickedType) => {
    const existingVote = votedItems[id];

    // Situation 1: Clicking the same button again -> Remove the vote (Toggle OFF)
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
      // 1. Remove the old vote
      await sendVoteUpdate(id, existingVote, 'down');
      // 2. Add the new vote
      await sendVoteUpdate(id, clickedType, 'up');
      setVotedItems(prev => ({ ...prev, [id]: clickedType }));
    } 
    // Situation 3: First time voting on this item
    else {
      await sendVoteUpdate(id, clickedType, 'up');
      setVotedItems(prev => ({ ...prev, [id]: clickedType }));
    }

    // Refresh data to see the counts move
    fetchGyan();
  };

  useEffect(() => {
    fetchGyan();
    const interval = setInterval(fetchGyan, 5000);
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
          {loading ? <p>Loading...</p> : gyans.map((g) => (
            <div key={g.gyan_id} className="gyan-card">
              <p className="content">"{g.content}"</p>
              <p className="author">— {g.author_name}</p>
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
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
