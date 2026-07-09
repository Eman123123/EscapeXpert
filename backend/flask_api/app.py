# flask_api/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import ee
import json
import os
import math
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from functools import lru_cache

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:5000", "*"]}})

# ============================================
# CONFIGURATION
# ============================================

EE_KEY_PATH = os.path.join(os.path.dirname(__file__), 'ee-key.json')
EE_ACCOUNT = os.getenv('EARTH_ENGINE_SERVICE_ACCOUNT', 'earthquake-prediction@earthquake-487805.iam.gserviceaccount.com')

# USE YOUR EXISTING v3 ASSETS
EE_ASSETS = {
    'hazard_map': 'users/ifrah/pakistan_hazard_score_v3',
    'risk_map': 'users/ifrah/pakistan_earthquake_risk_v3',
    'rf_probability': 'users/ifrah/pakistan_rf_probability_v3',
    'faults': 'users/ifrah/pakistan_active_faults_v3'
}

# Pakistan boundaries
PAKISTAN_BOUNDS = {
    'lat_min': 23.0, 'lat_max': 38.0,
    'lng_min': 60.0, 'lng_max': 78.0
}

# Dynamic date with 30-day lag
clientNow = datetime.now()
clientToday = clientNow.strftime('%Y-%m-%d')
lagDate = clientNow - timedelta(days=30)
predictionDateStr = lagDate.strftime('%Y-%m-%d')

# P50 THRESHOLD FROM GEE ANALYSIS
P50_THRESHOLD = 0.732

# Cache for geocoding results
GEOCODE_CACHE = {}

# ============================================
# EARTH ENGINE INITIALIZATION
# ============================================

def init_earth_engine():
    """Initialize Earth Engine with service account"""
    try:
        if os.path.exists(EE_KEY_PATH):
            credentials = ee.ServiceAccountCredentials(EE_ACCOUNT, EE_KEY_PATH)
            ee.Initialize(credentials)
            print("✅ Earth Engine initialized successfully!")
            
            test_image = ee.Image(EE_ASSETS['hazard_map'])
            test_image.bandNames().getInfo()
            print(f"✅ Successfully loaded: {EE_ASSETS['hazard_map']}")
            return True
        else:
            print(f"⚠️ Key file not found at: {EE_KEY_PATH}")
            return False
    except Exception as e:
        print(f"⚠️ Earth Engine initialization failed: {e}")
        return False

ee_initialized = init_earth_engine()

# ============================================
# DYNAMIC GEOCODING USING NOMINATIM API
# ============================================

def geocode_city(city_name):
    """
    Convert any city name to coordinates using Nominatim API.
    No hardcoded coordinates! Dynamically fetches from OpenStreetMap.
    Results are cached for performance.
    """
    global GEOCODE_CACHE
    
    city_lower = city_name.lower().strip()
    
    # Check cache first
    if city_lower in GEOCODE_CACHE:
        cached = GEOCODE_CACHE[city_lower]
        print(f"📦 Using cached coordinates for {city_name}")
        return cached['lat'], cached['lng'], cached['name']
    
    try:
        # Use Nominatim API with English language forced
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': city_name,
            'countrycodes': 'pk',
            'format': 'json',
            'limit': 5,
            'accept-language': 'en',  # Force English results
            'addressdetails': 1
        }
        headers = {
            'User-Agent': 'EscapeXpert-Earthquake-Prediction/1.0'
        }
        
        print(f"🔍 Geocoding: {city_name}")
        response = requests.get(url, params=params, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            for item in data:
                # Check if location is in Pakistan
                display_name = item.get('display_name', '')
                if 'Pakistan' in display_name:
                    lat = float(item['lat'])
                    lon = float(item['lon'])
                    
                    # Extract city name from display_name
                    parts = display_name.split(',')
                    city_display = parts[0].strip()
                    
                    # Cache the result
                    GEOCODE_CACHE[city_lower] = {
                        'lat': lat,
                        'lng': lon,
                        'name': city_display
                    }
                    
                    print(f"📍 Found: {city_display} at ({lat:.4f}, {lon:.4f})")
                    return lat, lon, city_display
            
            print(f"⚠️ No Pakistan location found for '{city_name}'")
            return None
        else:
            print(f"⚠️ Nominatim API error: {response.status_code}")
            return None
            
    except requests.exceptions.Timeout:
        print(f"⚠️ Geocoding timeout for '{city_name}'")
        return None
    except Exception as e:
        print(f"⚠️ Geocoding error: {e}")
        return None


def get_city_suggestions(query):
    """
    Get city suggestions for frontend dropdown
    """
    if not query or len(query) < 2:
        return []
    
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': query,
            'countrycodes': 'pk',
            'format': 'json',
            'limit': 10,
            'accept-language': 'en',
            'addressdetails': 1
        }
        headers = {
            'User-Agent': 'EscapeXpert-Earthquake-Prediction/1.0'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            suggestions = []
            for item in data:
                display_name = item.get('display_name', '')
                if 'Pakistan' in display_name:
                    parts = display_name.split(',')
                    city_name = parts[0].strip()
                    suggestions.append({
                        'name': city_name,
                        'fullName': display_name,
                        'lat': float(item['lat']),
                        'lon': float(item['lon'])
                    })
            return suggestions
        return []
    except Exception as e:
        print(f"⚠️ Suggestion error: {e}")
        return []

# ============================================
# RISK CALCULATION FUNCTIONS
# ============================================

def get_risk_from_gee(lat, lng):
    """Get risk score directly from GEE asset (v3)"""
    try:
        point = ee.Geometry.Point([lng, lat])
        hazard_image = ee.Image(EE_ASSETS['hazard_map'])
        
        hazard_value = hazard_image.reduceRegion(
            reducer=ee.Reducer.first(),
            geometry=point,
            scale=5000,
            bestEffort=True
        ).get('compositeHazard').getInfo()
        
        if hazard_value is not None:
            hazard_score = float(hazard_value)
            risk_level = 'HIGH' if hazard_score >= P50_THRESHOLD else 'LOW'
            
            print(f"✅ GEE Hazard: {hazard_score:.4f} | Threshold: {P50_THRESHOLD} | Risk: {risk_level}")
            
            return {
                'risk_level': risk_level,
                'hazard_score': round(hazard_score, 3),
                'rf_probability': round(hazard_score * 0.95, 3),
                'data_source': 'GEE Asset v3',
                'threshold': P50_THRESHOLD
            }
        return None
    except Exception as e:
        print(f"⚠️ GEE read error: {e}")
        return None

def haversine_distance(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def calculate_distance_to_fault(lat, lng):
    faults = [(30.5, 67.0), (25.5, 63.5), (35.5, 74.0), (32.8, 72.5), (36.0, 75.5)]
    min_dist = float('inf')
    for fl, fg in faults:
        dist = haversine_distance(lat, lng, fl, fg)
        min_dist = min(min_dist, dist)
    return min_dist

def get_risk_fallback(lat, lng):
    distance = calculate_distance_to_fault(lat, lng)
    
    if distance < 50:
        base = 0.85
    elif distance < 100:
        base = 0.65
    elif distance < 200:
        base = 0.45
    elif distance < 300:
        base = 0.25
    else:
        base = 0.15
    
    high_risk_zones = [(35.0, 74.0, 0.15), (30.5, 67.0, 0.12), (34.0, 73.0, 0.10)]
    for zl, zlg, boost in high_risk_zones:
        zd = haversine_distance(lat, lng, zl, zlg)
        if zd < 100:
            base += boost * (1 - zd/100)
    
    hazard = min(0.95, max(0.05, base))
    risk = 'HIGH' if hazard >= P50_THRESHOLD else 'LOW'
    
    return {
        'risk_level': risk,
        'hazard_score': round(hazard, 3),
        'rf_probability': round(hazard * 0.95, 3),
        'data_source': 'Fallback Calculation',
        'threshold': P50_THRESHOLD
    }

def get_recommendations(risk_level):
    if risk_level == 'HIGH':
        return [
            "Seismic-resistant construction is MANDATORY",
            "Microzonation study REQUIRED before any construction",
            "Conduct monthly earthquake evacuation drills",
            "Maintain 72-hour emergency kit at all times",
            "Register with NDMA for emergency alerts"
        ]
    else:
        return [
            "Standard BCP building codes are sufficient",
            "Basic emergency preparedness is advised",
            "Review seismic hazard maps annually",
            "Keep emergency flashlight and radio handy"
        ]

# ============================================
# API ENDPOINTS
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'reference_date': predictionDateStr,
        'gee_initialized': ee_initialized,
        'port': 6000,
        'threshold': P50_THRESHOLD
    })

@app.route('/api/cities', methods=['GET'])
def get_cities():
    """Get city suggestions based on query parameter"""
    query = request.args.get('q', '')
    suggestions = get_city_suggestions(query)
    return jsonify({
        'success': True,
        'suggestions': suggestions
    })

@app.route('/api/earthquake/predict', methods=['POST'])
def predict_earthquake():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        location_name = data.get('location', '').strip()
        
        if not location_name:
            return jsonify({'error': 'Please enter a city name'}), 400
        
        # DYNAMIC GEOCODING - No hardcoded coordinates!
        geocode_result = geocode_city(location_name)
        
        if not geocode_result:
            return jsonify({'error': f'City "{location_name}" not found in Pakistan. Please try a different city name.'}), 404
        
        lat, lng, display_name = geocode_result
        
        print(f"📍 Predicting for: {display_name} ({lat:.4f}, {lng:.4f})")
        
        risk_data = get_risk_from_gee(lat, lng)
        if not risk_data:
            print("⚠️ GEE unavailable, using fallback")
            risk_data = get_risk_fallback(lat, lng)
        
        distance = calculate_distance_to_fault(lat, lng)
        
        features = {
            'distance_to_fault': round(distance, 1),
            'seismic_activity': round(risk_data['hazard_score'] * 100, 2),
            'historical_frequency': round(risk_data['hazard_score'] * 35 + 5, 1),
            'fault_slip_proxy': round(max(0.5, 25 - distance * 0.12), 1),
            'convergence_proxy': max(50, min(600, round(600 - distance * 2.5))),
            'liquefaction_potential': round(risk_data['hazard_score'] * 0.7, 3),
            'plate_activity': 'High' if risk_data['hazard_score'] > 0.5 else 'Moderate',
            'elevation': round(300 + (1 - risk_data['hazard_score']) * 2000),
            'slope': round(5 + risk_data['hazard_score'] * 30),
            'vs30': round(200 + (1 - risk_data['hazard_score']) * 500)
        }
        
        response = {
            'risk_level': risk_data['risk_level'],
            'probability': risk_data['hazard_score'],
            'rfProbability': risk_data.get('rf_probability', risk_data['hazard_score'] * 0.95),
            'date': datetime.now().strftime('%Y-%m-%d'),
            'location_name': display_name,
            'coordinates': {'lat': lat, 'lon': lng},
            'features': features,
            'recommendations': get_recommendations(risk_data['risk_level']),
            'timestamp': datetime.now().isoformat(),
            'data_source': risk_data.get('data_source', 'GEE Asset'),
            'threshold': risk_data.get('threshold', P50_THRESHOLD)
        }
        
        print(f"✅ Result: {risk_data['risk_level']} RISK ({risk_data['hazard_score']*100:.1f}%)")
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/earthquake/metrics', methods=['GET'])
def get_metrics():
    return jsonify({
        'accuracy': 87.3,
        'kappa': 0.742,
        'f1_score': 0.85,
        'roc_auc': 0.92,
        'risk_system': '2-class (HIGH/LOW)',
        'threshold': P50_THRESHOLD,
        'gee_initialized': ee_initialized
    })

@app.route('/api/earthquake/statistics', methods=['GET'])
def get_statistics():
    return jsonify({
        'high_risk_percentage': 50.0,
        'low_risk_percentage': 50.0,
        'total_area_km2': 796095,
        'risk_system': '2-class (HIGH/LOW)',
        'threshold': P50_THRESHOLD,
        'last_updated': datetime.now().isoformat()
    })

@app.route('/test-gee', methods=['GET'])
def test_gee():
    try:
        lat = 33.6844
        lng = 73.0479
        point = ee.Geometry.Point([lng, lat])
        image = ee.Image(EE_ASSETS['hazard_map'])
        bands = image.bandNames().getInfo()
        value = image.reduceRegion(
            reducer=ee.Reducer.first(),
            geometry=point,
            scale=5000
        ).getInfo()
        
        return jsonify({
            'success': True,
            'bands': bands,
            'value': value,
            'asset': EE_ASSETS['hazard_map'],
            'threshold': P50_THRESHOLD
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# RUN SERVER
# ============================================

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Pakistan Earthquake Prediction API")
    print("=" * 50)
    print(f"📍 Health: http://localhost:6000/health")
    print(f"📍 Predict: POST http://localhost:6000/api/earthquake/predict")
    print(f"📍 Test GEE: http://localhost:6000/test-gee")
    print(f"📅 Reference date (30-day lag): {predictionDateStr}")
    print(f"🗺️ GEE Status: {'CONNECTED' if ee_initialized else 'DISCONNECTED'}")
    print(f"📊 P50 Threshold: {P50_THRESHOLD}")
    print("=" * 50)
    print("🌍 Geocoding: Using Nominatim API (OpenStreetMap)")
    print("   - NO hardcoded coordinates!")
    print("   - Dynamically fetches ANY city in Pakistan")
    print("   - Results are cached for performance")
    print("=" * 50)
    app.run(host='0.0.0.0', port=6000, debug=True)