// src/hooks/useVRLaunch.js
import { useState, useRef } from 'react';
import axios from 'axios';

export const useVRLaunch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasNavigated = useRef(false);

  const launchVR = async () => {
    setLoading(true);
    setError(null);
    hasNavigated.current = false;
    
    try {
      console.log('Launching VR Training module...');
      
      const response = await axios.post('http://localhost:5000/api/module/launch-vr-module');
      
      if (response.data.success) {
        console.log('VR module launched:', response.data);
        
        // Get user data from localStorage
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
                
        // Encode user data to pass via URL
        const userParam = storedUser ? encodeURIComponent(storedUser) : '';
        const tokenParam = storedToken || '';
        
        const frontendPort = response.data.frontendPort || 3001;
        const vrUrl = `http://localhost:${frontendPort}?user=${userParam}&token=${tokenParam}`;
        
        if (response.data.status === 'running') {
          // Already running - open in SAME TAB
          if (!hasNavigated.current) {
            hasNavigated.current = true;
            window.location.href = vrUrl; // Opens in same tab
            // No need to setLoading(false) as page will navigate away
          }
          
        } else if (response.data.status === 'starting') {
          alert(`VR module is starting on port ${frontendPort}. This may take 30-60 seconds. You will be redirected automatically when ready.`);
          
          const interval = setInterval(async () => {
            try {
              const statusResponse = await axios.get('http://localhost:5000/api/module/module-status');
              
              if (statusResponse.data.running && !hasNavigated.current) {
                clearInterval(interval);
                hasNavigated.current = true;
                window.location.href = vrUrl; // Opens in same tab
                // No need to setLoading(false) as page will navigate away
              }
            } catch (error) {
              console.log('Still waiting for module...');
            }
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error launching VR module:', error);
      setError(error.message);
      alert(`Error launching VR module. Try manually opening: http://localhost:3001`);
      setLoading(false);
    }
  };

  return { launchVR, loading, error };
};