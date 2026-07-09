// src/pages/Signup.js

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import "./Auth.css";

import SIGNUP_VISUAL_ASSET from "../assets/Account_sign_up.mp4";

export default function Signup() {
    const navigate = useNavigate();
    const { handleLogin, user, isLoggedIn, handleLogout } = useAuth();

    // ✅ FORM STATES
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");

    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const [errors, setErrors] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [message, setMessage] = useState({ text: "", type: "" });

    // ✅ REFS
    const firstNameRef = useRef();
    const lastNameRef = useRef();
    const emailRef = useRef();
    const passwordRef = useRef();
    const confirmPasswordRef = useRef();

    // ✅ REGEX
    const nameRegex = /^[A-Za-z ]{2,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    const otpRegex = /^\d{6}$/;

    // ✅ NEW: Redirect if already logged in
    useEffect(() => {
        if (isLoggedIn) {
            navigate("/Dashboard");
        }
    }, [isLoggedIn, navigate]);

    const showMessage = (text, type = "error") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3500);
    };

    // ✅ VALIDATIONS
    const validateFirstName = (v) =>
        setErrors(prev => ({ ...prev, firstName: nameRegex.test(v) ? "" : "Only letters allowed" }));

    const validateLastName = (v) =>
        setErrors(prev => ({ ...prev, lastName: nameRegex.test(v) ? "" : "Only letters allowed" }));

    const validateEmail = (v) =>
        setErrors(prev => ({ ...prev, email: emailRegex.test(v) ? "" : "Invalid email" }));

    const validatePassword = (v) =>
        setErrors(prev => ({ ...prev, password: passwordRegex.test(v) ? "" : "Weak password" }));

    const validateConfirm = (v) =>
        setErrors(prev => ({ ...prev, confirmPassword: v === password ? "" : "Passwords mismatch" }));

    const requiredFocusCheck = () => {
        if (!firstName) { setErrors(p => ({ ...p, firstName: "Required" })); firstNameRef.current.focus(); return false; }
        if (!lastName) { setErrors(p => ({ ...p, lastName: "Required" })); lastNameRef.current.focus(); return false; }
        if (!email) { setErrors(p => ({ ...p, email: "Required" })); emailRef.current.focus(); return false; }
        if (!password) { setErrors(p => ({ ...p, password: "Required" })); passwordRef.current.focus(); return false; }
        if (!confirmPassword) { setErrors(p => ({ ...p, confirmPassword: "Required" })); confirmPasswordRef.current.focus(); return false; }

        if (!acceptedTerms) {
            showMessage("Please accept Terms & Conditions");
            return false;
        }

        return true;
    };

    // ✅ REQUEST OTP
    const handleSignup = async (e) => {
        e.preventDefault();
        if (!requiredFocusCheck()) return;

        if (Object.values(errors).some(e => e !== "")) {
            showMessage("Fix errors first");
            return;
        }

        const fullName = `${firstName} ${lastName}`;

        try {
            const res = await fetch("http://127.0.0.1:5000/api/auth/request-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: fullName, email, password, phone })
            });

            const data = await res.json();

            if (data.success) {
                showMessage("OTP Sent!", "success");
                setOtpSent(true);
            } else {
                showMessage(data.msg || "Signup failed");
            }

        } catch {
            showMessage("Network error");
        }
    };

    // ✅ VERIFY OTP
    const handleOTPVerification = async (e) => {
        e.preventDefault();

        if (!otpRegex.test(otp))
            return showMessage("Invalid OTP");

        try {
            const res = await fetch("http://127.0.0.1:5000/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp })
            });

            const data = await res.json();

            if (data.success) {
                showMessage("Verified!", "success");

                handleLogin(
                    { username: data.user?.username || email, email },
                    data.token
                );

                navigate("/Dashboard");

            } else {
                showMessage(data.msg || "OTP invalid");
            }

        } catch {
            showMessage("Network error");
        }
    };

    // -------------------------------------------------------------
    // ✅ DYNAMIC BACKGROUND CANVAS (SAFE + NO ERRORS)
    // -------------------------------------------------------------
    useEffect(() => {
        const canvas = document.getElementById("network-bg-login");

        if (!canvas) return; // safety

        const ctx = canvas.getContext("2d");

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 50;
        const maxDistance = 150;

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
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = "#A8D5BA";
                ctx.fill();
            });

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;

                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(168,213,186,${1 - dist / maxDistance})`;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    // -------------------------------------------------------------
    // ✅ UI
    // -------------------------------------------------------------
    return (
        <div className="auth-container">

            {/* ✅ BACKGROUND CANVAS (must be outside card) */}
            <canvas id="network-bg-login"></canvas>

            <Header
                isLoggedIn={isLoggedIn}
                user={user}
                handleLogout={handleLogout}
                isAuthPage={true}
            />

            <div className="auth-card signup-card">

                {/* LEFT SIDE */}
                <div className="signup-visual-column">
                    <h2 className="gradient-heading">Join Our Community</h2>

                    <video className="signup-video" src={SIGNUP_VISUAL_ASSET} autoPlay loop muted />

                    <p className="visual-caption">Create account & explore!</p>
                </div>

                {/* RIGHT SIDE */}
                <div className="signup-form-column">

                    <h2 className="gradient-heading">
                        {otpSent ? "Verify OTP" : "Create Account"}
                    </h2>

                    {message.text && (
                        <div className={`message-box ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    {/* ✅ SIGNUP FORM */}
                    {!otpSent && (
                        <form onSubmit={handleSignup}>

                            <label>First Name</label>
                            <input
                                ref={firstNameRef}
                                value={firstName}
                                onChange={(e) => { setFirstName(e.target.value); validateFirstName(e.target.value); }}
                            />
                            {errors.firstName && <span className="error-text">{errors.firstName}</span>}

                            <label>Last Name</label>
                            <input
                                ref={lastNameRef}
                                value={lastName}
                                onChange={(e) => { setLastName(e.target.value); validateLastName(e.target.value); }}
                            />
                            {errors.lastName && <span className="error-text">{errors.lastName}</span>}

                            <label>Email</label>
                            <input
                                ref={emailRef}
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}

                            <label>Phone (Optional)</label>
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} />

                            <label>Password</label>
                            <input
                                ref={passwordRef}
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
                            />
                            {errors.password && <span className="error-text">{errors.password}</span>}

                            <label>Confirm Password</label>
                            <input
                                ref={confirmPasswordRef}
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); validateConfirm(e.target.value); }}
                            />
                            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}

                            <div className="terms-box">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                />
                                <label>I agree to Terms & Privacy Policy</label>
                            </div>

                            <button type="submit" className="submit-btn-scale">
                                Send Verification Code
                            </button>
                            <p className="login-link">
                         Already have an account? <a href="/login">Login</a>
                     </p>
                        </form>
                        
                    )}

                    {/* ✅ OTP FORM */}
                    {otpSent && (
                        <form onSubmit={handleOTPVerification}>

                            <p>OTP sent to <b>{email}</b></p>

                            <label>Enter OTP</label>
                            <input
                                value={otp}
                                maxLength="6"
                                onChange={(e) => setOtp(e.target.value)}
                            />

                            <button type="submit" className="submit-btn-scale">
                                Verify OTP
                            </button>

                            <button type="button" className="back-link" onClick={() => setOtpSent(false)}>
                                Back to Registration
                            </button>

                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}