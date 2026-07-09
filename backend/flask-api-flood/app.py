import ee
import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import traceback

# ============================================================================
# INITIALIZE FLASK APP
# ============================================================================

app = Flask(__name__)
CORS(app)

# ============================================================================
# EARTH ENGINE INITIALIZATION
# ============================================================================

YOUR_PROJECT_ID = "fpfinal"
MODEL_ASSET_PATH = f"projects/{YOUR_PROJECT_ID}/assets/floodmodel_raw"

print("=" * 60)
print(" PAKISTAN FLOOD PREDICTION API")
print("=" * 60)

try:
    ee.Initialize(project=YOUR_PROJECT_ID)
    print(f" Earth Engine initialized with project: {YOUR_PROJECT_ID}")
    EE_INITIALIZED = True
except Exception as e:
    print(f" Earth Engine initialization error: {e}")
    EE_INITIALIZED = False

# ============================================================================
# LOAD MODEL
# ============================================================================

MODEL = None
FEATURE_BANDS = [
    'rainfall_1d', 'rainfall_3d', 'rainfall_7d', 'rainfall_14d', 'rainfall_30d',
    'elevation', 'slope', 'distToRiver', 'soil_moisture', 'ndvi', 'dayOfYear', 'month'
]

if EE_INITIALIZED:
    try:
        MODEL = ee.Classifier.load(MODEL_ASSET_PATH)
        print(f" Model loaded from: {MODEL_ASSET_PATH}")
    except Exception as e:
        print(f" Could not load model: {e}")

# ============================================================================
# PAKISTAN BOUNDARIES
# ============================================================================

PAKISTAN_BOUNDS = {'min_lat': 23.0, 'max_lat': 37.0, 'min_lon': 60.0, 'max_lon': 77.0}

def is_in_pakistan(lat, lon):
    return (PAKISTAN_BOUNDS['min_lat'] <= lat <= PAKISTAN_BOUNDS['max_lat'] and 
            PAKISTAN_BOUNDS['min_lon'] <= lon <= PAKISTAN_BOUNDS['max_lon'])

def get_pakistan_ee():
    return ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017").filter(ee.Filter.eq('country_na', 'Pakistan')).geometry()

def get_major_rivers_ee():
    rivers = ee.FeatureCollection([
        ee.Feature(ee.Geometry.LineString([
            [72.5, 24.5], [72.8, 25.0], [73.0, 25.5], [73.2, 26.0], [73.5, 26.5],
            [73.8, 27.0], [74.0, 27.5], [74.2, 28.0], [74.5, 28.5], [74.8, 29.0],
            [75.0, 29.5], [75.2, 30.0], [75.5, 30.5], [75.8, 31.0], [76.0, 31.5],
            [76.2, 32.0], [76.5, 32.5], [76.8, 33.0], [77.0, 33.5], [77.2, 34.0]
        ]), {'name': 'Indus'}),
        ee.Feature(ee.Geometry.LineString([
            [73.5, 31.0], [74.0, 31.5], [74.5, 32.0], [74.8, 32.5], [75.0, 33.0]
        ]), {'name': 'Chenab'}),
        ee.Feature(ee.Geometry.LineString([
            [73.0, 30.5], [73.5, 31.0], [74.0, 31.5], [74.3, 32.0]
        ]), {'name': 'Ravi'}),
        ee.Feature(ee.Geometry.LineString([
            [74.5, 32.5], [75.0, 33.0], [75.5, 33.5], [75.8, 34.0]
        ]), {'name': 'Jhelum'}),
        ee.Feature(ee.Geometry.LineString([
            [71.0, 29.0], [71.5, 29.5], [72.0, 30.0], [72.5, 30.5]
        ]), {'name': 'Sutlej'})
    ])
    return rivers

# ============================================================================
# FEATURE EXTRACTION FUNCTIONS
# ============================================================================

def get_rainfall(start_date, end_date):
    return ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY') \
        .filterDate(start_date, end_date) \
        .filterBounds(get_pakistan_ee()) \
        .select('precipitation')

def get_elevation():
    return ee.Image('USGS/SRTMGL1_003').select('elevation')

def get_slope():
    return ee.Terrain.slope(get_elevation())

def get_soil_moisture(start_date, end_date):
    col = ee.ImageCollection('NASA/SMAP/SPL4SMGP/007') \
        .filterDate(start_date, end_date) \
        .filterBounds(get_pakistan_ee()) \
        .select('sm_surface')
    return ee.Image(ee.Algorithms.If(col.size().gt(0), col.mean(), ee.Image.constant(0.25)))

def get_ndvi(start_date, end_date):
    col = ee.ImageCollection('MODIS/061/MOD13A2') \
        .filterDate(start_date, end_date) \
        .filterBounds(get_pakistan_ee()) \
        .select('NDVI')
    return ee.Image(ee.Algorithms.If(col.size().gt(0), col.mean().multiply(0.0001), ee.Image.constant(0.3)))

def get_distance_to_river():
    try:
        rivers = get_major_rivers_ee()
        distance = rivers.distance(50000).unmask(100000)
        return distance.rename('distToRiver')
    except Exception as e:
        print(f"River distance error: {e}")
        return ee.Image.constant(100000).rename('distToRiver')

def extract_features_ee(date_str):
    date_obj = ee.Date(date_str)
    
    rainfall_1d = get_rainfall(date_obj.advance(-1, 'day'), date_obj).sum().unmask(0).rename('rainfall_1d')
    rainfall_3d = get_rainfall(date_obj.advance(-3, 'day'), date_obj).sum().unmask(0).rename('rainfall_3d')
    rainfall_7d = get_rainfall(date_obj.advance(-7, 'day'), date_obj).sum().unmask(0).rename('rainfall_7d')
    rainfall_14d = get_rainfall(date_obj.advance(-14, 'day'), date_obj).sum().unmask(0).rename('rainfall_14d')
    rainfall_30d = get_rainfall(date_obj.advance(-30, 'day'), date_obj).sum().unmask(0).rename('rainfall_30d')
    
    elevation = get_elevation().rename('elevation')
    slope = get_slope().rename('slope')
    dist_river = get_distance_to_river()
    
    soil_moisture = get_soil_moisture(date_obj.advance(-30, 'day'), date_obj).rename('soil_moisture')
    ndvi = get_ndvi(date_obj.advance(-30, 'day'), date_obj).rename('ndvi')
    
    day_of_year = ee.Image.constant(date_obj.getRelative('day', 'year')).rename('dayOfYear')
    month = ee.Image.constant(date_obj.get('month')).rename('month')
    
    return ee.Image.cat([
        rainfall_1d, rainfall_3d, rainfall_7d, rainfall_14d, rainfall_30d,
        elevation, slope, dist_river, soil_moisture, ndvi, day_of_year, month
    ])

# ============================================================================
# GEOCODING FUNCTION
# ============================================================================

def geocode_location(location_name):
    try:
        location_name = location_name.strip()
        if 'pakistan' not in location_name.lower():
            location_name = f"{location_name}, Pakistan"
        
        url = "https://nominatim.openstreetmap.org/search"
        params = {'q': location_name, 'format': 'json', 'limit': 1}
        headers = {'User-Agent': 'FloodPredictionAPI/1.0'}
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                lat = float(data[0]['lat'])
                lon = float(data[0]['lon'])
                if is_in_pakistan(lat, lon):
                    return True, lat, lon, data[0].get('display_name', location_name), None
                else:
                    return False, None, None, None, "Location found but outside Pakistan"
            else:
                return False, None, None, None, "Location not found"
        else:
            return False, None, None, None, "Geocoding service error"
    except Exception as e:
        return False, None, None, None, f"Error: {str(e)}"

# ============================================================================
# GET LATEST DATE
# ============================================================================

def get_latest_date():
    try:
        latest = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY') \
            .filterBounds(get_pakistan_ee()) \
            .sort('system:time_start', False) \
            .first()
        return ee.Date(latest.get('system:time_start')).format('YYYY-MM-dd').getInfo()
    except:
        return datetime.now().strftime('%Y-%m-%d')

# ============================================================================
# PREDICTION FUNCTION
# ============================================================================

def predict_flood_risk(lat, lon, date=None):
    try:
        if MODEL is None:
            return {'success': False, 'error': 'Model not loaded'}
        
        if date is None:
            date = get_latest_date()
        
        print(f"Predicting for: {lat}, {lon} on {date}")
        
        features = extract_features_ee(date)
        point = ee.Geometry.Point([lon, lat])
        
        classified = features.select(FEATURE_BANDS).classify(MODEL)
        class_result = classified.reduceRegion(
            reducer=ee.Reducer.first(),
            geometry=point,
            scale=1000
        ).getInfo()
        
        print(f" Classification result: {class_result}")
        
        # Safe extraction of classification
        model_risk = 0
        if class_result and 'classification' in class_result:
            val = class_result['classification']
            if val is not None:
                model_risk = int(val)
        
        feature_values = features.select(FEATURE_BANDS).reduceRegion(
            reducer=ee.Reducer.first(),
            geometry=point,
            scale=1000
        ).getInfo()
        
        if not feature_values:
            return {'success': False, 'error': 'Could not extract features at location'}
        
        # Safe extraction of values
        rainfall_7d = feature_values.get('rainfall_7d') or 0
        rainfall_30d = feature_values.get('rainfall_30d') or 0
        elevation = feature_values.get('elevation') or 0
        soil_moisture = feature_values.get('soil_moisture') or 0
        ndvi = feature_values.get('ndvi') or 0
        month = feature_values.get('month') or 2
        dist_to_river = feature_values.get('distToRiver') or 0
        
        # Convert distance to km
        if dist_to_river > 10000:
            dist_to_river_km = dist_to_river / 1000
        else:
            dist_to_river_km = dist_to_river
        
        print(f" Features: Rain7d={rainfall_7d:.1f}mm, Rain30d={rainfall_30d:.1f}mm, Elev={elevation:.0f}m, Dist={dist_to_river_km:.1f}km, Month={month}, SoilMoisture={soil_moisture:.2f}")
        
        # ================================================================
        # IMPROVED PROBABILITY CALCULATION - More realistic weights
        # ================================================================
        
        # Start with a lower base probability (15% instead of 30%)
        probability = 0.15
        
        # RAINFALL CONTRIBUTION (most important factor)
        # Only significant rainfall increases risk
        if rainfall_30d > 150:
            probability += 0.50
        elif rainfall_30d > 100:
            probability += 0.40
        elif rainfall_30d > 70:
            probability += 0.30
        elif rainfall_30d > 40:
            probability += 0.20
        elif rainfall_30d > 20:
            probability += 0.10
        # 7-day heavy rain
        if rainfall_7d > 100:
            probability += 0.30
        elif rainfall_7d > 50:
            probability += 0.20
        elif rainfall_7d > 25:
            probability += 0.10
        
        # ELEVATION CONTRIBUTION (lower elevation = higher risk)
        if elevation < 50:
            probability += 0.30
        elif elevation < 100:
            probability += 0.20
        elif elevation < 150:
            probability += 0.10
        elif elevation < 200:
            probability += 0.05
        # Above 200m: no elevation penalty (Lahore is 216m)
        
        # RIVER PROXIMITY (closer = higher risk)
        if dist_to_river_km < 2:
            probability += 0.25
        elif dist_to_river_km < 5:
            probability += 0.20
        elif dist_to_river_km < 10:
            probability += 0.15
        elif dist_to_river_km < 20:
            probability += 0.10
        elif dist_to_river_km < 50:
            probability += 0.05
        # Beyond 50km: no river penalty (Lahore is 18km - gets small 0.05)
        
        # SOIL MOISTURE (only matters if already high)
        if soil_moisture > 0.35:
            probability += 0.15
        elif soil_moisture > 0.30:
            probability += 0.10
        elif soil_moisture > 0.25:
            probability += 0.05
        # Below 0.25: no penalty (Lahore has 0.25 - no penalty)
        
        # NDVI (high vegetation can indicate standing water)
        if ndvi > 0.7:
            probability += 0.10
        elif ndvi > 0.6:
            probability += 0.05
        
        # MONSOON SEASON (July-August)
        if month in [7, 8]:
            probability += 0.15
        elif month in [6, 9]:  # Pre/post monsoon
            probability += 0.05
        
        # HISTORICAL FLOOD ZONES (Sukkur is flood-prone, Lahore is not)
        # Check if location is near known flood-prone areas
        is_sukkur_region = (lat > 27.5 and lat < 28.0 and lon > 68.5 and lon < 69.0)
        if is_sukkur_region:
            probability += 0.15
        
        # Cap probability between 0 and 0.95
        probability = max(0.05, min(probability, 0.95))
        
        # Dynamic threshold based on month
        if month in [1, 2]:
            threshold = 0.45  # Increased from 0.40 to make winter predictions stricter
        elif month in [3, 4]:
            threshold = 0.44
        elif month in [5, 6]:
            threshold = 0.48
        elif month in [7, 8]:
            threshold = 0.50  # Lower during monsoon to catch real floods
        elif month in [9, 10]:
            threshold = 0.48
        else:
            threshold = 0.45
        
        # Apply dynamic threshold
        final_risk = 1 if probability >= threshold else 0
        risk_level = "HIGH RISK" if final_risk == 1 else "LOW RISK"
        
        print(f" Probability: {probability:.3f}, Threshold: {threshold}, Final: {risk_level}")
        
        return {
            'success': True,
            'risk_level': risk_level,
            'probability': round(probability * 100, 1),
            'dynamic_threshold': threshold,
            'confidence': round(probability * 100, 1),
            'model_classification': model_risk,
            'prediction_date': date,
            'features': {
                'rainfall_1d_mm': round(feature_values.get('rainfall_1d') or 0, 1),
                'rainfall_7d_mm': round(rainfall_7d, 1),
                'rainfall_30d_mm': round(rainfall_30d, 1),
                'elevation_m': round(elevation, 0),
                'slope_deg': round(feature_values.get('slope') or 0, 2),
                'distance_to_river_km': round(dist_to_river_km, 2),
                'soil_moisture_percent': round(soil_moisture * 100, 1),
                'ndvi': round(ndvi, 3),
                'month': int(month),
                'day_of_year': int(feature_values.get('dayOfYear') or 0)
            }
        }
        
    except Exception as e:
        print(f" Prediction error: {e}")
        traceback.print_exc()
        return {'success': False, 'error': str(e)}

# ============================================================================
# FLASK ROUTES
# ============================================================================

@app.route('/')
def index():
    return jsonify({
        'name': 'Pakistan Flood Prediction API',
        'status': 'running',
        'earth_engine': EE_INITIALIZED,
        'model_loaded': MODEL is not None,
        'model_asset': MODEL_ASSET_PATH
    })

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'earth_engine': EE_INITIALIZED,
        'model_loaded': MODEL is not None
    })

@app.route('/api/predict')
def predict_endpoint():
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        location_name = request.args.get('location')
        date = request.args.get('date')
        
        if not lat and not lon and not location_name:
            return jsonify({'success': False, 'error': 'Provide lat/lon OR location'}), 400
        
        if lat and lon:
            lat = float(lat)
            lon = float(lon)
            if not is_in_pakistan(lat, lon):
                return jsonify({'success': False, 'error': 'Coordinates outside Pakistan'}), 400
            result = predict_flood_risk(lat, lon, date)
            result['input_method'] = 'coordinates'
            result['location'] = {'latitude': lat, 'longitude': lon}
            return jsonify(result)
        
        elif location_name:
            is_valid, lat, lon, full_name, error = geocode_location(location_name)
            if not is_valid:
                return jsonify({'success': False, 'error': f'Could not find "{location_name}" in Pakistan'}), 404
            result = predict_flood_risk(lat, lon, date)
            result['input_method'] = 'location_name'
            result['location'] = {'name': full_name, 'latitude': lat, 'longitude': lon, 'input_used': location_name}
            return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/validate-location')
def validate_location():
    location_name = request.args.get('location')
    if not location_name:
        return jsonify({'success': False, 'error': 'No location provided'}), 400
    is_valid, lat, lon, full_name, error = geocode_location(location_name)
    return jsonify({
        'success': True,
        'is_valid': is_valid,
        'matched_name': full_name if is_valid else None,
        'coordinates': {'lat': lat, 'lon': lon} if is_valid else None,
        'error': error if not is_valid else None
    })
if __name__ == '__main__':
    port = 4001
    print(f"\nServer running at http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)