const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Aiven Connection Config
const dbConfig = {
    host: 'gyanchodo-gyanchodo69.d.aivencloud.com',
    port: 10939,
    user: 'avnadmin',
    password: 'AVNS_sll6wWHjTRT5SMcyt43', // <--- CLICK THE EYE ICON IN YOUR PHOTO
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
};

let pool;

// This function creates the table automatically if it doesn't exist
async function initDB() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log("Connecting to Aiven...");
        
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
        res.status(500).json({ error: "DB Error" });
    }
});

app.patch('/update-count/:id', async (req, res) => {
    const { id } = req.params;
    const { type, direction } = req.body;
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

app.listen(5000, () => {
    console.log("🚀 Server spinning on http://localhost:5000");
});