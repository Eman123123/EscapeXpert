// src/pages/ContactUs.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EscapeXpert from "../assets/EscapeXpert.png";
import Prof from "../assets/profile.png";
import "./ContactUS.css";

export default function ContactUs() {
    const { isLoggedIn, user, handleLogout } = useAuth();

    const [formData, setFormData] = useState({ name: "", email: "", message: "" });
    const [status, setStatus] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("Sending...");

        try {
            const res = await fetch("http://localhost:5000/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                setStatus("Message sent successfully!");
                setFormData({ name: "", email: "", message: "" });
            } else {
                setStatus(data.msg || "Failed to send message.");
            }
        } catch (err) {
            console.error(err);
            setStatus("Error sending message.");
        }
    };

    return (
        <div className="contact-container">
            {/* HEADER */}
            <header className="header">
                <div className="header-left">
                    <img src={EscapeXpert} alt="EscapeXpert Logo" className="logo" />
                    <nav>
                        <Link to="/">Home</Link>
                        <Link to="/">Overview</Link>
                        <Link to="/">Services</Link>
                        <Link to="/">Reviews</Link>
                        <Link to="/contact">Contact Us</Link>
                        {isLoggedIn && <Link to="/dashboard">Dashboard</Link>}
                        <Link to="/Aboutus">About Us</Link>
                    </nav>
                </div>
                <div className="header-right">
                    {isLoggedIn ? (
                        <>
                            <div className="user-profile">
                                <img
                                    src={user?.profilePic || Prof}
                                    alt={user?.username || "User"}
                                    className="profile-pic"
                                />
                                <span className="username">Hello, {user?.username || "User"}!</span>
                            </div>
                            <button className="logout-btn" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">
                                <button className="login-btn">Login</button>
                            </Link>
                            <Link to="/signup">
                                <button className="signup-btn">Signup</button>
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/* HERO / CONTACT INTRO */}
            <section className="contact-hero">
                <h1 className="gradient-heading">Contact Us</h1>
                <p>We are here to help! Reach out to us via any of the methods below.</p>
            </section>

            {/* CONTACT DETAILS */}
            <section className="contact-details">
                <div className="contact-card">
                    <h2>Email</h2>
                    <p>escapexpert54@gmail.com</p>
                </div>
                <div className="contact-card">
                    <h2>Phone</h2>
                    <p>+92 3236716585</p>
                </div>
                <div className="contact-card">
                    <h2>Location</h2>
                    <p>Chiniot, Pakistan</p>
                </div>
            </section>

            {/* CONTACT FORM */}
            <section className="contact-form-section">
                <h2 className="gradient-heading">Send Us a Message</h2>
                <form className="contact-form" onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your Name"
                            required
                        />
                    </label>
                    <label>
                        Email:
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Your Email"
                            required
                        />
                    </label>
                    <label>
                        Message:
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Your Message"
                            rows="5"
                            required
                        ></textarea>
                    </label>
                    <button type="submit" className="btn btn-primary">
                        Send Message
                    </button>
                    {status && <p className="status-message">{status}</p>}
                </form>
            </section>
        </div>
    );
}
