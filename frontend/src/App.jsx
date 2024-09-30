import React, { useEffect, useState } from 'react';

const App = () => {
  const [selectedCoin, setSelectedCoin] = useState('BTCUSDT');
  const [selectedInterval, setSelectedInterval] = useState('1m');
  const [candlestickData, setCandlestickData] = useState([]);

  const coins = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'LTCUSDT'];
  const intervals = { '1m': '1', '3m': '3', '5m': '5' };

  useEffect(() => {
    // Check if data for this coin exists in local storage
    const savedData = localStorage.getItem(`${selectedCoin}-${selectedInterval}`);
    
    if (savedData) {
      setCandlestickData(JSON.parse(savedData)); // Use saved data if available
    } else {
      // Initialize WebSocket connection if no local storage data exists
      initializeWebSocket();
    }
  }, [selectedCoin, selectedInterval]);

  // Function to initialize WebSocket connection
  const initializeWebSocket = () => {
    const wsUrl = `wss://stream.binance.com:9443/ws/${selectedCoin.toLowerCase()}@kline_${selectedInterval}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const newCandlestick = JSON.parse(event.data).k; // Extract the kline data
      const candlestick = {
        time: newCandlestick.t, // Timestamp
        open: parseFloat(newCandlestick.o),
        high: parseFloat(newCandlestick.h),
        low: parseFloat(newCandlestick.l),
        close: parseFloat(newCandlestick.c),
        volume: parseFloat(newCandlestick.v),
      };

      setCandlestickData(prevData => {
        const updatedData = [...prevData, candlestick];
        localStorage.setItem(`${selectedCoin}-${selectedInterval}`, JSON.stringify(updatedData)); // Save to local storage
        return updatedData;
      });
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    return () => {
      ws.close();
    };
  };

  // Render TradingView widget using the stored or received data
  useEffect(() => {
    const loadWidget = () => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.id = 'tradingview-script'; // Add an ID for easy reference
      
      script.onload = () => {
        if (window.TradingView) {
          new window.TradingView.widget({
            symbol: `BINANCE:${selectedCoin}`,
            interval: intervals[selectedInterval], // Set the interval based on user selection
            theme: 'light',
            container_id: 'tradingview-chart',
            locale: 'en',
            autosize: true,
            datafeed: {
              // Use the local candlestick data to render the chart
              onReady: (callback) => callback({ supported_resolutions: ['1', '3', '5'] }),
              getBars: (symbolInfo, resolution, from, to, onHistoryCallback) => {
                const bars = candlestickData.map(candle => ({
                  time: candle.time,
                  open: candle.open,
                  high: candle.high,
                  low: candle.low,
                  close: candle.close,
                  volume: candle.volume,
                }));
                onHistoryCallback(bars, { noData: false });
              },
              subscribeBars: (symbolInfo, resolution, onRealtimeCallback) => {
                // Real-time data will be handled through WebSocket
              },
            },
          });
        }
      };

      document.getElementById('tradingview-container').appendChild(script);
    };

    loadWidget();
  }, [candlestickData, selectedCoin, selectedInterval]);

  return (
    <div style={{ width: '80%', margin: '50px auto' }} className='container'>
      <center><h2>Real-Time Trading Chart</h2></center>

      <div style={{ marginBottom: '20px' }} className='container'>
        <label style={{ marginRight: '10px' }}>Select Coin:</label>
        <select value={selectedCoin} onChange={(e) => setSelectedCoin(e.target.value)} className='form-select w-50 m-3'>
          {coins.map((coin, index) => (
            <option key={index} value={coin}>{coin}</option>
          ))}
        </select>

        <label style={{ marginLeft: '20px', marginRight: '10px' }}>Select Time Frame:</label>
        <select value={selectedInterval} onChange={(e) => setSelectedInterval(e.target.value)} className='form-select w-50 m-3'>
          {Object.keys(intervals).map((interval, index) => (
            <option key={index} value={interval}>{interval}</option>
          ))}
        </select>
      </div>

      <div id="tradingview-container">
        <div id="tradingview-chart" style={{ height: '500px' }}></div>
      </div>
    </div>
  );
};

export default App;
