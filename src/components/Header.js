// src/components/Header.js

import React from 'react';
import { Link } from 'react-router-dom'; 
import EscapeXpert from '../assets/EscapeXpert.png'; 
import Prof from '../assets/profile.png'; 
import '../styles/Header.css'; 

// Accept the new prop: isAuthPage
export default function Header({ isLoggedIn, user, handleLogout, isAuthPage }) {
    return (
        <header className="header">
            <div className="header-left">
                <img src={EscapeXpert} alt="EscapeXpert Logo" className="logo" />
                <nav>
                    {/* The navigation links remain visible */}
                    <Link to="/#home">Home</Link>
                    <Link to="/#about">Overview</Link>
                    <Link to="/#services">Services</Link>
                    <Link to="/#reviews">Reviews</Link>
                    <Link to="/contact">Contact Us</Link>
                    <Link to="/Aboutus">About Us</Link>
                   

                </nav>
            </div>
            <div className="header-right">
                {isLoggedIn ? (
                    // 1. If Logged In, show user profile and Logout button
                    <>
                        <div className="user-profile">
                            <img
                                src={user?.profilePic || Prof}
                                alt={user?.username || 'User'}
                                className="profile-pic"
                            />
                            <span className="username">
                                Hello, **{user?.username || 'User'}**!
                            </span>
                        </div>
                        <button className="logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    // 2. If NOT Logged In:
                    
                    // Check the new prop: Only show Login/Signup buttons if it's NOT an Auth Page.
                    !isAuthPage && (
                        <>
                            {/* Use Link components for routing to Login/Signup pages */}
                            <Link to="/login">
                                <button className="login-btn">Login</button>
                            </Link>
                            <Link to="/signup">
                                <button className="signup-btn">Signup</button>
                            </Link>
                        </>
                    )
                )}
            </div>
        </header>
    );
}