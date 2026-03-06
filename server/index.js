const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// JWT Secret - In production, move this to Render Environment Variables!
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_gyan_key';

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
};

let pool;

async function initDB() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log("Connecting to Aiven MySQL...");

        // 1. Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Gyans Table (Updated to link to user_id)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS gyans (
                gyan_id INT AUTO_INCREMENT PRIMARY KEY,
                content TEXT NOT NULL,
                author_name VARCHAR(255) DEFAULT 'Anonymous',
                user_id INT,
                wah_wah_count INT DEFAULT 0,
                chup_kar_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
            );
        `);

        // 3. Replies Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS replies (
                reply_id INT AUTO_INCREMENT PRIMARY KEY,
                gyan_id INT NOT NULL,
                user_id INT, 
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (gyan_id) REFERENCES gyans(gyan_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
            );
        `);
        
        console.log("✅ Database Ready: Users, Gyans, and Replies tables active.");
    } catch (err) {
        console.error("❌ Database Init Failed:", err.message);
    }
}

initDB();

// --- AUTH ROUTES ---

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Awareness Check: Simple warning for weak passwords (but we still hash it!)
        const isWeak = password.length < 6 || password === '123456';
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        );

        res.status(201).json({ 
            success: true, 
            message: isWeak ? "User registered. Warning: Your password is very weak!" : "User registered successfully!" 
        });
    } catch (err) {
        res.status(500).json({ error: "Registration failed. Username or Email might already exist." });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(404).json({ error: "User not found" });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.user_id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GYAN & REPLY ROUTES ---

app.get('/feed', async (req, res) => {
    try {
        // Fetches Gyans and their replies would be fetched separately or via JOIN
        const [rows] = await pool.query("SELECT * FROM gyans ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/post-gyan', async (req, res) => {
    const { content, author, userId } = req.body;
    try {
        await pool.query(
            "INSERT INTO gyans (content, author_name, user_id) VALUES (?, ?, ?)",
            [content, author || "Anonymous", userId || null]
        );
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

app.get('/replies/:gyanId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT r.*, u.username FROM replies r LEFT JOIN users u ON r.user_id = u.user_id WHERE r.gyan_id = ? ORDER BY r.created_at ASC", 
            [req.params.gyanId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/post-reply', async (req, res) => {
    const { gyanId, userId, content } = req.body;
    try {
        await pool.query(
            "INSERT INTO replies (gyan_id, user_id, content) VALUES (?, ?, ?)",
            [gyanId, userId || null, content]
        );
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
