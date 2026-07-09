// src/pages/Settings.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import "./Dashboard.css";
import "./Settings.css";

const getInitialTheme = () => localStorage.getItem("theme") || "light";

export default function Settings() {
    const { isLoggedIn, user, handleLogout } = useAuth();
    const navigate = useNavigate();

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        if (!isLoggedIn) navigate("/login");
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        document.body.className = theme === "dark" ? "dark-theme" : "light-theme";
        localStorage.setItem("theme", theme);
    }, [theme]);

    const handleToggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    if (!isLoggedIn) return <div className="loading-state">Redirecting...</div>;

    return (
        <div className="dashboard-wrapper">

            {/* ✅ SAME HEADER AS PROFILE PAGE */}
            <Header
                isLoggedIn={isLoggedIn}
                user={user}
                handleLogout={handleLogout}
                isAuthPage={false}
            />

            <div className="app-layout">

                {/* ✅ SAME SIDEBAR AS PROFILE PAGE */}
                <Sidebar user={user} />

                {/* ✅ MAIN CONTENT (Settings) */}
                <main className="dashboard-main-content">

                    <header className="profile-header">
                        <h1 className="gradient-heading">Account Settings</h1>
                        <p>Manage application appearance.</p>
                    </header>

                    <div className="profile-content-grid">

                        {/* SETTINGS CARD */}
                        <div className="profile-card detail-card">
                            <h3>Appearance Settings</h3>

                            <p>Switch between Light and Dark mode.</p>

                            <div className="theme-selector-group">

                                <label className="theme-label">Theme:</label>

                                <div className="theme-toggle-wrapper">

                                    <span className="toggle-label">Light</span>

                                    <input
                                        type="checkbox"
                                        id="theme-toggle"
                                        checked={theme === "dark"}
                                        onChange={handleToggleTheme}
                                        className="theme-checkbox-hidden"
                                    />

                                    <label htmlFor="theme-toggle" className="theme-toggle-switch">
                                        <span className="toggle-slider"></span>

                                        <span className="toggle-icon sun-icon">
                                            <i className="fas fa-sun"></i>
                                        </span>

                                        <span className="toggle-icon moon-icon">
                                            <i className="fas fa-moon"></i>
                                        </span>
                                    </label>

                                    <span className="toggle-label">Dark</span>

                                </div>
                            </div>

                        </div>

                    </div>

                </main>

            </div>
        </div>
    );
}
