const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'requests.log');

const customLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;

    res.on('finish', () => {
        const statusCode = res.statusCode;
        const logEntry = `[${timestamp}] ${method} ${url} - Status: ${statusCode}\n`;

       
        fs.appendFile(logFilePath, logEntry, (err) => {
            if (err) {
                // log is appended in the file
                
            }
        });
    });

    next(); 
};

module.exports = customLogger;