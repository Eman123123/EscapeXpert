// src/pages/Login.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import "./Auth.css";

//  Correct ES module import
import LOGIN_VISUAL_ASSET from "../assets/Login.mp4";

export default function Login() {
    const navigate = useNavigate();
    const { handleLogin, user, isLoggedIn, handleLogout } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState({ text: "", type: "" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ✅ NEW: Redirect if already logged in
    useEffect(() => {
        if (isLoggedIn) {
            navigate("/Dashboard");
        }
    }, [isLoggedIn, navigate]);

    const showMessage = (text, type = "error") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        if (!emailRegex.test(email)) {
            showMessage("Please enter a valid email.");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success) {
                showMessage("Login successful!", "success");
                handleLogin(data.user, data.token);

                setTimeout(() => navigate("/Dashboard"), 1000);
            } else {
                showMessage(data.msg || "Login failed.", "error");
            }

        } catch (error) {
            console.error("Login Error:", error);
            showMessage("Network error. Try again!", "error");
        }
    };

    // ==============================
    // Canvas Animation (unchanged)
    // ==============================
    useEffect(() => {
        const canvas = document.getElementById("network-bg-login");
        const ctx = canvas.getContext("2d");

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const particles = [];
        const particleCount = 50;
        const maxDistance = 150;
        const mouseRadius = 100;

        let mouse = { x: null, y: null };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                if (mouse.x !== null && mouse.y !== null) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < mouseRadius) {
                        const angle = Math.atan2(dy, dx);
                        const force = (mouseRadius - dist) / mouseRadius;

                        p.vx += Math.cos(angle) * force * 0.5;
                        p.vy += Math.sin(angle) * force * 0.5;
                    }
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = "#A8D5BA";
                ctx.fill();
            });

            for (let i = 0; i < particleCount; i++) {
                for (let j = i + 1; j < particleCount; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;

                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(168,213,186,${1 - dist / maxDistance})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(animate);
        };

        animate();

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    return (
        <div className="auth-container">

            {/* ✅ Header */}
            <Header
                isLoggedIn={isLoggedIn}
                user={user}
                handleLogout={handleLogout}
                isAuthPage={true}
            />

            <canvas id="network-bg-login"></canvas>

            <div className="auth-card login-card animate-zoom">

                {/* LEFT COLUMN */}
                <div className="login-visual-column">
                    <h2 className="gradient-heading">Welcome Back!</h2>

                    <video
                        className="login-video"
                        src={LOGIN_VISUAL_ASSET}
                        autoPlay
                        loop
                        muted
                        playsInline
                    >
                        Your browser does not support video.
                    </video>

                    <p className="visual-caption">Securely access your account.</p>
                </div>

                {/* RIGHT COLUMN */}
                <div className="login-form-column">

                    <h2 className="gradient-heading form-title">Login</h2>

                    {message.text && (
                        <div className={`message-box ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {/* ✅ Forgot Password Link */}
                        <div className="forgot-password">
                            <a href="/forgot-password">Forgot Password?</a>
                        </div>

                        <button type="submit" className="submit-btn-scale">
                            Login
                        </button>

                    </form>

                    <p className="signup-link">
                        Don't have an account? <a href="/signup">Sign Up</a>
                    </p>

                </div>
            </div>
        </div>
    );
}