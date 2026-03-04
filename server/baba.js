const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '7350', // Same password as before!
    database: 'gyan_chodo_db',
});

const facts = [
    "Did you know? SQL was originally called SEQUEL, but they changed it because of a trademark issue. Aukat mein raho!",
    "Fact: The first computer bug was an actual moth trapped in a relay. Don't be a moth.",
    "Gyan: 90% of a developer's life is spent staring at a screen wondering why it doesn't work. The other 10% is wondering why it DOES work.",
    "Pro Tip: If you delete the database, you don't have to fix the bugs. Think about it."
];

async function dropGyan() {
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    try {
        await pool.query("INSERT INTO gyans (content, author_name) VALUES (?, ?)", [randomFact, 'Gyani Baba']);
        console.log("🙏 Gyani Baba just dropped some knowledge!");
    } catch (err) {
        console.error("Baba is tired:", err.message);
    }
}

// Drop gyan every 30 seconds
setInterval(dropGyan, 30000);
console.log("🤖 Gyani Baba is awake and meditating...");