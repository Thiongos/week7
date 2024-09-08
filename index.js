import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory of the module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create a connection to the database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database.');

  // Create users table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    );
  `;

  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creating table:', err.stack);
      return;
    }
    console.log('Table created or already exists.');
  });
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (token == null) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user; // Attach user info to request object
    next();
  });
};

// User registration
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const [rows] = await db.promise().query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (rows.length > 0) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User login
app.post('/api/auth/login', [
  body('email').isEmail().notEmpty(),
  body('password').isString().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Expense management
let expenses = [];

app.get('/api/expenses', authenticateToken, (req, res) => {
  res.json(expenses);
});

app.post('/api/expenses', authenticateToken, (req, res) => {
  const expense = req.body;
  expenses.push(expense);
  res.status(201).json(expense);
});

app.put('/api/expenses/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = expenses.findIndex(exp => exp.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  expenses[index] = req.body;
  res.json(expenses[index]);
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = expenses.findIndex(exp => exp.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  expenses = expenses.filter(exp => exp.id !== id);
  res.status(204).send();
});

// Get total expense
app.get('/api/expense', authenticateToken, (req, res) => {
  const totalExpense = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  res.json({ total: totalExpense });
});

// Serve HTML files
app.get('/edit-expense', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/edit_expense.html'));
});

app.get('/add-expense', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/add_expense.html'));
});

app.get('/view-expense', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/view_expense.html'));
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Start server
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
