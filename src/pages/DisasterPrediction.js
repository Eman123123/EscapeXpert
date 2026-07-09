// src/pages/Training.js

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import "./DisasterPrediction.css";

export default function Training() {
  const { isLoggedIn, user, handleLogout } = useAuth();
  const navigate = useNavigate();

  // ✅ Particle Network Function
  const createParticleNetwork = (
    canvasId,
    canvasHeight = null,
    particleCount = 60,
    maxDistance = 150,
    mouseRadius = 100
  ) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const parentSection = canvas.parentElement;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height =
      canvasHeight || parentSection.offsetHeight);

    const particles = [];
    let mouse = { x: null, y: null };

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
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse repel effect
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseRadius) {
            const angle = Math.atan2(dy, dx);
            const force = (mouseRadius - dist) / mouseRadius;
            p.vx += Math.cos(angle) * force * 0.4;
            p.vy += Math.sin(angle) * force * 0.4;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#A8D5BA";
        ctx.fill();
      });

      // Draw connecting lines
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168, 213, 186, ${
              1 - dist / maxDistance
            })`;
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
    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height =
        canvas.height = canvasHeight || parentSection.offsetHeight;
    });
  };

  // ✅ Initialize Background
  useEffect(() => {
    createParticleNetwork(
      "network-bg-training",
      null,
      60,
      150,
      100
    );
  }, []);

  return (
    <div className="prediction-container">
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        handleLogout={handleLogout}
        isAuthPage={false}
      />

      <main className="prediction-content">
        {/* ✅ Dynamic Background Canvas */}
        <canvas id="network-bg-training"></canvas>

        <h1 className="gradient-heading">
          Disaster Prediction Environment
        </h1>

        <div className="cards-container">
          {/* Flood Card */}
          <div className="prediction-card">
            <h2>Flood Prediction</h2>
            <p>
              Predict flood risk using environmental and
              weather data. Get real-time analysis and
              risk assessment.
            </p>
            <button
              className="card-btn"
              onClick={() => navigate("/flood")}
            >
              Go to Flood Prediction
            </button>
          </div>

          {/* Earthquake Card */}
          <div className="prediction-card">
            <h2>Earthquake Prediction</h2>
            <p>
              Analyze seismic activity and predict
              potential earthquake risks using advanced AI
              models.
            </p>
            <button
              className="card-btn"
              onClick={() => navigate("/earthquake")}
            >
              Go to Earthquake Prediction
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}