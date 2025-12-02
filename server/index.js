const express = require("express");
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

app.use(express.json());
require('dotenv').config({path: '../.env'});

const users = [
    { 
        id: 1, 
        username: 'demo', 
        password: '$2a$10$...' // hashed password for 'password123'
    }
];

const APIkey = process.env.API_KEY;



// Register new user
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    
    // Check if user exists
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: "User already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save user
    const newUser = { id: users.length + 1, username, password: hashedPassword };
    users.push(newUser);
    
    res.status(201).json({ message: "User registered successfully" });
});

// Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    
    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token });
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
};

app.get("/weather/:cityname", authenticateToken,  async (req, res) => {
    const cityname = req.params.cityname;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityname}&appid=${APIkey}`;

    const response = await fetch(url);
    const data1 = await response.json();

    const wikiURL = `https://en.wikipedia.org/api/rest_v1/page/summary/${cityname}`;
    const response2 = await fetch(wikiURL);
    const data2 = await response2.json();
    res.json({
        temprature: data1.main.temp,
        wikiSum: data2.extract
    });
})

app.listen(3000, () => {
  console.log("Server running on port 3000");
});