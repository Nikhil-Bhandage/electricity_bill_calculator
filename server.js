const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (index.html, style.css, script.js) from the current folder
app.use(express.static(__dirname));

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Default XAMPP username
    password: '',      // Default XAMPP password (leave empty)
    database: 'power_grid'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL Database: power_grid');
});

// --- ROUTES ---

// 1. Serve the Home Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Get Billing Configuration
app.get('/api/config', (req, res) => {
    db.query('SELECT * FROM config WHERE id = 1', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results[0]);
    });
});

// 3. Update Billing Configuration
app.post('/api/config', (req, res) => {
    const { days, rate, fixed, tax } = req.body;
    const query = 'UPDATE config SET days = ?, rate = ?, fixed_charge = ?, tax = ? WHERE id = 1';
    db.query(query, [days, rate, fixed, tax], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Configuration updated' });
    });
});

// 4. Get All Appliances
app.get('/api/appliances', (req, res) => {
    db.query('SELECT * FROM appliances', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 5. Add or Update Appliance
app.post('/api/appliances', (req, res) => {
    const { id, name, power, hours, qty } = req.body;

    if (id) {
        // Update existing
        const query = 'UPDATE appliances SET name = ?, power = ?, hours = ?, qty = ? WHERE id = ?';
        db.query(query, [name, power, hours, qty, id], (err) => {
            if (err) return res.status(500).send(err);
            res.json({ status: 'updated' });
        });
    } else {
        // Add new
        const query = 'INSERT INTO appliances (name, power, hours, qty) VALUES (?, ?, ?, ?)';
        db.query(query, [name, power, hours, qty], (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ id: result.insertId });
        });
    }
});

// 6. Delete Appliance
app.delete('/api/appliances/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM appliances WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ status: 'deleted' });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});