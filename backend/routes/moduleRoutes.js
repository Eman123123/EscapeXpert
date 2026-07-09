const express = require('express');
const router = express.Router();
const moduleLauncher = require('../services/moduleLauncher');

// Endpoint to launch and get module URL
router.post('/launch-vr-module', async (req, res) => {
    try {
        console.log('📡 Received request to launch VR module');
        
        // Get detailed status first
        const status = await moduleLauncher.getDetailedStatus();
        
        // Always use these ports as defaults
        const defaultBackendPort = 5001;
        const defaultFrontendPort = 3001;
        
        if (status.running) {
            // Module already running
            console.log('✅ VR module already running at:', status.url);
            return res.json({
                success: true,
                url: status.url || `http://localhost:${defaultFrontendPort}`,
                backendPort: status.backendPort || defaultBackendPort,
                frontendPort: status.frontendPort || defaultFrontendPort,
                message: 'VR module is already running',
                status: 'running',
                timestamp: new Date().toISOString()
            });
        }
        
        if (status.starting) {
            // Module is starting
            console.log(`⏳ VR module is still starting (${status.elapsedTime}s elapsed)`);
            return res.json({
                success: true,
                url: null,
                backendPort: status.backendPort || defaultBackendPort,
                frontendPort: status.frontendPort || defaultFrontendPort,
                message: `VR module is still starting (${status.elapsedTime}s elapsed). Please wait...`,
                status: 'starting',
                elapsedTime: status.elapsedTime,
                timestamp: new Date().toISOString()
            });
        }
        
        // Module not running - start it
        console.log('🚀 Starting VR module (this may take 30-60 seconds)...');
        
        // Start the module in background (don't await)
        moduleLauncher.startModule().then(() => {
            console.log('✅ VR module background start completed');
        }).catch(error => {
            console.error('❌ Background start failed:', error);
        });
        
        // Return immediate response with default ports
        res.json({
            success: true,
            url: null,
            backendPort: defaultBackendPort,
            frontendPort: defaultFrontendPort,
            message: 'VR module is starting. This may take 30-60 seconds. A new tab will open automatically when ready.',
            status: 'starting',
            estimatedTime: '30-60 seconds',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Failed to start VR module:', error);
        
        // Even on error, return port information
        res.status(500).json({
            success: false,
            error: error.message,
            backendPort: 5001,
            frontendPort: 3001,
            message: 'Failed to start VR module. You can try accessing manually:',
            manualUrls: {
                frontend: 'http://localhost:3001',
                backend: 'http://localhost:5001'
            },
            timestamp: new Date().toISOString()
        });
    }
});

// Add this new endpoint for auto-start after login
router.post('/auto-start-vr', async (req, res) => {
  try {
    console.log('🤖 Auto-starting VR module after user login...');
    
    // Check if already running
    const status = await moduleLauncher.getDetailedStatus();
    
    if (status.running) {
      console.log('✅ VR module already running');
      return res.json({ 
        success: true, 
        message: 'VR module already running',
        status: 'running'
      });
    }
    
    if (status.starting) {
      console.log('⏳ VR module already starting');
      return res.json({ 
        success: true, 
        message: 'VR module already starting',
        status: 'starting'
      });
    }
    
    // Start the module in background (don't await)
    console.log('Initiating VR module background start...');
    moduleLauncher.startModule().then(() => {
      console.log('✅ VR module background start completed');
    }).catch(error => {
      console.error('VR module background start failed:', error);
    });
    
    // Return immediately
    res.json({ 
      success: true, 
      message: 'VR module starting in background',
      status: 'starting'
    });
    
  } catch (error) {
    console.error('❌ Auto-start error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// Check detailed module status
router.get('/module-status', async (req, res) => {
    try {
        const status = await moduleLauncher.getDetailedStatus();
        
        // Ensure ports are always included
        const response = {
            success: true,
            running: status.running || false,
            backendRunning: status.backendRunning || false,
            frontendRunning: status.frontendRunning || false,
            starting: status.starting || false,
            elapsedTime: status.elapsedTime || 0,
            backendPort: status.backendPort || 5001,
            frontendPort: status.frontendPort || 3001,
            url: status.url,
            message: status.message || (status.running ? 'Module is running' : 'Module is not running'),
            timestamp: new Date().toISOString()
        };
        
        // Add URL if running
        if (status.running) {
            response.url = status.url || (status.frontendRunning ? 
                `http://localhost:${response.frontendPort}` : 
                `http://localhost:${response.backendPort}`);
        }
        
        res.json(response);
        
    } catch (error) {
        console.error('Status check error:', error);
        res.json({ 
            success: false, 
            running: false,
            backendPort: 5001,
            frontendPort: 3001,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Simple health check (faster than detailed status)
router.get('/health', async (req, res) => {
    try {
        const isRunning = await moduleLauncher.isModuleRunning();
        res.json({
            success: true,
            running: isRunning,
            backendPort: 5001,
            frontendPort: 3001,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({ 
            success: false, 
            running: false,
            backendPort: 5001,
            frontendPort: 3001
        });
    }
});

// Check frontend status specifically
router.get('/frontend-status', async (req, res) => {
    try {
        const frontendRunning = await moduleLauncher.isFrontendRunning();
        const frontendPort = moduleLauncher.frontendPort || 3001;
        
        res.json({
            success: true,
            running: frontendRunning,
            port: frontendPort,
            url: frontendRunning ? `http://localhost:${frontendPort}` : null,
            message: frontendRunning ? 'Frontend is running' : 'Frontend is not running',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({ 
            success: false, 
            running: false,
            port: 3001,
            error: error.message
        });
    }
});

// Check backend status specifically
router.get('/backend-status', async (req, res) => {
    try {
        const backendRunning = await moduleLauncher.isModuleRunning();
        const backendPort = moduleLauncher.modulePort || 5001;
        
        res.json({
            success: true,
            running: backendRunning,
            port: backendPort,
            url: backendRunning ? `http://localhost:${backendPort}` : null,
            message: backendRunning ? 'Backend is running' : 'Backend is not running',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({ 
            success: false, 
            running: false,
            port: 5001,
            error: error.message
        });
    }
});

// Force restart module
router.post('/restart-module', async (req, res) => {
    try {
        console.log('🔄 Restarting VR module...');
        
        // Stop if running
        moduleLauncher.stopModule();
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Start again
        moduleLauncher.startModule().catch(error => {
            console.error('Restart failed:', error);
        });
        
        res.json({
            success: true,
            message: 'VR module is restarting. Please wait...',
            backendPort: 5001,
            frontendPort: 3001,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Failed to restart VR module:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            backendPort: 5001,
            frontendPort: 3001
        });
    }
});

// Stop module
router.post('/stop-module', async (req, res) => {
    try {
        moduleLauncher.stopModule();
        res.json({
            success: true,
            message: 'Module stopped successfully',
            backendPort: 5001,
            frontendPort: 3001,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get module configuration
router.get('/config', async (req, res) => {
    try {
        res.json({
            success: true,
            config: {
                backendPath: moduleLauncher.modulePath,
                frontendPath: moduleLauncher.frontendPath,
                backendPort: moduleLauncher.modulePort || 5001,
                frontendPort: moduleLauncher.frontendPort || 3001,
                maxAttempts: moduleLauncher.maxAttempts || 120
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get recommended URLs
router.get('/urls', async (req, res) => {
    try {
        const status = await moduleLauncher.getDetailedStatus();
        
        res.json({
            success: true,
            urls: {
                frontend: 'http://localhost:3001',
                backend: 'http://localhost:5001',
                api: 'http://localhost:5001/api',
                health: 'http://localhost:5001/api/health'
            },
            running: {
                backend: status.backendRunning || false,
                frontend: status.frontendRunning || false
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            success: true,
            urls: {
                frontend: 'http://localhost:3001',
                backend: 'http://localhost:5001',
                api: 'http://localhost:5001/api',
                health: 'http://localhost:5001/api/health'
            },
            running: {
                backend: false,
                frontend: false
            }
        });
    }
});

module.exports = router;