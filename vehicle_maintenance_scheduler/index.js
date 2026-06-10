const express = require('express');
const axios = require('axios');
require('dotenv').config();
const customLogger = require('../logging_middleware/index');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(customLogger);
app.use(express.json());


function optimizeDepot(mechanicHours, vehicles) {
    const n = vehicles.length;
    
    // 2d dp array
    const memo = Array(n).fill(null).map(() => Array(mechanicHours + 1).fill(-1));

    // recursion 
    function solve(idx, lefthr) {
        // Base case
        if (idx >= n || lefthr <= 0) return 0;

        
        if (memo[idx][lefthr] !== -1) {
            return memo[idx][lefthr];
        }

        const currentVehicle = vehicles[idx];
        const cost = currentVehicle.Duration;
        const value = currentVehicle.Impact;

        // Skip this vehicle
        let maxScore = solve(idx + 1, lefthr);

        // Include this vehicle
        if (cost <= lefthr) {
            const includeScore = value + solve(idx + 1, lefthr - cost);
            maxScore = Math.max(maxScore, includeScore);
        }

        return memo[idx][lefthr] = maxScore;
    }

   
    const totalImpact = solve(0, mechanicHours);

    // Backtrack 
    const allocatedVehicles = [];
    let remainingTime = mechanicHours;

    for (let i = 0; i < n; i++) {
        if (remainingTime <= 0) break;

        const currentVehicle = vehicles[i];
        const cost = currentVehicle.Duration;

        const scoreIfSkipped = (i + 1 < n) ? solve(i + 1, remainingTime) : 0;

       
        if (memo[i][remainingTime] !== scoreIfSkipped) {
            allocatedVehicles.push(currentVehicle.TaskID);
            remainingTime -= cost; 
        }
    }

    return {
        allocatedVehicles,
        totalDuration: mechanicHours - remainingTime,
        totalImpact: totalImpact
    };
}

// Endpoint
app.get('/optimize-schedule', async (req, res, next) => {
    try {
        const token = process.env.TOKEN;
        if (!token) {
            return res.status(500).json({ error: "Authorization token is missing in .env config" });
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch datasets from APIs 
        const [depotsResponse, vehiclesResponse] = await Promise.all([
            axios.get('http://4.224.186.213/evaluation-service/depots', { headers }),
            axios.get('http://4.224.186.213/evaluation-service/vehicles', { headers })
        ]);

        const depots = depotsResponse.data;
        const vehicles = vehiclesResponse.data;

       
        const results = depots.map(depot => {
            const optimization = optimizeDepot(depot.mechanicHours, vehicles);
            return {
                depotId: depot.depotId,
                name: depot.name,
                allocatedVehicles: optimization.allocatedVehicles,
                totalDuration: optimization.totalDuration,
                totalImpact: optimization.totalImpact
            };
        });

        return res.json(results);

    } catch (error) {
        next(error);
    }
});

// error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.response ? err.response.status : 500;
    const message = err.response && err.response.data ? err.response.data : err.message;
    res.status(statusCode).json({
        success: false,
        error: "Failed to optimize schedules",
        details: message
    });
});

app.listen(PORT, () => {
});