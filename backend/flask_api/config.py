# flask_api/config.py
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Earth Engine Configuration
    EE_ACCOUNT = os.getenv('EARTH_ENGINE_SERVICE_ACCOUNT', 'earthquake-prediction@earthquake-487805.iam.gserviceaccount.com')
    EE_KEY_PATH = os.path.join(os.path.dirname(__file__), 'ee-key.json')
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # API Configuration
    API_TITLE = 'Pakistan Earthquake Prediction API'
    API_VERSION = '1.0.0'
    
    # Earth Engine Assets (using your username)
    EE_ASSETS = {
        'hazard_map': 'users/ifrah/pakistan_hazard_score',
        'risk_map': 'users/ifrah/pakistan_earthquake_risk',
        'rf_probability': 'users/ifrah/pakistan_rf_probability',
        'faults': 'users/ifrah/pakistan_active_faults'
    }
    
    # Pakistan boundaries
    PAKISTAN_BOUNDS = {
        'lat_min': 23.0,
        'lat_max': 38.0,
        'lng_min': 60.0,
        'lng_max': 78.0
    }