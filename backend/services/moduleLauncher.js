const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

class ModuleLauncher {
    constructor() {
        this.moduleProcess = null;
        this.frontendProcess = null;
        this.modulePort = 5001;
        this.frontendPort = 3001; // Default React port
        this.modulePath = path.join(__dirname, '../../FYP/backend');
        this.frontendPath = path.join(__dirname, '../../FYP/frontend');
        this.startTime = null;
        this.maxAttempts = 120; // 120 seconds timeout
    }

    async isModuleRunning() {
        try {
            const response = await axios.get(`http://localhost:${this.modulePort}/api/health`, {
                timeout: 5000
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async isFrontendRunning() {
        // Try common React ports - prioritize 3001 since we configured it
        const portsToTry = [3001, 3002, 3003, 3000];
        for (const port of portsToTry) {
            try {
                const response = await axios.get(`http://localhost:${port}`, { 
                    timeout: 2000,
                    validateStatus: false // Accept any status
                });
                // If we get any response (even 404), the server is running
                this.frontendPort = port;
                console.log(`✅ Frontend detected on port ${port}`);
                return true;
            } catch (error) {
                // Try next port
                console.log(`⏳ Port ${port} not responding`);
            }
        }
        return false;
    }

    isModuleStarting() {
        if (!this.moduleProcess) return false;
        try {
            return this.moduleProcess.exitCode === null;
        } catch (error) {
            return false;
        }
    }

    validatePaths() {
        const venvPath = path.join(this.modulePath, 'venv', 'Scripts', 'activate');
        const pythonPath = path.join(this.modulePath, 'application.py');
        const frontendPackagePath = path.join(this.frontendPath, 'package.json');
        
        console.log('🔍 Validating paths:');
        console.log(`   Module path: ${this.modulePath}`);
        console.log(`   Venv activate: ${venvPath}`);
        console.log(`   Python file: ${pythonPath}`);
        console.log(`   Frontend path: ${this.frontendPath}`);
        
        if (!fs.existsSync(this.modulePath)) {
            throw new Error(`Module path does not exist: ${this.modulePath}`);
        }
        
        if (!fs.existsSync(venvPath)) {
            throw new Error(`Virtual environment not found at: ${venvPath}`);
        }
        
        if (!fs.existsSync(pythonPath)) {
            throw new Error(`Python application not found at: ${pythonPath}`);
        }
        
        // Check if frontend exists (optional)
        if (fs.existsSync(frontendPackagePath)) {
            console.log('✅ Frontend package.json found');
            
            // Read package.json to check if PORT is set
            try {
                const packageJson = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
                if (packageJson.scripts && packageJson.scripts.start) {
                    console.log(`📝 Frontend start script: ${packageJson.scripts.start}`);
                    if (packageJson.scripts.start.includes('PORT=3001')) {
                        console.log('✅ Frontend configured to use port 3001');
                    }
                }
            } catch (e) {
                console.log('⚠️ Could not read package.json');
            }
        } else {
            console.log('⚠️ Frontend not found, will only start backend');
        }
        
        console.log('✅ Path validation passed');
        return true;
    }

    async startModule() {
        return new Promise((resolve, reject) => {
            console.log('🚀 Starting VR module (backend + frontend)...');
            this.startTime = Date.now();
            
            try {
                this.validatePaths();
            } catch (error) {
                console.error('❌ Path validation failed:', error.message);
                reject(error);
                return;
            }
            
            // Start Python backend in a new window (minimized)
            const backendCommand = `start /min cmd /c "cd /d "${this.modulePath}" && .\\venv\\Scripts\\activate && python application.py"`;
            console.log(`📝 Starting backend: ${backendCommand}`);
            exec(backendCommand);
            
            // Check if frontend exists and start it
            const frontendPackagePath = path.join(this.frontendPath, 'package.json');
            if (fs.existsSync(frontendPackagePath)) {
                console.log('📝 Starting frontend in new window...');
                
                // Check if node_modules exists, if not run npm install first
                const nodeModulesPath = path.join(this.frontendPath, 'node_modules');
                if (!fs.existsSync(nodeModulesPath)) {
                    console.log('📦 Installing frontend dependencies (this may take a few minutes)...');
                    const installCommand = `start /min cmd /c "cd /d "${this.frontendPath}" && npm install"`;
                    exec(installCommand);
                    
                    // Wait a bit for install to start
                    setTimeout(() => {
                        console.log('🚀 Starting frontend after npm install...');
                        const frontendCommand = `start /min cmd /c "cd /d "${this.frontendPath}" && npm start"`;
                        exec(frontendCommand);
                    }, 10000); // Give npm install 10 seconds to start
                } else {
                    const frontendCommand = `start /min cmd /c "cd /d "${this.frontendPath}" && npm start"`;
                    exec(frontendCommand);
                }
            }

            // Wait for backend to be ready
            let attempts = 0;
            let backendReady = false;
            
            const checkInterval = setInterval(async () => {
                const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
                
                try {
                    // Check if backend is running
                    if (!backendReady) {
                        const running = await this.isModuleRunning();
                        if (running) {
                            backendReady = true;
                            console.log(`✅ Backend ready after ${elapsedSeconds} seconds on port ${this.modulePort}`);
                        }
                    }
                    
                    // Once backend is ready, check for frontend
                    if (backendReady) {
                        const frontendRunning = await this.isFrontendRunning();
                        
                        if (frontendRunning) {
                            clearInterval(checkInterval);
                            console.log(`✅ VR Module fully ready after ${elapsedSeconds} seconds!`);
                            console.log(`   Backend: http://localhost:${this.modulePort}`);
                            console.log(`   Frontend: http://localhost:${this.frontendPort}`);
                            resolve();
                            return;
                        } else if (elapsedSeconds > 45) {
                            // If frontend not ready after 45 seconds, just return backend URL
                            clearInterval(checkInterval);
                            console.log(`⚠️ Frontend not detected after ${elapsedSeconds}s, using backend URL`);
                            console.log(`   You can manually access frontend at http://localhost:3001 once it starts`);
                            resolve();
                            return;
                        }
                    }
                    
                    // Show progress every 10 seconds
                    if (attempts % 10 === 0) {
                        console.log(`⏳ Waiting for VR module... (${elapsedSeconds}s elapsed)`);
                        if (!backendReady) {
                            console.log(`   Waiting for backend on port ${this.modulePort}...`);
                        } else {
                            console.log(`   Waiting for frontend on port 3001...`);
                        }
                    }
                    
                } catch (error) {
                    // Module not ready yet
                }

                attempts++;
                if (attempts >= this.maxAttempts) {
                    clearInterval(checkInterval);
                    console.log(`⚠️ Module startup timeout after ${this.maxAttempts} seconds`);
                    console.log(`   Try accessing manually:`);
                    console.log(`   - Backend: http://localhost:${this.modulePort}`);
                    console.log(`   - Frontend: http://localhost:3001`);
                    // Resolve instead of reject so the app doesn't crash
                    resolve();
                }
            }, 1000);
        });
    }

    async getModuleUrl() {
        try {
            const isRunning = await this.isModuleRunning();
            
            if (!isRunning) {
                await this.startModule();
            }
            
            // Check if frontend is running
            const frontendRunning = await this.isFrontendRunning();
            
            if (frontendRunning) {
                console.log(`✅ Returning frontend URL: http://localhost:${this.frontendPort}`);
                return `http://localhost:${this.frontendPort}`;
            } else {
                console.log(`✅ Returning backend URL: http://localhost:${this.modulePort}`);
                return `http://localhost:${this.modulePort}`;
            }
            
        } catch (error) {
            console.error('❌ Failed to get module URL:', error);
            // Return default URL instead of throwing
            return `http://localhost:3001`;
        }
    }

    async getDetailedStatus() {
        const backendRunning = await this.isModuleRunning();
        const frontendRunning = await this.isFrontendRunning();
        const isStarting = this.isModuleStarting();
        const elapsedSeconds = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
        
        // Always return ports, even if not running
        const backendPort = this.modulePort;
        const frontendPort = this.frontendPort;
        
        let url = null;
        if (backendRunning) {
            url = frontendRunning ? `http://localhost:${frontendPort}` : `http://localhost:${backendPort}`;
        }
        
        return {
            success: true,
            running: backendRunning,
            backendRunning: backendRunning,
            frontendRunning: frontendRunning,
            starting: isStarting,
            elapsedTime: elapsedSeconds,
            backendPort: backendPort,
            frontendPort: frontendPort,
            url: url,
            message: backendRunning ? 
                (frontendRunning ? 'Fully running' : 'Backend only') : 
                (isStarting ? 'Starting...' : 'Not running')
        };
    }

    stopModule() {
        if (this.moduleProcess) {
            this.moduleProcess.kill();
        }
        if (this.frontendProcess) {
            this.frontendProcess.kill();
        }
        console.log('🛑 Module stopped');
        this.moduleProcess = null;
        this.frontendProcess = null;
        this.startTime = null;
    }
}

module.exports = new ModuleLauncher();