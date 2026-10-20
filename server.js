const express = require('express');
const cors = require('cors');

const app = express();

// CORS allows all connections without blocking
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Main Route
app.get('/', (req, res) => {
    res.json({ 
        message: "Server is running 24/7 on Vercel!", 
        status: "Online" 
    });
});

// CRITICAL FOR VERCEL: Export the app module instead of app.listen()
module.exports = app;
