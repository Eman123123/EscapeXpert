const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

class Draw2DLauncher {
    constructor() {
        this.moduleProcess = null;
        this.modulePort = 3002; 
        this.modulePath = path.join(__dirname, '../../DRAW2D');
        this.startTime = null;
        this.maxAttempts = 60; 
    }

    async isModuleRunning() {
        try {
            const response = await axios.get(`http://localhost:${this.modulePort}`, {
                timeout: 5000,
                validateStatus: false
            });
            // Any response means it's running
            return response.status >= 200 && response.status < 500;
        } catch (error) {
            return false;
        }
    }

    validatePaths() {
        const packagePath = path.join(this.modulePath, 'package.json');
        const viteConfigPath = path.join(this.modulePath, 'vite.config.js');
        
        console.log('🔍 Validating Draw2D module paths:');
        console.log(`   Module path: ${this.modulePath}`);
        console.log(`   Package.json: ${packagePath}`);
        
        if (!fs.existsSync(this.modulePath)) {
            throw new Error(`Draw2D module path does not exist: ${this.modulePath}`);
        }
        
        if (!fs.existsSync(packagePath)) {
            throw new Error(`Draw2D package.json not found at: ${packagePath}`);
        }
        
        console.log('✅ Draw2D path validation passed');
        return true;
    }

    async startModule() {
        return new Promise((resolve, reject) => {
            console.log('🎨 Starting Draw2D module...');
            this.startTime = Date.now();
            
            try {
                this.validatePaths();
            } catch (error) {
                console.error('❌ Path validation failed:', error.message);
                reject(error);
                return;
            }
            
            // Check if node_modules exists
            const nodeModulesPath = path.join(this.modulePath, 'node_modules');
            let startCommand;
            
            if (!fs.existsSync(nodeModulesPath)) {
                console.log('📦 Installing Draw2D dependencies (this may take a few minutes)...');
                // Install dependencies then start
                startCommand = `start /min cmd /c "cd /d "${this.modulePath}" && npm install && npm run dev"`;
            } else {
                // Just start
                startCommand = `start /min cmd /c "cd /d "${this.modulePath}" && npm run dev"`;
            }
            
            console.log(`📝 Starting Draw2D: ${startCommand}`);
            this.moduleProcess = exec(startCommand, {
                windowsHide: false,
                shell: 'cmd.exe'
            });

            // Monitor process
            this.moduleProcess.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output && !output.includes('node_modules')) {
                    console.log(`📤 [Draw2D]: ${output}`);
                }
            });

            this.moduleProcess.stderr.on('data', (data) => {
                const error = data.toString().trim();
                if (error && !error.includes('node_modules')) {
                    console.log(`📥 [Draw2D Error]: ${error}`);
                }
            });

            // Wait for module to start
            let attempts = 0;
            const checkInterval = setInterval(async () => {
                const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
                
                try {
                    const running = await this.isModuleRunning();
                    
                    if (running) {
                        clearInterval(checkInterval);
                        console.log(`✅ Draw2D module ready after ${elapsedSeconds}s on port ${this.modulePort}`);
                        resolve();
                        return;
                    }
                    
                    if (attempts % 10 === 0) {
                        console.log(`⏳ Waiting for Draw2D... (${elapsedSeconds}s elapsed)`);
                    }
                    
                } catch (error) {
                    // Not ready yet
                }

                attempts++;
                if (attempts >= this.maxAttempts) {
                    clearInterval(checkInterval);
                    console.log(`⚠️ Draw2D module timeout, but may still be starting`);
                    // Resolve anyway - might be slow to start
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
            return `http://localhost:${this.modulePort}`;
        } catch (error) {
            console.error('❌ Failed to get Draw2D URL:', error);
            return `http://localhost:${this.modulePort}`;
        }
    }

    async getDetailedStatus() {
        const isRunning = await this.isModuleRunning();
        const elapsedSeconds = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
        
        return {
            running: isRunning,
            starting: this.startTime !== null && !isRunning,
            elapsedTime: elapsedSeconds,
            port: this.modulePort,
            url: isRunning ? `http://localhost:${this.modulePort}` : null
        };
    }

    stopModule() {
        if (this.moduleProcess) {
            this.moduleProcess.kill();
            console.log('🛑 Draw2D module stopped');
            this.moduleProcess = null;
            this.startTime = null;
        }
    }
}

module.exports = new Draw2DLauncher();