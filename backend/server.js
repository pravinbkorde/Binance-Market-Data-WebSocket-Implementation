const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use(cors());

// Route to fetch price data based on coin and interval
app.get('/api/prices', async (req, res) => {
  const { coin = 'BTCUSDT', interval = '1m' } = req.query; // Default to BTCUSDT and 1m
  
  try {
    // Fetching price data from Binance API for the selected coin and interval
    const response = await axios.get(`https://api.binance.com/api/v3/klines?symbol=${coin}&interval=${interval}`);
    
    // Processing response data into usable format
    const priceData = response.data.map(item => ({
      time: item[0],               // Unix timestamp in milliseconds
      open: parseFloat(item[1]),   // Open price
      high: parseFloat(item[2]),   // High price
      low: parseFloat(item[3]),    // Low price
      close: parseFloat(item[4]),  // Closing price
      volume: parseFloat(item[5]), // Volume
    }));
    
    res.json(priceData);
  } catch (error) {
    console.error('Error fetching price data:', error);
    res.status(500).json({ message: 'Failed to fetch price data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
