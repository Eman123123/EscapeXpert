// src/context/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const DUMMY_DEFAULT_USER = {
    username: 'Guest',
    profilePic: null,
};

const normalizeUserData = (data) => {
    if (!data) return DUMMY_DEFAULT_USER;
    const normalizedUser = { ...data };
    normalizedUser.username = data.username || data.name || DUMMY_DEFAULT_USER.username;
    normalizedUser.profilePic = data.profilePic || DUMMY_DEFAULT_USER.profilePic;
    if (!normalizedUser.name && normalizedUser.firstName && normalizedUser.lastName) {
        normalizedUser.name = `${normalizedUser.firstName} ${normalizedUser.lastName}`;
    }
    return normalizedUser;
};

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(DUMMY_DEFAULT_USER);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedToken && storedUser) {
            try {
                const rawUserData = JSON.parse(storedUser);
                const userData = normalizeUserData(rawUserData);
                setIsLoggedIn(true);
                setUser(userData);
                console.log('✅ User loaded from localStorage:', userData.username);
            } catch (error) {
                console.error("Failed to parse user data", error);
                handleLogout();
            }
        }
    }, []);

    // 🔴 Poll backend for logout status
    useEffect(() => {
        if (!isLoggedIn || !user?.email) return;
        
        let isMounted = true;
        
        const checkLogoutStatus = async () => {
            try {
                const response = await axios.post('http://localhost:5000/api/auth/check-logout-status', {
                    email: user.email
                });
                
                if (response.data.success && response.data.loggedOut) {
                    console.log('🚪 Logout detected from VR module');
                    
                    if (isMounted) {
                        // Clear localStorage
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        
                        // Update state
                        setIsLoggedIn(false);
                        setUser(DUMMY_DEFAULT_USER);
                        
                        // Redirect to login
                        window.location.href = '/login';
                    }
                }
                
            } catch (error) {
                console.error('Error checking logout status:', error);
            }
        };
        
        // Check every 2 seconds
        const interval = setInterval(checkLogoutStatus, 200);
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isLoggedIn, user?.email]);

    const handleLogin = (rawUserData, token) => {
        const userForContext = normalizeUserData(rawUserData);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userForContext));
        setIsLoggedIn(true);
        setUser(userForContext);
        console.log('✅ User logged in:', userForContext.username);
    };

    const handleLogout = () => {
        console.log('🚪 Logging out from main module');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(DUMMY_DEFAULT_USER);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, handleLogin, handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);