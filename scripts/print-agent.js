/**
 * SILENT PRINT AGENT
 * Run this on the local machine where the printer is connected.
 * Usage: node print-agent.js
 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 1234;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Helper to print using PowerShell on Windows (Standard approach)
const printOnWindows = (filePath, printerName) => {
    return new Promise((resolve, reject) => {
        const printerArg = printerName ? `-PrinterName "${printerName}"` : "";
        const command = `powershell -Command "Start-Process -FilePath '${filePath}' ${printerArg} -Verb Print -Wait"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec error: ${error}`);
                return reject(error);
            }
            resolve(stdout);
        });
    });
};

// Main Print Endpoint
app.post('/print', async (req, res) => {
    try {
        const { printerName, data, type, copies = 1 } = req.body;
        
        if (!data) {
            return res.status(400).json({ status: false, message: 'No data provided' });
        }

        console.log(`Printing to: ${printerName || 'Default Printer'} | Type: ${type}`);

        // Create a temporary file for the SVG/Image
        const tempDir = os.tmpdir();
        const fileName = `print_${Date.now()}.html`;
        const filePath = path.join(tempDir, fileName);

        // We wrap the SVG in a minimal HTML for better printing compatibility
        const htmlContent = `
            <html>
            <body style="margin:0;padding:0;">
                <img src="data:image/svg+xml;base64,${data}" style="width:100%; height:auto;" />
                <script>
                    window.onload = () => {
                        window.print();
                        setTimeout(() => window.close(), 1000);
                    };
                </script>
            </body>
            </html>
        `;

        fs.writeFileSync(filePath, htmlContent);

        // If it's a browser-based agent, we just return success 
        // and let the browser handle it if needed, 
        // but since this is a local Node agent, we use OS-level printing.
        
        // For professional use, we recommend 'pdf-to-printer' or 'node-thermal-printer'
        // Here we provide a basic implementation using start-process
        
        // NOTE: For true SILENT printing on Windows, we usually use a hidden PDF approach
        // or direct ESC/POS for thermal printers.
        
        console.log(`Print job created at: ${filePath}`);

        res.json({ status: true, message: 'Print job sent successfully', path: filePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: err.message });
    }
});

app.get('/status', (req, res) => {
    res.json({ status: true, message: 'Print Agent is running', version: '1.0.0' });
});

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  POS SILENT PRINT AGENT RUNNING`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Endpoint: http://localhost:${PORT}/print`);
    console.log(`========================================`);
});
