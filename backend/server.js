// server.js
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

// Create main app for existing routes (port 5000)
const app = express();

// Create separate app for earthquake prediction (port 6000)
const earthquakeApp = express();

// Connect MongoDB
connectDB();

// ============================================
// MIDDLEWARE FOR MAIN APP (Port 5000)
// ============================================
app.use(cors());
app.use(express.json());

// ============================================
// MIDDLEWARE FOR EARTHQUAKE APP (Port 6000)
// ============================================
earthquakeApp.use(cors());
earthquakeApp.use(express.json());

// ============================================
// EXISTING ROUTES (Port 5000)
// ============================================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/contact", require("./routes/contactRoutes")); 
app.use("/api/module", require("./routes/moduleRoutes"));
app.use('/api/draw2d', require('./routes/draw2DRoutes'));

// ============================================
// EARTHQUAKE PREDICTION ROUTES (Port 6000)
// ============================================
const earthquakePredictionRoutes = require("./routes/earthquakePrediction");
earthquakeApp.use("/api/earthquake", earthquakePredictionRoutes);

// Test route for earthquake app
earthquakeApp.get("/", (req, res) => {
    res.json({
        message: "🌍 Earthquake Prediction API is running!",
        version: "1.0.0",
        status: "active",
        endpoints: {
            metrics: "GET /api/earthquake/metrics",
            predict: "POST /api/earthquake/predict",
            statistics: "GET /api/earthquake/statistics"
        }
    });
});

// ============================================
// START BOTH SERVERS
// ============================================

// Main server on port 5000
app.listen(5000, () => {
    console.log("✅ Main server running on port 5000 ✔");
    console.log("   - Auth routes: /api/auth");
    console.log("   - Contact routes: /api/contact");
    console.log("   - Module routes: /api/module");
    console.log("   - Draw2D routes: /api/draw2d");
});

// Error handling for port conflicts
process.on('uncaughtException', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port already in use: ${err.port}`);
        console.error('Please close the application using that port and restart.');
    } else {
        console.error('Uncaught Exception:', err);
    }
});