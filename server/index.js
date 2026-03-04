const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Create the Database Configuration Object
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false // Required for Aiven
    }
};

let pool;

// 2. Initialize Database and Table
async function initDB() {
    try {
        // Create the pool using the config above
        pool = mysql.createPool(dbConfig);
        console.log("Connecting to Aiven MySQL...");
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS gyans (
                gyan_id INT AUTO_INCREMENT PRIMARY KEY,
                content TEXT NOT NULL,
                author_name VARCHAR(255) DEFAULT 'Anonymous',
                wah_wah_count INT DEFAULT 0,
                chup_kar_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await pool.query(createTableQuery);
        console.log("✅ Database is ready and table 'gyans' exists!");
    } catch (err) {
        console.error("❌ Database Init Failed:", err.message);
    }
}

initDB();

// 3. API Routes
app.get('/feed', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM gyans ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/post-gyan', async (req, res) => {
    const { content, author } = req.body;
    try {
        await pool.query(
            "INSERT INTO gyans (content, author_name) VALUES (?, ?)",
            [content, author || "Founder"]
        );
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "DB Error: " + err.message });
    }
});

app.patch('/update-count/:id', async (req, res) => {
    const { id } = req.params;
    const { type, direction } = req.body;
    
    // Safety check for column name to prevent injection
    const column = type === 'wah_wah' ? 'wah_wah_count' : 'chup_kar_count';
    const adjustment = direction === 'up' ? '+ 1' : '- 1';
    
    try {
        await pool.query(
            `UPDATE gyans SET ${column} = GREATEST(0, ${column} ${adjustment}) WHERE gyan_id = ?`,
            [id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Start Server
// Use process.env.PORT so Render can assign its own port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server spinning on port ${PORT}`);
});
