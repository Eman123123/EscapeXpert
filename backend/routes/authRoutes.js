// routes/authRoutes.js

const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

const router = express.Router();

// Store logout status for users (in production, use Redis)
const userLogoutStatus = new Map();

// =====================================================
//  EMAIL TRANSPORTER (GMAIL)
// =====================================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =====================================================
//  EMAIL SENDER
// =====================================================
const sendOTPEmail = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            html: `
                <div style="font-family: Arial; padding: 20px; text-align: center;">
                    <h2>Your OTP Code</h2>
                    <p>Use this OTP to continue:</p>
                    <h1 style="color:#354F52; letter-spacing:4px">${otp}</h1>
                    <p>This OTP expires in <b>5 minutes</b>.</p>
                </div>
            `,
        });
        console.log("✅ OTP sent to:", email);
        return true;
    } catch (err) {
        console.error("❌ Email error:", err);
        return false;
    }
};

// =====================================================
//  LOGOUT FROM VR MODULE
// =====================================================
router.post('/logout-from-vr', async (req, res) => {
    try {
        console.log('📡 VR module reported logout at:', new Date().toISOString());
        
        const { email } = req.body;
        
        if (email) {
            // Set logout flag for this user with timestamp
            userLogoutStatus.set(email, {
                loggedOut: true,
                timestamp: Date.now()
            });
            
            console.log(`🚪 Logout flag set for user: ${email}`);
            console.log('Current logout status map:', Array.from(userLogoutStatus.entries()));
            
            // Auto-cleanup after 10 seconds
            setTimeout(() => {
                if (userLogoutStatus.has(email)) {
                    userLogoutStatus.delete(email);
                    console.log(`🗑️ Logout flag cleared for: ${email}`);
                }
            }, 10000);
        }
        
        res.json({ 
            success: true, 
            message: 'Logout recorded successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error in VR logout endpoint:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// =====================================================
//  CHECK LOGOUT STATUS - THIS WAS MISSING!
// =====================================================
router.post('/check-logout-status', async (req, res) => {
    try {
        const { email } = req.body;
                
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }
        
        // Check if this user has a logout flag
        const status = userLogoutStatus.get(email);
        
        if (status && status.loggedOut) {
            console.log(`🚪 Logout detected for user: ${email}`);
            
            // Clear the flag immediately
            userLogoutStatus.delete(email);
            
            return res.json({ 
                success: true, 
                loggedOut: true,
                message: 'User logged out from VR module'
            });
        }
        
        res.json({ 
            success: true, 
            loggedOut: false,
            message: 'No logout detected'
        });
        
    } catch (error) {
        console.error('❌ Error checking logout status:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// =====================================================
//  LOGIN
// =====================================================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, msg: "User not found. Please sign up first." });
        }

        if (!user.isVerified) {
            return res.json({ success: false, msg: "Account not verified. Please verify OTP first." });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.json({ success: false, msg: "Incorrect password. Please try again." });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "2h",
        });

        // Clear any stale logout flag on login
        if (userLogoutStatus.has(email)) {
            userLogoutStatus.delete(email);
            console.log(`🗑️ Cleared logout flag for ${email} on login`);
        }

        res.json({
            success: true,
            msg: "Login successful!",
            token,
            user: { name: user.name, email: user.email },
        });

    } catch (err) {
        console.error("❌ Login error:", err);
        res.json({ success: false, msg: "Server error" });
    }
});

// =====================================================
//  SIGNUP — REQUEST OTP
// =====================================================
router.post("/request-otp", async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        let user = await User.findOne({ email });

        if (user && user.isVerified) {
            return res.json({ success: false, msg: "User already exists. Please login." });
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

        if (user) {
            user.otp = otp;
            user.otpExpiry = otpExpiry;
            await user.save();
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await User.create({
                name,
                email,
                phone,
                password: hashedPassword,
                otp,
                otpExpiry,
                isVerified: false,
            });
        }

        const sent = await sendOTPEmail(email, otp);
        if (!sent) return res.json({ success: false, msg: "Failed to send OTP" });

        res.json({ success: true, msg: "OTP sent! Check your email." });

    } catch (err) {
        console.error("❌ Request OTP error:", err);
        res.json({ success: false, msg: "Server error" });
    }
});

// =====================================================
//  SIGNUP — VERIFY OTP
// =====================================================
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.json({ success: false, msg: "Signup not started." });

        if (user.otpExpiry < new Date()) {
            return res.json({ success: false, msg: "OTP expired. Request a new one." });
        }

        if (user.otp !== otp) {
            return res.json({ success: false, msg: "Invalid OTP. Please try again." });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });

        res.json({
            success: true,
            msg: "OTP verified! Account created successfully.",
            token,
            user: { name: user.name, email: user.email },
        });

    } catch (err) {
        console.error("❌ Verify OTP error:", err);
        res.json({ success: false, msg: "Server error" });
    }
});

// =====================================================
//  FORGOT PASSWORD — REQUEST OTP
// =====================================================
router.post("/forgot-password/request", async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, msg: "Email not found. Please sign up first." });
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 2 * 60 * 1000);
        await user.save();

        const sent = await sendOTPEmail(email, otp);
        if (!sent) {
            return res.json({ success: false, msg: "Email sending failed. Please try again." });
        }

        res.json({ success: true, msg: "OTP sent to your email!" });

    } catch (err) {
        console.error("❌ Forgot password request error:", err);
        res.json({ success: false, msg: "Server error" });
    }
});

// =====================================================
//  FORGOT PASSWORD — VERIFY OTP
// =====================================================
router.post("/forgot-password/verify", async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, msg: "User not found!" });
        }

        if (user.otp !== otp) {
            return res.json({ success: false, msg: "Invalid OTP! Please try again." });
        }

        if (user.otpExpiry < Date.now()) {
            return res.json({ success: false, msg: "OTP expired! Request a new one." });
        }

        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        res.json({ success: true, msg: "OTP verified successfully. You can now reset your password." });

    } catch (error) {
        console.error("❌ Forgot password verify error:", error);
        res.json({ success: false, msg: "Server error during OTP verification." });
    }
});

// =====================================================
//  FORGOT PASSWORD — RESET PASSWORD
// =====================================================
router.post("/forgot-password/reset", async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, msg: "User not found!" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ success: true, msg: "Password updated successfully! You can now login with your new password." });

    } catch (err) {
        console.error("❌ Reset password error:", err);
        res.json({ success: false, msg: "Server error" });
    }
});

// =====================================================
//  DEBUG ENDPOINT - Check current logout status (optional)
// =====================================================
router.get('/debug-logout-status', (req, res) => {
    res.json({
        success: true,
        logoutStatusMap: Array.from(userLogoutStatus.entries())
    });
});

module.exports = router;