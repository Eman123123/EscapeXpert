// export default FloodPredictor;
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import "./Flood.css";

function FloodPredictor() {
  const { isLoggedIn, user, handleLogout } = useAuth();

  // Input mode: 'location' or 'coords'
  const [inputMode, setInputMode] = useState("location");

  // Location input
  const [locationName, setLocationName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Coordinates input
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  // API response states
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const searchTimeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Pakistan boundaries
  const PAKISTAN_BOUNDS = {
    minLat: 23.5,
    maxLat: 37.1,
    minLon: 60.9,
    maxLon: 77.0
  };

  // Function to fetch location suggestions from Nominatim (Free)
  const fetchLocationSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    
    try {
      // Using Nominatim API - Free, no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&countrycodes=pk&format=json&limit=10&addressdetails=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'FloodPredictionApp/1.0' // Required by Nominatim
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      
      const data = await response.json();
      
      // Filter and format suggestions
      const formattedSuggestions = data
        .filter(item => {
          // Filter to ensure it's within Pakistan
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          return (
            lat >= PAKISTAN_BOUNDS.minLat && lat <= PAKISTAN_BOUNDS.maxLat &&
            lon >= PAKISTAN_BOUNDS.minLon && lon <= PAKISTAN_BOUNDS.maxLon
          );
        })
        .map((item) => ({
          name: item.display_name.split(',')[0], // Main name
          fullName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type,
          importance: item.importance
        }));
      
      setSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
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
    setSelectedLocation(null); // Clear selected location when typing
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search by 500ms
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

  // Function to check if coordinates are within Pakistan
  const isWithinPakistan = (latitude, longitude) => {
    return (
      latitude >= PAKISTAN_BOUNDS.minLat &&
      latitude <= PAKISTAN_BOUNDS.maxLat &&
      longitude >= PAKISTAN_BOUNDS.minLon &&
      longitude <= PAKISTAN_BOUNDS.maxLon
    );
  };

  // Function to get safety recommendations based on flood risk
  const getSafetyRecommendations = (riskLevel) => {
    if (riskLevel === "HIGH RISK") {
      return {
        title: "URGENT FLOOD SAFETY RECOMMENDATIONS",
        recommendations: [
          "IMMEDIATELY evacuate to higher ground if you are in a flood-prone area",
          "Do NOT attempt to walk, swim, or drive through flood waters",
          "Follow official evacuation orders without delay",
          "Keep emergency contact numbers: Rescue 1122, Army Flood Relief 1125",
          "Move to the highest level of your building",
          "Turn off electricity and gas if evacuation is ordered",
        ],
        color: "#ff4444",
        icon: "🚨"
      };
    } else {
      return {
        title: "PREVENTIVE FLOOD SAFETY MEASURES",
        recommendations: [
          "Prepare an emergency kit with food, water, medicines, and documents",
          "Know your area's flood risk and evacuation routes",
          "Maintain drainage systems around your home",
          "Store important documents in waterproof containers",
          "Keep emergency numbers saved: 1122 (Rescue)",
          "Monitor weather forecasts during monsoon season",
        ],
        color: "#4CAF50",
        icon: "✓"
      };
    }
  };

  // Function to get specific warnings based on environmental features
  const getSpecificWarnings = (features) => {
    const rainfall7d = features?.rainfall_7d_mm || 0;
    const rainfall30d = features?.rainfall_30d_mm || 0;
    const soilMoisture = features?.soil_moisture_percent || 0;
    const elevation = features?.elevation_m || 0;
    const distanceToRiver = features?.distance_to_river_km || 0;
    
    const warnings = [];
    
    if (rainfall7d > 100) {
      warnings.push("EXTREME: Over 100mm rainfall in past week - immediate evacuation advised");
    } else if (rainfall7d > 50) {
      warnings.push("WARNING: Over 50mm rainfall in past week - monitor water levels closely");
    } else if (rainfall7d > 25) {
      warnings.push("CAUTION: Significant rainfall detected - stay alert");
    }
    
    if (rainfall30d > 150) {
      warnings.push("EXTREME: Over 150mm rainfall in past month - high flood risk");
    } else if (rainfall30d > 100) {
      warnings.push("WARNING: Over 100mm rainfall in past month - elevated flood risk");
    }
    
    if (soilMoisture > 35) {
      warnings.push("Soil is highly saturated (>35%) - flooding may occur rapidly");
    } else if (soilMoisture > 25) {
      warnings.push("Soil moisture is elevated (>25%) - reduced water absorption");
    }
    
    if (elevation < 100) {
      warnings.push("Low elevation area (<100m) - naturally flood-prone");
    }
    
    if (distanceToRiver < 5) {
      warnings.push("Very close to river (<5km) - immediate flood risk during heavy rain");
    } else if (distanceToRiver < 15) {
      warnings.push("Near river (<15km) - monitor water levels");
    }
    
    return warnings;
  };

  // Function to call the Flask API
  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Validate input based on mode
    if (inputMode === "location") {
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
    } else {
      if (!lat || !lon) {
        setError("Please enter both latitude and longitude.");
        setLoading(false);
        return;
      }
      
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        setError("Please enter valid numeric coordinates.");
        setLoading(false);
        return;
      }
      
      // Validate coordinates are within Pakistan
      if (!isWithinPakistan(latitude, longitude)) {
        setError(`Location (${latitude}, ${longitude}) is outside Pakistan. 
        
Pakistan boundaries:
• Latitude: 23.5°N to 37.1°N
• Longitude: 60.9°E to 77.0°E

Please enter coordinates within Pakistan for accurate flood prediction.`);
        setLoading(false);
        return;
      }
    }

    let url = "";
    if (inputMode === "location") {
      url = `http://localhost:4001/api/predict?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}`;
    } else {
      url = `http://localhost:4001/api/predict?lat=${parseFloat(lat)}&lon=${parseFloat(lon)}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        throw new Error(data.error || "Prediction failed");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
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

    createParticleNetwork("network-bg-flood");
  }, []);

  const safetyRecs = result ? getSafetyRecommendations(result.risk_level) : null;
  const specificWarnings = result ? getSpecificWarnings(result.features) : [];

  return (
    <div className="prediction-container">
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        handleLogout={handleLogout}
        isAuthPage={false}
      />

      <main className="prediction-content">
        <canvas id="network-bg-flood"></canvas>

        <div className="prediction-card">
          <h2>Pakistan Flood Predictor</h2>
          
          <div className="info-note">
            This system provides flood predictions specifically for locations within Pakistan
          </div>

          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              onClick={() => {
                setInputMode("location");
                setError(null);
                setResult(null);
              }}
              className={`toggle-btn ${inputMode === "location" ? "active" : ""}`}
            >
              Search by City
            </button>
            <button
              onClick={() => {
                setInputMode("coords");
                setError(null);
                setResult(null);
                setSelectedLocation(null);
              }}
              className={`toggle-btn ${inputMode === "coords" ? "active" : ""}`}
            >
              Enter Coordinates
            </button>
          </div>

          {/* Input Group */}
          <div className="input-group">
            {inputMode === "location" ? (
              <div className="autocomplete-wrapper" ref={suggestionsRef}>
                <input
                  type="text"
                  placeholder="Start typing a city name (e.g., Lahore, Karachi, Islamabad)..."
                  value={locationName}
                  onChange={handleLocationInput}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="location-input"
                  autoComplete="off"
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
            ) : (
              <div className="inputs-row">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (23.5°N - 37.1°N)"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="coord-input"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (60.9°E - 77.0°E)"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  className="coord-input"
                />
              </div>
            )}

            <button onClick={fetchPrediction} disabled={loading} className="predict-btn">
              {loading ? "Predicting..." : "Predict Flood Risk"}
            </button>
          </div>

          {inputMode === "coords" && !error && !result && (
            <div className="coords-hint">
               Tip: Latitude range: 23.5° to 37.1° | Longitude range: 60.9° to 77.0°
            </div>
          )}

          {inputMode === "location" && selectedLocation && !error && !result && (
            <div className="selected-location">
              ✓ Selected: {selectedLocation.name}
            </div>
          )}

          {error && (
            <div className="error-message">
              <strong>Error:</strong>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="prediction-result">
              <div className="result-content">
                <h3>Prediction Result</h3>
                
                <div className={`risk-display ${result.risk_level === "HIGH RISK" ? "high-risk" : "low-risk"}`}>
                  <strong>Risk:</strong>
                  <span className="risk-level">
                    {result.risk_level === "HIGH RISK" ? "HIGH ⚠️" : "LOW ✓"}
                  </span>
                </div>

                <p className="location-info">
                  <strong>Coordinates:</strong> {result.location.latitude.toFixed(4)}, {result.location.longitude.toFixed(4)}
                </p>
                
                {result.input_method === "location_name" && result.location.input_used && (
                  <p><strong>Searched for:</strong> {result.location.input_used}</p>
                )}

                <h4>Environmental Features:</h4>
                <ul className="features-list">
                  <li> Rainfall (1d): {result.features.rainfall_1d_mm?.toFixed(2) ?? "N/A"} mm</li>
                  <li> Rainfall (7d): {result.features.rainfall_7d_mm?.toFixed(2) ?? "N/A"} mm</li>
                  <li> Rainfall (30d): {result.features.rainfall_30d_mm?.toFixed(2) ?? "N/A"} mm</li>
                  <li> Elevation: {result.features.elevation_m ?? "N/A"} m</li>
                  <li> Slope: {result.features.slope_deg?.toFixed(2) ?? "N/A"}°</li>
                  <li> Distance to river: {result.features.distance_to_river_km?.toFixed(2) ?? "N/A"} km</li>
                  <li> Soil moisture: {result.features.soil_moisture_percent?.toFixed(1) ?? "N/A"}%</li>
                  <li> NDVI: {result.features.ndvi?.toFixed(3) ?? "N/A"}</li>
                </ul>

                {specificWarnings.length > 0 && (
                  <div className="warnings-box">
                    <h4> Specific Warnings:</h4>
                    <ul>
                      {specificWarnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={`safety-section ${result.risk_level === "HIGH RISK" ? "high-risk-safety" : "low-risk-safety"}`}>
                  <h3 style={{ color: safetyRecs.color }}>
                    {safetyRecs.icon} {safetyRecs.title}
                  </h3>
                  <ul className="safety-list">
                    {safetyRecs.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default FloodPredictor;