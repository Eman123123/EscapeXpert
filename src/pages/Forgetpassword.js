// src/pages/ForgotPassword.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./Auth.css";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg("");

        try {
            const res = await fetch("http://127.0.0.1:5000/api/auth/forgot-password/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (data.success) {
                navigate("/verify-otp", { state: { email } });
            } else {
                setMsg(data.msg);
            }
        } catch (error) {
            console.error(error);
            setMsg("Network error — backend not reachable.");
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
            <Header isAuthPage={true} />
            
            <canvas id="network-bg-login"></canvas>

            <div className="auth-card forget-password-card">
                <h2 className="gradient-heading">Forgot Password</h2>

                {msg && <div className="message-box error">{msg}</div>}

                <form onSubmit={handleSubmit}>
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <button className="submit-btn-scale">Send OTP</button>
                </form>
            </div>
        </div>
    );
}
