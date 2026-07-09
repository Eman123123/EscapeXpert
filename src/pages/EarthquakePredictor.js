// src/pages/EarthquakePredictor.js

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import "./EarthquakePredictor.css";

function EarthquakePredictor() {
  const { isLoggedIn, user, handleLogout } = useAuth();

  // Location input
  const [locationName, setLocationName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // API response states
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const searchTimeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Function to fetch location suggestions from backend API
  const fetchLocationSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success && data.suggestions) {
        const formattedSuggestions = data.suggestions.map(item => ({
          name: item.name,
          fullName: item.fullName,
          lat: item.lat,
          lon: item.lon
        }));
        setSuggestions(formattedSuggestions);
        setShowSuggestions(formattedSuggestions.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search to avoid too many API calls
  const handleLocationInput = (e) => {
    const value = e.target.value;
    setLocationName(value);
    setSelectedLocation(null);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchLocationSuggestions(value);
    }, 500);
  };

  const handleSelectSuggestion = (suggestion) => {
    setLocationName(suggestion.name);
    setSelectedLocation({
      name: suggestion.name,
      fullName: suggestion.fullName,
      lat: suggestion.lat,
      lon: suggestion.lon
    });
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Function to call the earthquake prediction API
  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    if (!locationName.trim()) {
      setError("Please type and select a location from the suggestions.");
      setLoading(false);
      return;
    }
    
    if (!selectedLocation) {
      setError("Please select a location from the dropdown suggestions.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/earthquake/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: selectedLocation.name }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setResult(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchPrediction();
    }
  };

  // Particle Network Background
  useEffect(() => {
    const createParticleNetwork = (
      canvasId,
      particleCount = 60,
      maxDistance = 150,
      mouseRadius = 100
    ) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const parentSection = canvas.parentElement;

      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = parentSection.offsetHeight);

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
        height = canvas.height = parentSection.offsetHeight;
      });
    };

    createParticleNetwork("network-bg-earthquake");
  }, []);

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'HIGH': return '#ff4444';
      default: return '#4CAF50';
    }
  };

  return (
    <div className="prediction-container">
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        handleLogout={handleLogout}
        isAuthPage={false}
      />

      <main className="prediction-content">
        <canvas id="network-bg-earthquake"></canvas>

        <div className="prediction-card" style={{ maxWidth: "650px", margin: "0 auto" }}>
          <h2>🇵🇰 Pakistan Earthquake Predictor</h2>
          <p style={{ color: "#52796f", marginBottom: "20px", fontSize: "14px" }}>
            Start typing a city name to get seismic risk assessment
          </p>

          {/* Input Group with Autocomplete */}
          <div className="input-group">
            <div className="autocomplete-wrapper" ref={suggestionsRef}>
              <input
                type="text"
                placeholder="Start typing a city name (e.g., Lahore, Gilgit, Quetta)..."
                value={locationName}
                onChange={handleLocationInput}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyPress={handleKeyPress}
                className="location-input"
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "15px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#52796f"}
                onBlur={(e) => e.target.style.borderColor = "#ccc"}
              />
              
              {isSearching && (
                <div className="searching-indicator">Searching...</div>
              )}
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="suggestion-item"
                    >
                      <div className="suggestion-name">{suggestion.name}</div>
                      <div className="suggestion-detail">
                        {suggestion.fullName.substring(0, 80)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showSuggestions && !isSearching && locationName.length >= 2 && suggestions.length === 0 && (
                <div className="no-results">
                  No locations found in Pakistan. Try a different name.
                </div>
              )}
            </div>

            <button 
              onClick={fetchPrediction} 
              disabled={loading} 
              className="card-btn"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                backgroundColor: "#52796f",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              {loading ? "Analyzing Seismic Data..." : "Predict Earthquake Risk"}
            </button>
          </div>

          {selectedLocation && !error && !result && (
            <div className="selected-location">
              ✓ Selected: {selectedLocation.name}
            </div>
          )}

          {error && (
            <div style={{ 
              color: "#d32f2f", 
              marginTop: "20px", 
              padding: "15px", 
              background: "#ffebee", 
              borderRadius: "8px",
              borderLeft: "4px solid #ff4444"
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div style={{ textAlign: "left", marginTop: "30px" }}>
              <h3>Earthquake Risk Assessment for {result.location_name}</h3>
              
              <p>
                <strong>Risk Level:</strong>{" "}
                <span 
                  style={{ 
                    color: getRiskColor(result.risk_level), 
                    fontWeight: "bold", 
                    fontSize: "20px",
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    background: `${getRiskColor(result.risk_level)}20`
                  }}
                >
                  {result.risk_level}
                </span>
              </p>
              
              {result.coordinates && (
                <p><strong>Coordinates:</strong> {result.coordinates.lat?.toFixed(4)}°, {result.coordinates.lon?.toFixed(4)}°</p>
              )}

              <h4>Seismic Features:</h4>
              <ul style={{ paddingLeft: "20px" }}>
                <li><strong>Distance to Fault:</strong> {result.features?.distance_to_fault || "N/A"} km</li>
                <li><strong>Seismic Activity Score:</strong> {result.features?.seismic_activity || "N/A"}</li>
                <li><strong>Historical Frequency:</strong> {result.features?.historical_frequency || "N/A"} events/year</li>
                <li><strong>Fault Slip Rate:</strong> {result.features?.fault_slip_proxy || "N/A"} mm/yr</li>
                <li><strong>Plate Convergence Index:</strong> {result.features?.convergence_proxy || "N/A"}</li>
                <li><strong>Soil Liquefaction Potential:</strong> {result.features?.liquefaction_potential || "N/A"}</li>
                <li><strong>Elevation:</strong> {result.features?.elevation || "N/A"} m</li>
                <li><strong>Slope:</strong> {result.features?.slope || "N/A"}°</li>
                <li><strong>Vs30 (Soil Type):</strong> {result.features?.vs30 || "N/A"} m/s</li>
              </ul>

              {result.recommendations && (
                <>
                  <h4>Safety Recommendations:</h4>
                  <ul style={{ paddingLeft: "20px" }}>
                    {result.recommendations.map((rec, index) => {
                      return <li key={index} style={{ marginBottom: "8px" }}>{rec}</li>;
                    })}
                  </ul>
                </>
              )}
              
              <p style={{ 
                fontSize: "11px", 
                color: "#666", 
                marginTop: "20px", 
                textAlign: "center",
                borderTop: "1px solid #eee",
                paddingTop: "15px"
              }}>
                Powered by: Google Earth Engine | USGS Earthquake Data | GEM Active Faults | Random Forest ML
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default EarthquakePredictor;