const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Database Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10
});

// --- AUTO-MIGRATION LOGIC (Runs on Startup) ---
const initDB = () => {
    // 1. Users Table
    db.query(`CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Gyans Table (Main Posts)
    db.query(`CREATE TABLE IF NOT EXISTS gyans (
        gyan_id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, () => {
        // Automatically add user_id column if it doesn't exist (Aiven Fix)
        db.query(`ALTER TABLE gyans ADD COLUMN user_id INT`, (err) => {
            if (err) console.log("Note: user_id column already exists.");
        });
    });

    // 3. Reactions Table (Wah Wah / Chup Kar)
    db.query(`CREATE TABLE IF NOT EXISTS reactions (
        reaction_id INT AUTO_INCREMENT PRIMARY KEY,
        gyan_id INT NOT NULL,
        user_id INT NOT NULL,
        type ENUM('wah_wah', 'chup_kar') NOT NULL,
        UNIQUE KEY unique_reaction (gyan_id, user_id),
        FOREIGN KEY (gyan_id) REFERENCES gyans(gyan_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )`);

    console.log("✅ Database Fully Synced: Users, Gyans, and Reactions active.");
};

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access Denied: Log in first" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid Token" });
        req.user = user;
        next();
    });
};

// --- ROUTES ---

// 1. Register
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        db.query("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)", 
        [username, email, hash], (err) => {
            if (err) return res.status(500).json({ error: "Username or Email already exists" });
            res.json({ message: "User created successfully" });
        });
    } catch (err) {
        res.status(500).json({ error: "Encryption failed" });
    }
});

// 2. Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ error: "User not found" });
        const match = await bcrypt.compare(password, results[0].password_hash);
        if (!match) return res.status(401).json({ error: "Incorrect password" });
        
        const token = jwt.sign({ id: results[0].user_id, name: results[0].username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: results[0].username });
    });
});

// 3. Post a Gyan
app.post('/post-gyan', authenticateToken, (req, res) => {
    const { content } = req.body;
    db.query("INSERT INTO gyans (content, user_id) VALUES (?, ?)", [content, req.user.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Gyan stored in database" });
    });
});

// 4. React (Wah Wah / Chup Kar)
app.post('/react', authenticateToken, (req, res) => {
    const { gyan_id, type } = req.body;
    const sql = `INSERT INTO reactions (gyan_id, user_id, type) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE type = VALUES(type)`;

    db.query(sql, [gyan_id, req.user.id, type], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Reaction updated" });
    });
});

// 5. Get Feed (With Username & Counts)
app.get('/feed', (req, res) => {
    const sql = `
        SELECT g.*, u.username,
        (SELECT COUNT(*) FROM reactions WHERE gyan_id = g.gyan_id AND type = 'wah_wah') AS wah_wah_count,
        (SELECT COUNT(*) FROM reactions WHERE gyan_id = g.gyan_id AND type = 'chup_kar') AS chup_kar_count
        FROM gyans g
        LEFT JOIN users u ON g.user_id = u.user_id
        ORDER BY g.created_at DESC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Start Server
const PORT = 10000;
app.listen(PORT, () => {
    console.log(`🚀 Terminal Server Active on Port ${PORT}`);
    initDB();
});
