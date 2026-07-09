// src/pages/Training.js
import React from "react";
import { useAuth } from "../context/AuthContext"; // to get user info
import Header from "../components/Header"; // import the reusable Header
import "./Training.css"; // page-specific CSS

export default function Training() {
    const { isLoggedIn, user, handleLogout } = useAuth();

    return (
        <div className="training-container">
            {/* --- REUSABLE HEADER --- */}
            <Header 
                isLoggedIn={isLoggedIn} 
                user={user} 
                handleLogout={handleLogout} 
                isAuthPage={false} 
            />

            {/* --- MAIN TRAINING CONTENT --- */}
            <main className="training-content" id="vr-environment">
                <h1 className="gradient-heading">Training Environment</h1>
                <p>3D VR scene will come here.</p>
            </main>
        </div>
    );
}
