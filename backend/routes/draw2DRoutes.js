const express = require('express');
const router = express.Router();
const draw2DLauncher = require('../services/draw2DLauncher');

// Launch Draw2D module
router.post('/launch', async (req, res) => {
    try {
        console.log('📡 Received request to launch Draw2D module');
        
        const status = await draw2DLauncher.getDetailedStatus();
        
        if (status.running) {
            return res.json({
                success: true,
                url: `http://localhost:${draw2DLauncher.modulePort}`,
                port: draw2DLauncher.modulePort,
                message: 'Draw2D module is already running',
                status: 'running'
            });
        }
        
        if (status.starting) {
            return res.json({
                success: true,
                url: null,
                port: draw2DLauncher.modulePort,
                message: `Draw2D module is still starting (${status.elapsedTime}s elapsed)`,
                status: 'starting',
                elapsedTime: status.elapsedTime
            });
        }
        
        // Start the module
        console.log('🎨 Starting Draw2D module...');
        draw2DLauncher.startModule().catch(console.error);
        
        res.json({
            success: true,
            url: null,
            port: draw2DLauncher.modulePort,
            message: 'Draw2D module is starting. A new tab will open when ready.',
            status: 'starting'
        });
        
    } catch (error) {
        console.error('❌ Failed to start Draw2D module:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            port: 3002
        });
    }
});

// Check Draw2D status
router.get('/status', async (req, res) => {
    try {
        const status = await draw2DLauncher.getDetailedStatus();
        res.json({
            success: true,
            ...status
        });
    } catch (error) {
        res.json({ 
            success: false, 
            running: false,
            error: error.message 
        });
    }
});

// Stop Draw2D module
router.post('/stop', async (req, res) => {
    try {
        draw2DLauncher.stopModule();
        res.json({
            success: true,
            message: 'Draw2D module stopped'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;