// src/hooks/useDraw2DLaunch.js
import { useState, useRef } from 'react';
import axios from 'axios';

export const useDraw2DLaunch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const hasNavigated = useRef(false);
  const intervalRef = useRef(null);

  const launchDraw2D = async () => {
    setLoading(true);
    setError(null);
    hasNavigated.current = false;
    
    try {
      console.log('🎨 Launching Draw2D module...');
      
      const response = await axios.post('http://localhost:5000/api/draw2d/launch');

      if (response.data.success) {
        console.log('✅ Draw2D module launched:', response.data);
        
        // Get user data from localStorage
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        // Encode user data to pass via URL
        const userParam = storedUser ? encodeURIComponent(storedUser) : '';
        const tokenParam = storedToken || '';
        
        const port = response.data.port || 3002;
        const draw2dUrl = `http://localhost:${port}?user=${userParam}&token=${tokenParam}`;
        
        if (response.data.status === 'running') {
          // Already running - open in SAME TAB
          if (!hasNavigated.current) {
            hasNavigated.current = true;
            window.location.href = draw2dUrl; // Opens in same tab
            // No need to setLoading(false) as page will navigate away
          }
          
        } else if (response.data.status === 'starting') {
          alert(`🎨 Draw2D module is starting on port ${port}. This may take 30-60 seconds. You will be redirected automatically when ready.`);
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          intervalRef.current = setInterval(async () => {
            try {
              const statusResponse = await axios.get('http://localhost:5000/api/draw2d/status');
              setStatus(statusResponse.data);
              
              if (statusResponse.data.running && !hasNavigated.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                hasNavigated.current = true;
                window.location.href = draw2dUrl; // Opens in same tab
                // No need to setLoading(false) as page will navigate away
              }
            } catch (error) {
              console.log('⏳ Still waiting for Draw2D module...');
            }
          }, 3000);
          
          setStatus(response.data);
        }
      }
    } catch (error) {
      console.error('❌ Error launching Draw2D module:', error);
      setError(error.message);
      alert(`❌ Error launching Draw2D module. Try manually opening: http://localhost:3002`);
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/draw2d/status');
      setStatus(response.data);
      return response.data;
    } catch (error) {
      console.log('⚠️ Could not check Draw2D status');
      return null;
    }
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return { launchDraw2D, checkStatus, cleanup, loading, error, status };
};