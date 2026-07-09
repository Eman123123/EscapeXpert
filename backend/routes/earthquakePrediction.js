/*// routes/earthquakePrediction.js
const express = require('express');
const router = express.Router();

// Mock data for testing
const mockPredictions = {
    islamabad: {
        risk: 'MODERATE',
        hazardScore: 0.42,
        rfProbability: 0.68,
        features: {
            distanceToFault: 45.2,
            convergenceProxy: 320,
            seismicRate: 0.025,
            faultSlipProxy: 12.5,
            faultDensity: 0.008,
            seismicGap: 0.18,
            elevation: 450,
            slope: 12.5,
            vs30: 280
        }
    },
    karachi: {
        risk: 'LOW',
        hazardScore: 0.18,
        rfProbability: 0.22,
        features: {
            distanceToFault: 245.2,
            convergenceProxy: 120,
            seismicRate: 0.008,
            faultSlipProxy: 3.2,
            faultDensity: 0.002,
            seismicGap: 0.05,
            elevation: 8,
            slope: 1.2,
            vs30: 450
        }
    },
    quetta: {
        risk: 'HIGH',
        hazardScore: 0.78,
        rfProbability: 0.85,
        features: {
            distanceToFault: 12.5,
            convergenceProxy: 580,
            seismicRate: 0.045,
            faultSlipProxy: 28.5,
            faultDensity: 0.018,
            seismicGap: 0.42,
            elevation: 1680,
            slope: 25.5,
            vs30: 180
        }
    }
};

// Predict earthquake risk at a specific location
router.post('/predict', (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        
        console.log(`🌍 Predicting for location: ${lat}, ${lng}`);
        
        // Check if location is near known cities for demo
        let prediction;
        
        // Islamabad
        if (Math.abs(lat - 33.6844) < 0.5 && Math.abs(lng - 73.0479) < 0.5) {
            prediction = mockPredictions.islamabad;
        } 
        // Karachi
        else if (Math.abs(lat - 24.8607) < 0.5 && Math.abs(lng - 67.0011) < 0.5) {
            prediction = mockPredictions.karachi;
        } 
        // Quetta
        else if (Math.abs(lat - 30.1798) < 0.5 && Math.abs(lng - 67.0104) < 0.5) {
            prediction = mockPredictions.quetta;
        } 
        else {
            // Dynamic prediction based on distance to fault zones
            const distanceToChamanFault = calculateDistanceToFault(lat, lng);
            
            let hazardScore;
            if (distanceToChamanFault < 50) {
                hazardScore = 0.7 + Math.random() * 0.2;
            } else if (distanceToChamanFault < 150) {
                hazardScore = 0.4 + Math.random() * 0.3;
            } else {
                hazardScore = 0.1 + Math.random() * 0.3;
            }
            
            hazardScore = Math.min(0.95, Math.max(0.05, hazardScore));
            
            let riskLevel = 'LOW';
            if (hazardScore >= 0.45) riskLevel = 'HIGH';
            else if (hazardScore >= 0.25) riskLevel = 'MODERATE';
            
            prediction = {
                risk: riskLevel,
                hazardScore: parseFloat(hazardScore.toFixed(3)),
                rfProbability: parseFloat((hazardScore * 0.95).toFixed(3)),
                features: {
                    distanceToFault: parseFloat(distanceToChamanFault.toFixed(1)),
                    convergenceProxy: Math.round(600 - (distanceToChamanFault * 3)),
                    seismicRate: parseFloat((0.005 + Math.random() * 0.04).toFixed(4)),
                    faultSlipProxy: parseFloat((20 - (distanceToChamanFault * 0.15)).toFixed(1)),
                    faultDensity: parseFloat((0.005 + Math.random() * 0.015).toFixed(4)),
                    seismicGap: parseFloat((0.1 + Math.random() * 0.3).toFixed(3)),
                    elevation: Math.round(500 + Math.random() * 4000),
                    slope: parseFloat((5 + Math.random() * 35).toFixed(1)),
                    vs30: Math.round(200 + Math.random() * 600)
                }
            };
        }
        
        const response = {
            ...prediction,
            timestamp: new Date().toISOString(),
            location: { lat, lng }
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Failed to get prediction: ' + error.message });
    }
});

// Get model performance metrics
router.get('/metrics', (req, res) => {
    try {
        res.json({
            accuracy: 0.873,
            kappa: 0.742,
            f1_score: 0.85,
            roc_auc: 0.92,
            feature_importance: {
                'Distance to Fault': 0.284,
                'Plate Convergence': 0.221,
                'Seismic Rate': 0.187,
                'Fault Slip Rate': 0.132,
                'Fault Density': 0.089,
                'Seismic Gap': 0.052,
                'Site Conditions': 0.035
            }
        });
    } catch (error) {
        console.error('Metrics error:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});

// Get risk statistics for Pakistan
router.get('/statistics', (req, res) => {
    try {
        res.json({
            high_risk_percentage: 22.3,
            moderate_risk_percentage: 28.1,
            low_risk_percentage: 49.6,
            total_area_km2: 796095,
            last_updated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Helper function to calculate distance to Chaman Fault
function calculateDistanceToFault(lat, lng) {
    // Chaman Fault approximate coordinates
    const faultLat = 30.5;
    const faultLng = 67.0;
    
    // Calculate distance in km using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (lat - faultLat) * Math.PI / 180;
    const dLng = (lng - faultLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI/180) * Math.cos(faultLat * Math.PI/180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

module.exports = router;*/



/*
// backend/routes/earthquakePrediction.js
const express = require('express');
const router = express.Router();
const earthEngineService = require('../services/earthEngineService');

// Predict earthquake risk at specific location
router.post('/predict', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        
        const prediction = await earthEngineService.predictEarthquakeRisk(lat, lng);
        res.json(prediction);
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Failed to get prediction' });
    }
});

// Get model performance metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await earthEngineService.getModelMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Metrics error:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});

// Get risk statistics for Pakistan
router.get('/statistics', async (req, res) => {
    try {
        // Return precomputed statistics
        res.json({
            high_risk_percentage: 22.3,
            moderate_risk_percentage: 28.1,
            low_risk_percentage: 49.6,
            total_area_km2: 796095,
            last_updated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

module.exports = router;*/



// routes/earthquakePrediction.js
const express = require('express');
const router = express.Router();
const earthEngineService = require('../services/earthEngineService');

// Predict earthquake risk at specific location
router.post('/predict', async (req, res) => {
    try {
        const { lat, lng, location } = req.body;
        
        // Handle both coordinate and location name inputs
        let latitude = lat;
        let longitude = lng;
        
        // If location name is provided instead of coordinates
        if (location && !lat) {
            const coordinates = await getCoordinatesFromLocation(location);
            if (coordinates) {
                latitude = coordinates.lat;
                longitude = coordinates.lng;
            } else {
                return res.status(400).json({ error: 'Location not found' });
            }
        }
        
        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        
        console.log(`🌍 Predicting for location: ${latitude}, ${longitude}`);
        
        const prediction = await earthEngineService.predictEarthquakeRisk(latitude, longitude);
        
        // Format response for frontend
        const formattedResponse = {
            risk_level: prediction.risk,
            probability: prediction.hazardScore,
            rfProbability: prediction.rfProbability,
            date: new Date().toLocaleDateString(),
            location_name: location || getLocationName(latitude, longitude),
            coordinates: {
                lat: latitude,
                lon: longitude
            },
            features: {
                seismic_activity: prediction.features.seismicRate * 100,
                historical_frequency: (prediction.features.seismicRate * 100).toFixed(1),
                fault_distance: prediction.features.distanceToFault,
                ground_acceleration: prediction.hazardScore,
                liquefaction_potential: prediction.features.seismicGap,
                plate_activity: prediction.features.convergenceProxy > 300 ? "High" : "Moderate",
                elevation: prediction.features.elevation,
                population_density: 250 + Math.random() * 500,
                distance_to_fault: prediction.features.distanceToFault,
                convergence_proxy: prediction.features.convergenceProxy,
                fault_slip_proxy: prediction.features.faultSlipProxy,
                fault_density: prediction.features.faultDensity,
                seismic_gap: prediction.features.seismicGap,
                slope: prediction.features.slope,
                vs30: prediction.features.vs30
            },
            recommendations: getRecommendations(prediction.risk),
            timestamp: prediction.timestamp
        };
        
        res.json(formattedResponse);
        
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Failed to get prediction: ' + error.message });
    }
});

// Get model performance metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await earthEngineService.getModelMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Metrics error:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});

// Get risk statistics for Pakistan
router.get('/statistics', async (req, res) => {
    try {
        const stats = await earthEngineService.getRiskStatistics();
        res.json(stats);
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Helper function to get coordinates from location name
async function getCoordinatesFromLocation(locationName) {
    const locations = {
        'islamabad': { lat: 33.6844, lng: 73.0479 },
        'karachi': { lat: 24.8607, lng: 67.0011 },
        'lahore': { lat: 31.5204, lng: 74.3587 },
        'quetta': { lat: 30.1798, lng: 67.0104 },
        'peshawar': { lat: 34.0150, lng: 71.5249 },
        'multan': { lat: 30.1575, lng: 71.5249 },
        'gilgit': { lat: 35.9200, lng: 74.3146 },
        'rawalpindi': { lat: 33.5651, lng: 73.0169 },
        'faisalabad': { lat: 31.4504, lng: 73.1350 },
        'sialkot': { lat: 32.4945, lng: 74.5229 }
    };
    
    const key = locationName.toLowerCase().trim();
    return locations[key] || null;
}

// Helper function to get location name from coordinates
function getLocationName(lat, lng) {
    const locations = [
        { name: 'Islamabad', lat: 33.6844, lng: 73.0479, range: 0.5 },
        { name: 'Karachi', lat: 24.8607, lng: 67.0011, range: 0.5 },
        { name: 'Lahore', lat: 31.5204, lng: 74.3587, range: 0.5 },
        { name: 'Quetta', lat: 30.1798, lng: 67.0104, range: 0.5 },
        { name: 'Peshawar', lat: 34.0150, lng: 71.5249, range: 0.5 }
    ];
    
    for (const loc of locations) {
        if (Math.abs(lat - loc.lat) < loc.range && Math.abs(lng - loc.lng) < loc.range) {
            return loc.name;
        }
    }
    return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
}

// Helper function to get recommendations based on risk level
function getRecommendations(riskLevel) {
    if (riskLevel === 'HIGH') {
        return [
            "Seismic-resistant construction MANDATORY",
            "Microzonation study REQUIRED before construction",
            "Monthly evacuation drill ESSENTIAL",
            "72-hour emergency kit ESSENTIAL",
            "Register with NDMA immediately",
            "Avoid unreinforced masonry buildings",
            "Enable earthquake alerts on your phone"
        ];
    } else if (riskLevel === 'MODERATE') {
        return [
            "Follow BCP 2021 seismic building codes",
            "Soil investigation before construction",
            "Prepare emergency response plan",
            "Monitor PMD/NDMA bulletins regularly",
            "Secure heavy furniture to walls",
            "Store emergency water and food supplies"
        ];
    } else {
        return [
            "Standard BCP building codes sufficient",
            "Basic emergency preparedness advised",
            "Review annually - seismic hazard changes",
            "Keep emergency flashlight and radio handy",
            "Download emergency alert apps"
        ];
    }
}

module.exports = router;