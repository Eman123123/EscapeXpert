// src/pages/Profile.js
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Prof from '../assets/profile.png';
import './Dashboard.css';
import './Profile.css';

const getNames = (fullNameString) => {
    if (!fullNameString) return { firstName: 'User', lastName: 'Profile' };
    const parts = fullNameString.trim().split(/\s+/);
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ') || 'Profile';
    return { firstName, lastName };
};

export default function Profile() {
    const { isLoggedIn, user, handleLogout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn) navigate("/login");
    }, [isLoggedIn, navigate]);

    if (!isLoggedIn || !user) return <div className="loading-state">Redirecting...</div>;

    const { firstName: parsedFirstName, lastName: parsedLastName } = getNames(user.name);

    const userDetails = {
        firstName: parsedFirstName,
        lastName: parsedLastName,
        username: user.username || parsedFirstName,
        email: user.email || 'user@example.com',
        phoneNumber: user.phone || 'N/A',
        accountMadeDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Dec 11, 2025',
        profilePic: user.profilePic || Prof,
    };

    return (
        <div className="dashboard-wrapper">
            {/* HEADER */}
            <Header isLoggedIn={isLoggedIn} user={user} handleLogout={handleLogout} isAuthPage={false} />

            <div className="app-layout">
                {/* SIDEBAR */}
                <Sidebar user={user} />

                {/* MAIN CONTENT */}
                <main className="dashboard-main-content">
                    <header className="profile-header">
                        <h1 className="gradient-heading">My Profile Details</h1>
                        <p>Quickly review your primary account information.</p>
                    </header>

                    <div className="profile-content-grid">
                        <div className="profile-card primary-card">
                            <img
                                src={userDetails.profilePic}
                                alt={userDetails.username}
                                className="profile-pic-large"
                            />
                            <h2>{userDetails.firstName} {userDetails.lastName}</h2>
                            <p className="username-tag">@{userDetails.username}</p>
                        </div>

                        <div className="profile-card detail-card">
                            <h3>Personal Information</h3>
                            <div className="detail-list">
                                <div className="detail-item">
                                    <span className="detail-label">Full Name:</span>
                                    <span className="detail-value bold">{userDetails.firstName} {userDetails.lastName}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value email-link">{userDetails.email}</span>
                                </div>
                            </div>

                            <h3>Account Status</h3>
                            <div className="detail-list">
                                <div className="detail-item">
                                    <span className="detail-label">Member Since:</span>
                                    <span className="detail-value">{userDetails.accountMadeDate}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status:</span>
                                    <span className="detail-value status-active">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr />

                    <div className="profile-footer-utility">
                        <Link to="/settings" className="btn-utility-setting">
                            Go to Settings
                        </Link>
                    </div>
                </main>
            </div>
        </div>
    );
}
