// src/pages/TermsAndConditions.js

import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import "./Auth.css";

export default function TermsAndConditions() {
    const { user, isLoggedIn, handleLogout } = useAuth();

    // ✅ SAME BACKGROUND ANIMATION AS SIGNUP PAGE
    useEffect(() => {
        const canvas = document.getElementById("network-bg-signup");
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
                        ctx.strokeStyle = `rgba(168,213,186, ${1 - dist / maxDistance})`;
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

            {/* ✅ SAME HEADER AS SIGNUP PAGE */}
            <Header
                isLoggedIn={isLoggedIn}
                user={user}
                handleLogout={handleLogout}
                isAuthPage={true}
            />

            {/* ✅ BACKGROUND CANVAS */}
            <canvas id="network-bg-signup"></canvas>

            {/* ✅ TERMS CARD */}
            <div className="auth-card terms-card animate-zoom">

                <div className="terms-content">

                    <h2 className="gradient-heading">Terms & Conditions</h2>

                    <p>
                        Welcome! By using this platform, you agree to the following terms
                        and conditions. Please read them carefully before proceeding.
                    </p>

                    <h3>1. Acceptance of Terms</h3>
                    <p>
                        By creating an account, you agree to follow all rules and policies
                        listed here.
                    </p>

                    <h3>2. User Responsibilities</h3>
                    <p>
                        You must keep your account safe and not share your password with anyone.
                    </p>

                    <h3>3. Prohibited Activities</h3>
                    <ul>
                        <li>Illegal content</li>
                        <li>Spamming</li>
                        <li>Hacking or security violations</li>
                    </ul>

                    <h3>4. Privacy</h3>
                    <p>
                        Your data is handled according to our Privacy Policy.
                    </p>

                    <h3>5. Updates</h3>
                    <p>
                        We may update these terms anytime. Continued use means you accept the changes.
                    </p>

                    <div className="back-btn-container">
                        <button
                            className="submit-btn-scale"
                            onClick={() => (window.location.href = "/signup")}
                        >
                            Back to Signup
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
