// D:\DRAW2D\src\components\Header.jsx
import React from 'react';
import './Header.css';
import EscapeXpert from '../assets/EscapeXpert.png'; 
import Prof from '../assets/profile.png'; 

export default function Header({ isLoggedIn, user, handleLogout, isAuthPage }) {
  
  const handleNavClick = (e, section) => {
    e.preventDefault();
    // Navigate to main app with the correct hash
    window.location.href = `http://localhost:3000/#${section}`;
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    window.location.href = 'http://localhost:3000/contact';
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    window.location.href = 'http://localhost:3000/Aboutus';
  };

  return (
    <header className="header">
      <div className="header-left">
        <img src={EscapeXpert} alt="EscapeXpert Logo" className="logo" />

               <nav>
                    <a href="http://localhost:3000/#home">Home</a>
                    <a href="http://localhost:3000/#about">Overview</a>
                    <a href="http://localhost:3000/#services">Services</a>
                    <a href="http://localhost:3000/#reviews">Reviews</a>
                    <a href="http://localhost:3000/contact">Contact Us</a>
                    <a href="http://localhost:3000/Aboutus">About Us</a>
                </nav>

      </div>
      <div className="header-right">
        {isLoggedIn ? (
          <>
            <div className="user-profile">
              <img
                src={user?.profilePic || Prof || 'https://via.placeholder.com/35'}
                alt={user?.username || 'User'}
                className="profile-pic"
              />
              <span className="username">
                Hello, **{user?.username || user?.email || 'User'}**!
              </span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          !isAuthPage && (
            <>
              <a href="http://localhost:3000/login">
                <button className="login-btn">Login</button>
              </a>
              <a href="http://localhost:3000/signup">
                <button className="signup-btn">Signup</button>
              </a>
            </>
          )
        )}
      </div>
    </header>
  );
}