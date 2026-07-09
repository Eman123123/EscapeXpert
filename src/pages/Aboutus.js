import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Aboutus.css";

// --- Image Assets ---
import EscapeXpert from "../assets/EscapeXpert.png";
import AneelaPic from "../assets/aneela1.jpeg";
import EmanPic from "../assets/eman.jpeg";
import IfrahPic from "../assets/ifrah.jpeg";
import Prof from "../assets/profile.png";

// --- TEAM DATA ---
const teamMembers = [
  {
    name: "Aneela Bashir",
    title: "Founder & Lead Developer",
    bio: "Aneela is the visionary behind this project, driving the front-end architecture and focusing on creating seamless user experiences. She specializes in React and advanced CSS.",
    image: AneelaPic,
    animationClass: "animate-zoom",
  },
  {
    name: "Eman Fatima",
    title: "UI/UX Designer & Content Strategist",
    bio: "Eman crafts the visual identity and user workflows, ensuring the platform is intuitive and aesthetically pleasing. She also manages our creative content strategy.",
    image: EmanPic,
    animationClass: "animate-slide-left",
  },
  {
    name: "Ifrah Rauf",
    title: "Backend Engineer & Database Specialist",
    bio: "Ifrah is responsible for the robust server-side logic and secure database management, ensuring high performance and data integrity for all our services.",
    image: IfrahPic,
    animationClass: "animate-slide-right",
  },
];

// --- FAQ DATA ---
const faqItems = [
  {
    question: "What makes EscapeXpert different from other modeling tools?",
    answer:
      "We specialize in combining real-time environmental data with AI-driven predictive modeling to offer unparalleled accuracy in disaster risk assessment and 3D environment creation for training purposes.",
  },
  {
    question: "Is the predictive modeling reliable for sensitive regions?",
    answer:
      "Yes, our models are trained on extensive global and regional data sets and are continuously validated using machine learning techniques to ensure high reliability across various geological and climatic zones.",
  },
  {
    question: "Do you offer custom enterprise solutions?",
    answer:
      "Absolutely. We offer tailored packages for government agencies and large corporations requiring specific data integration, custom environments, and dedicated support. Please contact us directly for a consultation.",
  },
];

// --- TEAM CARD COMPONENT ---
const TeamMemberCard = ({ member }) => (
  <div className={`team-card ${member.animationClass}`}>
    <div className="team-image-container">
      <img src={member.image} alt={`Profile of ${member.name}`} className="team-pic" />
    </div>
    <div className="team-details">
      <h3>{member.name}</h3>
      <p className="team-title">{member.title}</p>
      <p className="team-bio">{member.bio}</p>
    </div>
  </div>
);

// --- FAQ ITEM COMPONENT ---
const FaqItem = ({ item }) => (
  <details className="faq-item">
    <summary className="faq-question">{item.question}</summary>
    <p className="faq-answer">{item.answer}</p>
  </details>
);

// --- FAQ SECTION COMPONENT ---
const FaqSection = () => (
  <section className="faq-section">
    <h2 className="gradient-heading">
      Frequently Asked <span className="highlight-text">Questions</span>
    </h2>
    <div className="faq-list">
      {faqItems.map((item, index) => (
        <FaqItem key={index} item={item} />
      ))}
    </div>
  </section>
);

// --- MAIN ABOUT US / TEAM PAGE ---
export default function Team() {
  const { isLoggedIn, user, handleLogout } = useAuth();

  return (
    <div className="about-page-container">
      {/* HEADER (Same as Home.js) */}
      <header className="header">
        <div className="header-left">
          <img src={EscapeXpert} alt="EscapeXpert Logo" className="logo" />
          <nav>
            <a href="/#home">Home</a>
            <a href="/#about">Overview</a>
            <a href="/#services">Services</a>
            <a href="/#reviews">Reviews</a>
            <Link to="/contact">Contact Us</Link>
            {isLoggedIn && <Link to="/dashboard">Dashboard</Link>}
            <Link to="/Aboutus">About Us</Link>
          </nav>
        </div>
        <div className="header-right">
          {isLoggedIn ? (
            <>
              <div className="user-profile">
                <img src={user?.profilePic || Prof} alt={user?.username || "User"} className="profile-pic" />
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

      {/* TEAM SECTION */}
      <div className="team-page-container">
        <h1 className="gradient-heading">
          Meet Our <span className="highlight-text">Core Team</span>
        </h1>
        <div className="team-cards-grid">
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} member={member} />
          ))}
        </div>
      </div>

      {/* FAQ SECTION */}
      <FaqSection />
    </div>
  );
}
