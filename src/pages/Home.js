// src/pages/Home.jsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useVRLaunch } from "../hooks/useVRLaunch";
import "./Home.css";
import EscapeXpert from "../assets/EscapeXpert.png"
import Alice from "../assets/alice.jpg";
import Bob from "../assets/bob.jpg";
import Prof from "../assets/profile.png";

export default function Home() {
    const navigate = useNavigate();
    const { isLoggedIn, user, handleLogout } = useAuth();
    const { launchVR, loading } = useVRLaunch();

    // --- SERVICE DATA ---
    const services = [
        {
            id: 1,
            icon: (
                // Blueprint / Architect Icon
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 16h2v-4h4v-2h-4V8h-2v4H7v2h4v4z" fill="#52796F" />
                    <path d="M11 18h2v-4h4v-2h-4V8h-2v4H7v2h4v4z" fill="#CAD2C5" />
                </svg>
            ),
            title: '3D Environment Creator',
            description: 'Upload blueprints or draw your design. We convert your 2D plans into a dynamic, realistic 3D model for immersive training.',
        },
        {
            id: 2,
            icon: (
                // Fire/Hazard Icon (Simulation)
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.6 2 5.6 3.8 4 6.5l.5 1.5h15l.5-1.5C18.4 3.8 15.4 2 12 2zM3 10c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-10zm9 9c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z" fill="#52796F" />
                    <path d="M12 11.5L10 15h4l-2-3.5z" fill="#CAD2C5" />
                </svg>
            ),
            title: 'Disaster Simulation',
            description: 'Simulate user-selected disasters (Earthquake, Flood, etc.) within your 3D environment for realistic, scenario-based training.',
        },
        {
            id: 3,
            icon: (
                // Compass/Route Icon
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13l3.5 7L12 18.5 8.5 12.5 12 7z" fill="#52796F" />
                    <path d="M12 7l3.5 7L12 18.5 8.5 14L12 7z" fill="#CAD2C5" />
                </svg>
            ),
            title: 'AI Escape Routes',
            description: 'View the safest and most efficient exit path calculated and displayed in your 3D model to optimize reaction time in a crisis.',
        },
        {
            id: 4,
            icon: (
                // Graduation Cap / Education Icon
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3L1 9l11 6 9-4.5V17h2V9l-11-6zm0 13l-9 4.5v1.5h18v-1.5L12 16z" fill="#52796F" />
                    <path d="M12 16l-9 4.5v1.5h18v-1.5L12 16zM12 3L1 9l11 6 9-4.5V17h2V9l-11-6z" fill="#CAD2C5" />
                </svg>
            ),
            title: 'Disaster Training Platform',
            description: 'Specialized training modules to prepare users for escaping disaster scenarios, improving safety, and ensuring preparedness.',
        },
        {
            id: 5,
            icon: (
                // Map Pin / Prediction Icon
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="#52796F" />
                    <path d="M12 11.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="#CAD2C5" />
                </svg>
            ),
            title: 'Location Prediction',
            description: 'Enter any location to receive machine-learning-based predictions for potential flood and earthquake risks and severity.',
        },
    ];
    // --- END SERVICE DATA ---

    // Scroll animations
    useEffect(() => {
        const scrollElements = document.querySelectorAll(
            ".animate-fade, .animate-slide, .animate-zoom"
        );

        const elementInView = (el, dividend = 1) => {
            const elementTop = el.getBoundingClientRect().top;
            return (
                elementTop <=
                (window.innerHeight || document.documentElement.clientHeight) / dividend
            );
        };

        const displayScrollElement = (element) => {
            element.classList.add("in-view");
        };

        const handleScrollAnimation = () => {
            scrollElements.forEach((el) => {
                if (elementInView(el, 1.25)) displayScrollElement(el);
            });
        };

        window.addEventListener("scroll", handleScrollAnimation);
        handleScrollAnimation();

        return () => {
            window.removeEventListener("scroll", handleScrollAnimation);
        };
    }, []);

    // Particle network with mouse repel
    const createParticleNetwork = (
        canvasId,
        canvasHeight = null, // if null => full section height
        particleCount = 50,
        maxDistance = 150,
        mouseRadius = 100
    ) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const parentSection = canvas.parentElement;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = canvasHeight || parentSection.offsetHeight);

        const particles = [];
        let mouse = { x: null, y: null };

        // mouse relative to section
        parentSection.addEventListener("mousemove", (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });

        parentSection.addEventListener("mouseleave", () => {
            mouse.x = null;
            mouse.y = null;
        });

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

            // move particles + mouse repel
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

            // draw lines
            for (let i = 0; i < particleCount; i++) {
                for (let j = i + 1; j < particleCount; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < maxDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(168, 213, 186, ${1 - dist / maxDistance})`;
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

        // resize canvas
        window.addEventListener("resize", () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = canvasHeight || parentSection.offsetHeight;
        });
    };

    // Initialize particle networks
    useEffect(() => {
        createParticleNetwork("network-bg", window.innerHeight / 2, 50, 150, 100); // Hero
        createParticleNetwork("network-bg-services", null, 40, 120, 80); // Services
    }, []);

    // Handler functions for buttons
    const handleStartVR = () => {
        if (!isLoggedIn) {
            navigate('/login');
        } else {
            launchVR();
        }
    };

    const handleGetPrediction = () => {
        if (!isLoggedIn) {
            navigate('/login');
        } else {
            navigate('/disasterprediction');
        }
    };

    return (
        <div className="home-container">
            {/* HEADER */}
            <header className="header">
                <div className="header-left">
                    <img src={EscapeXpert} alt="EscapeXpert Logo" className="logo" />
                    <nav>
                        <a href="#home">Home</a>
                        <a href="#about">Overview</a>
                        <a href="#services">Services</a>
                        <a href="#reviews">Reviews</a>
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

            {/* HERO SECTION */}
            <section className="hero" id="home">
                <canvas id="network-bg"></canvas>
                <div className="hero-text">
                    <h1 className="hero-title animate-fade option-gradient-heading">
                        EscapeXpert
                    </h1>
                    <h3 className="hero-subtitle animate-fade">Prepare.Predict.Protect</h3>
                    <p className="hero-desc animate-slide">
                        Train for real-world disasters using immersive VR simulations.
                    </p>
                    <p className="hero-desc animate-slide">
                        Explore AI-guided evacuation routes and hazard predictions.
                    </p>
                    <p className="hero-desc animate-slide">
                        Stay prepared, stay safe, and respond effectively with EscapeXpert.
                    </p>
                    <div className="hero-buttons animate-slide">
                        <button 
                            onClick={handleStartVR}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'Starting...' : 'Get 2D blueprint TO 3D'}
                        </button>
                        <button 
                            onClick={handleGetPrediction}
                            className="btn btn-secondary"
                        >
                            Get Disaster Prediction
                        </button>
                    </div>
                </div>
            </section>

            {/* ABOUT SECTION */}
            <section className="about" id="about">
                <div className="about-text">
                    <h2 className="animate-fade gradient-heading">Overview</h2>
                    <p className="animate-slide">Don't wait for a disaster to happen; be the expert when it counts. EscapeXpert provides the knowledge and confidence to make split-second, life-saving decisions under pressure. We turn anxiety into preparedness, ensuring that you and your loved ones are always ready to respond effectively and safely.</p>
                    <p className="animate-slide">
                        EscapeXpert combines <b>Virtual Reality (VR) </b> and <b>AI</b> to enhance disaster preparedness. Users can simulate realistic scenarios, while AI calculates the safest evacuation routes.
                    </p>
                    <p className="animate-slide">
                        The platform predicts risks using environmental and historical data, showing heatmaps and performance reports.
                    </p>
                </div>
                <div className="about-images">
                    <div className="image-wrapper">
                        <img
                            src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExanA4dzlucTQ2ZnQzOGVkc2ZqamFnazcwd3Rsc3JjcjZ2M2Z3cnVoZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1dKkEfOzPc4MJUd1hc/giphy.gif"
                            alt="VR Simulation"
                        />
                    </div>
                </div>
            </section>

            {/* SERVICES SECTION */}
            <section className="services" id="services">
                <canvas id="network-bg-services"></canvas>
                <h2 className="serviceheading animate-fade option-gradient-heading">Our Core Services</h2>
                <div className="service-cards">
                    {services.map((service) => (
                        <div key={service.id} className="card animate-zoom">
                            <span className="card-icon">{service.icon}</span>
                            <h3>{service.title}</h3>
                            <p>{service.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* REVIEWS SECTION */}
            <section className="reviews" id="reviews">
                <h2 className="animate-fade gradient-heading">What Users Say</h2>
                <div className="review-cards">
                    <div className="review animate-slide">
                        <div className="review-pic-container">
                            <img src={Alice} alt="Alice" className="review-pic" />
                            <span className="review-name">Alice</span>
                        </div>
                        <div className="review-text">
                            <p>"This system helped me understand disaster response like never before!"</p>
                        </div>
                    </div>
                    <div className="review animate-slide">
                        <div className="review-pic-container">
                            <img src={Bob} alt="Bob" className="review-pic" />
                            <span className="review-name">Bob</span>
                        </div>
                        <div className="review-text">
                            <p>"The VR simulations are so realistic, it feels like being on the field."</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <div className="footer-container">
                    {/* 1. Brand Info & Mission */}
                    <div className="footer-section footer-left">
                        <h2 className="footer-logo">EscapeXpert</h2>
                        <p className="footer-mission">
                            Your trusted partner for smart room escape solutions, empowering preparedness through **AI and VR simulation**.
                        </p>
                        <div className="footer-socials">
                            <h3>Follow Us</h3>
                            <div className="social-icons">
                                <a href="https://www.facebook.com" aria-label="Facebook" className="sicon">
                                    <svg width="24" height="24" fill="#ffffff" viewBox="0 0 24 24">
                                        <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 3h-1.9v7A10 10 0 0022 12" />
                                    </svg>
                                </a>
                                <a href="https://www.instagram.com" aria-label="Instagram" className="sicon">
                                    <svg width="24" height="24" fill="#ffffff" viewBox="0 0 24 24">
                                        <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.3 2.4.5.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.5.4 1.2.5 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.9-.5 2.4-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.5.2-1.2.4-2.4.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.3-2.4-.5-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.5-.4-1.2-.5-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.9.5-2.4.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.5-.2 1.2-.4 2.4-.5C8.4 2.2 8.8 2.2 12 2.2zm0 3a4.8 4.8 0 100 9.6A4.8 4.8 0 0012 5.2zm0 7.9a3.1 3.1 0 110-6.2 3.1 3.1 0 010 6.2zM17.4 5.3a1.1 1.1 0 11-2.3 0 1.1 1.1 0 012.3 0z" />
                                    </svg>
                                </a>
                                <a href="https://www.linkedin.com" aria-label="LinkedIn" className="sicon">
                                    <svg width="24" height="24" fill="#ffffff" viewBox="0 0 24 24">
                                        <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8 8.5h3.8v2h.1c.5-1 1.8-2.1 3.7-2.1 4 0 4.7 2.6 4.7 6V23h-4v-6.5c0-1.6 0-3.6-2.2-3.6-2.2 0-2.6 1.7-2.6 3.5V23h-4V8.5z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* 2. Contact Info */}
                    <div className="footer-section footer-contact">
                        <h3>Get In Touch</h3>
                        <p>
                            <span className="icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 4h16v16H4V4zm8 8L4 6v12l8-6 8 6V6l-8 6z" fill="#ffffff" />
                                </svg>
                            </span>
                            escapexpert54@gmail.com
                        </p>
                        <p>
                            <span className="icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V21a1 1 0 01-1 1C10.07 22 2 13.93 2 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" fill="#ffffff" />
                                </svg>
                            </span>
                            +92 236716585
                        </p>
                        <p>
                            <span className="icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="#ffffff" />
                                </svg>
                            </span>
                            Chiniot, Pakistan
                        </p>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="footer-bottom">
                    <div className="footer-policy-links">
                        <Link to="/policy">Privacy Policy</Link>
                        <span>|</span>
                        <Link to="/terms">Terms of Service</Link>
                    </div>
                    <p>© 2025 EscapeXpert • All Rights Reserved</p>
                </div>
            </footer>
        </div>
    );
}