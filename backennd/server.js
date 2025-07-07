const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../html'))); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/login.html'));
});

app.use(express.static(path.join(__dirname, '../')));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'auth_db'
});

db.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL Database!");
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
            return res.send({ success: false, message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, results[0].password);
        if (match) {
            res.send({ success: true, message: "Login successful!" });
        } else {
            res.send({ success: false, message: "Invalid credentials" });
        }
    });
});


app.post('/signup', async (req, res) => {
    const { name, username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            'INSERT INTO users (name, username, password) VALUES (?, ?, ?)',
            [name, username, hashedPassword],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        res.send({ success: false, message: 'Username already exists!' });
                    } else {
                        throw err;
                    }
                } else {
                    res.send({ success: true, message: "Registration successful!" });
                }
            }
        );
    } catch (error) {
        res.status(500).send({ success: false, message: "Something went wrong!" });
    }
});

app.post('/api/bookmark', (req, res) => {
    const { username, courseId } = req.body;
    console.log("Received bookmark request:", { username, courseId }); 

    if (!username || !courseId) {
        return res.status(400).json({ success: false, message: 'Missing username or courseId' });
    }

    db.query(
        'SELECT * FROM bookmarks WHERE username = ? AND course_id = ?',
        [username, courseId],
        (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            if (results.length > 0) {
                return res.status(409).json({ success: false, message: 'Already bookmarked' });
            }

            db.query(
                'INSERT INTO bookmarks (username, course_id) VALUES (?, ?)',
                [username, courseId],
                (err, result) => {
                    if (err) {
                        console.error("Insert failed:", err);
                        return res.status(500).json({ success: false, message: 'Insert failed' });
                    }

                    return res.status(200).json({ success: true, message: 'Bookmark saved' });
                }
            );
        }
    );
});


app.get('/api/bookmarks', (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ success: false, message: 'Username required' });
    }

    db.query(
        'SELECT course_id FROM bookmarks WHERE username = ?',
        [username],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            const courseIds = results.map(row => row.course_id);
            res.status(200).json({ success: true, bookmarks: courseIds });
        }
    );
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
