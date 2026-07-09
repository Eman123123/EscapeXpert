// src/components/DisasterControlPanel.jsx
import React, { useState } from 'react';
import './DisasterControlPanel.css';

const DisasterControlPanel = ({ 
  onSimulationStart, 
  onSimulationStop, 
  isSimulationActive,
  timeRemaining = 0,
  formattedTime = "00:00",
  disasterParams = {}
}) => {
  const [selectedDisaster, setSelectedDisaster] = useState('earthquake');
  const [earthquakeParams, setEarthquakeParams] = useState({
    magnitude: 5.0,
    duration: 10,
    intensity: 1.0
  });
  const [floodParams, setFloodParams] = useState({
    waterLevel: 1.0,
    speed: 1.0,
    duration: 15
  });

  const disasterTypes = [
    { id: 'earthquake', name: 'Earthquake', icon: '🌋' },
    { id: 'flood', name: 'Flood', icon: '🌊' }
  ];

  const handleEarthquakeParamChange = (param, value) => {
    setEarthquakeParams(prev => ({
      ...prev,
      [param]: parseFloat(value)
    }));
  };

  const handleFloodParamChange = (param, value) => {
    setFloodParams(prev => ({
      ...prev,
      [param]: param === 'duration' ? parseInt(value) : parseFloat(value)
    }));
  };

  const handleStartSimulation = () => {
    const params = selectedDisaster === 'earthquake' ? earthquakeParams : floodParams;
    onSimulationStart(selectedDisaster, params);
  };

  const handleStopSimulation = () => {
    onSimulationStop();
  };

  // Calculate progress percentage for timer
  const getTimerProgressPercentage = () => {
    const duration = disasterParams.duration || 
                    (selectedDisaster === 'earthquake' ? earthquakeParams.duration : floodParams.duration);
    return (timeRemaining / duration) * 100;
  };

  return (
    <div className="disaster-control-panel">
      <h3>Disaster Simulation</h3>
      
      {/* Timer Display */}
      {isSimulationActive && timeRemaining > 0 && (
        <div className="timer-section">
          <div className="timer-header">
            <span className="timer-icon">⏱️</span>
            <span className="timer-title">Simulation Timer</span>
          </div>
          <div className="timer-display">
            <div className="timer-value-large">{formattedTime}</div>
            <div className="timer-progress-container">
              <div 
                className="timer-progress-bar"
                style={{
                  width: `${getTimerProgressPercentage()}%`,
                  backgroundColor: timeRemaining <= 5 ? '#f44336' : '#4CAF50'
                }}
              ></div>
            </div>
            <div className="timer-remaining">
              {timeRemaining} seconds remaining
              {timeRemaining <= 5 && <span className="ending-soon"> (Ending soon!)</span>}
            </div>
          </div>
        </div>
      )}
      
      <div className="disaster-selection">
        <h4>Select Disaster</h4>
        <div className="disaster-buttons">
          {disasterTypes.map(disaster => (
            <button
              key={disaster.id}
              className={`disaster-btn ${selectedDisaster === disaster.id ? 'active' : ''}`}
              onClick={() => setSelectedDisaster(disaster.id)}
              disabled={isSimulationActive}
            >
              <span className="disaster-icon">{disaster.icon}</span>
              <span className="disaster-name">{disaster.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedDisaster === 'earthquake' && (
        <div className="earthquake-params">
          <h4>Earthquake Parameters</h4>
          
          <div className="param-control">
            <label>Magnitude: {earthquakeParams.magnitude}</label>
            <input
              type="range"
              min="3.0"
              max="9.0"
              step="0.1"
              value={earthquakeParams.magnitude}
              onChange={(e) => handleEarthquakeParamChange('magnitude', e.target.value)}
              disabled={isSimulationActive}
            />
            <div className="param-scale">
              <span>Minor</span>
              <span>Moderate</span>
              <span>Major</span>
            </div>
          </div>

          <div className="param-control">
            <label>Duration: {earthquakeParams.duration}s</label>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={earthquakeParams.duration}
              onChange={(e) => handleEarthquakeParamChange('duration', e.target.value)}
              disabled={isSimulationActive}
            />
          </div>

          <div className="param-control">
            <label>Intensity Factor: {earthquakeParams.intensity.toFixed(1)}</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={earthquakeParams.intensity}
              onChange={(e) => handleEarthquakeParamChange('intensity', e.target.value)}
              disabled={isSimulationActive}
            />
          </div>
        </div>
      )}

      {selectedDisaster === 'flood' && (
        <div className="flood-params">
          <h4>Flood Parameters</h4>
          
          <div className="param-control">
            <label>Water Level: {floodParams.waterLevel}m</label>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={floodParams.waterLevel}
              onChange={(e) => handleFloodParamChange('waterLevel', e.target.value)}
              disabled={isSimulationActive}
            />
            <div className="param-scale">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          <div className="param-control">
            <label>Rise Speed: {floodParams.speed.toFixed(1)}</label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={floodParams.speed}
              onChange={(e) => handleFloodParamChange('speed', e.target.value)}
              disabled={isSimulationActive}
            />
            <div className="param-scale">
              <span>Slow</span>
              <span>Moderate</span>
              <span>Rapid</span>
            </div>
          </div>

          <div className="param-control">
            <label>Duration: {floodParams.duration}s</label>
            <input
              type="range"
              min="15"
              max="90"
              step="5"
              value={floodParams.duration}
              onChange={(e) => handleFloodParamChange('duration', e.target.value)}
              disabled={isSimulationActive}
            />
            <div className="duration-hint">
              Floods typically last longer than earthquakes
            </div>
          </div>
        </div>
      )}

      <div className="simulation-controls">
        {!isSimulationActive ? (
          <button 
            className="start-simulation-btn"
            onClick={handleStartSimulation}
          >
            Start Simulation
          </button>
        ) : (
          <button 
            className="stop-simulation-btn"
            onClick={handleStopSimulation}
          >
            Stop Simulation
          </button>
        )}
      </div>
    </div>
  );
};

export default DisasterControlPanel;