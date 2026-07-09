// routes/contactRoutes.js
const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const router = express.Router();

// Nodemailer transporter (same as OTP)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Test transporter
transporter.verify(function(error, success) {
    if (error) {
        console.log("Transporter Error:", error);
    } else {
        console.log("Transporter ready to send emails ✔");
    }
});

// POST /api/contact
router.post("/", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, msg: "All fields are required." });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER, // must match your Gmail
            to: process.env.EMAIL_USER,   // receive in your own inbox
            subject: `New Contact Us Message from ${name}`,
            html: `
                <h2>New Contact Us Message</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, msg: "Message sent successfully!" });

    } catch (err) {
        console.error("Error sending Contact Us email:", err);
        res.status(500).json({ success: false, msg: "Error sending message. Check server logs." });
    }
});

module.exports = router;
