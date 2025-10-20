import { useState, useEffect, useRef } from 'react';
import './App.css';
import StockChart from './StockChart';
import Fundamentals from './Fundamentals';

function App() {
  // Twelve Data key for price call
  const API_KEY = import.meta.env.VITE_TWELVE_API_KEY;

  // UI / data state
  const [symbol, setSymbol] = useState('');
  const [price, setPrice] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // search list / dropdown
  const [results, setResults] = useState([]);
  const [stockList, setStockList] = useState([]);

  // selected stock info
  const [selectedName, setSelectedName] = useState('');
  const [confirmedSymbol, setConfirmedSymbol] = useState('');

  // chart + view
  const [interval, setInterval] = useState('1hour');
  const [view, setView] = useState('chart'); // 'chart' | 'fundamentals'

  // load list of stocks (FMP screener)
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch(
          `https://financialmodelingprep.com/api/v3/stock-screener?limit=5035&apikey=${import.meta.env.VITE_FMP_API_KEY}`
        );
        const data = await response.json();
        const filtered = data.filter(stock => stock.marketCap);
        const sorted = filtered.sort((a, b) => b.marketCap - a.marketCap);
        setStockList(sorted);
      } catch (error) {
        console.error('Failed to fetch stock list:', error);
      }
    };

    fetchStocks();
  }, []);

  // filter dropdown by ticker prefix (A..Z up to 5 chars; US main exchanges)
  const filterTickers = (query) => {
    if (!query) {
      setResults([]);
      return;
    }

    const supportedExchanges = ['NYSE', 'NASDAQ', 'AMEX'];

    const matches = stockList.filter(stock =>
      stock.symbol.toUpperCase().startsWith(query.toUpperCase()) &&
      /^[A-Z]{1,5}$/.test(stock.symbol) &&
      !stock.symbol.includes('.') &&
      supportedExchanges.includes(stock.exchangeShortName) &&
      !/fund|idx|mutual|retirement|class|growth|etn|index|admiral|preferred|strategic advisers|institutional|series|rate|%|coupon|trust/i.test(stock.companyName) &&
      !/R[0-9]$/i.test(stock.symbol)
    );

    setResults(matches.slice(0, 5));
  };

  // fetch current price from Twelve Data and set selected company name
  const fetchStockData = async (inputSymbol) => {
    const finalSymbol = inputSymbol || symbol;

    if (!finalSymbol) {
      setPrice(null);
      setSelectedName('');
      setConfirmedSymbol('');
      setError('Please enter a stock ticker symbol.');
      return;
    }

    const selected = stockList.find(s => s.symbol === finalSymbol);
    const company = selected ? selected.companyName : '';

    const url = `https://api.twelvedata.com/price?symbol=${finalSymbol}&apikey=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.price) {
        setConfirmedSymbol(finalSymbol);
        setSelectedName(company);
        setPrice(data.price);
        setError('');
        // keep current view; if you want to auto-switch to chart you can uncomment:
        // setView('chart');
        // trigger chart rerender by touching interval (optional)
        setInterval(prev => prev);
      } else {
        setConfirmedSymbol('');
        setSelectedName('');
        setPrice(null);
        setError('Stock not found.');
      }
    } catch (error) {
      console.error(error);
      setConfirmedSymbol('');
      setSelectedName('');
      setPrice(null);
      setError('Error fetching data');
    }
  };

  // market open/closed indicator (simple local time check)
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();

  let isMarketOpen = false;
  if (day > 0 && day < 6) {
    if ((hour > 9 || (hour === 9 && minute >= 30)) && hour < 16) {
      isMarketOpen = true;
    }
  }

  return (
    <>
      <div className="market-status">
        <span className={`status-dot ${isMarketOpen ? 'open' : 'closed'}`}></span>
        {isMarketOpen ? 'Market is open' : 'Market is closed'}
      </div>

      <div className="container">
        <h1 className="app-title">Finsight</h1>

        <div className="search-wrapper-box">
          <input
            ref={inputRef}
            placeholder="Enter stock symbol (e.g. AAPL)"
            value={symbol}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              setSymbol(value);
              filterTickers(value);
            }}
            maxLength={5}
            className="search-input-box"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                fetchStockData();
              }
            }}
          />

          {results.length > 0 && (
            <ul className="dropdown-list-box">
              {results.map((stock, idx) => (
                <li
                  key={idx}
                  onClick={() => {
                    setSymbol(stock.symbol);
                    setResults([]);
                    fetchStockData(stock.symbol);
                  }}
                  className="dropdown-item-box"
                >
                  <span className="symbol-bold">{stock.symbol}</span>
                  <span>{stock.companyName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="loaded-info"><em>Top 5000 stocks available</em></p>

        {price && confirmedSymbol && (
          <div className="price-card">
            <h2>{confirmedSymbol}</h2>
            <p>{selectedName}</p>
            <p>${parseFloat(price).toFixed(2)}</p>

            {/* view toggle */}
            <div style={{ display: 'flex', gap: 8, margin: '10px 0 12px' }}>
              <button
                onClick={() => setView('chart')}
                className={view === 'chart' ? 'btn-active' : 'btn'}
              >
                Chart
              </button>
              <button
                onClick={() => setView('fundamentals')}
                className={view === 'fundamentals' ? 'btn-active' : 'btn'}
              >
                Fundamentals
              </button>
            </div>

            {/* Range picker only for chart */}
            {view === 'chart' && (
              <div style={{ marginTop: '4px', marginBottom: '12px' }}>
                <label htmlFor="interval" style={{ marginRight: '10px' }}>Range:</label>
                <select
                  id="interval"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  style={{ padding: '6px' }}
                >
                  <option value="1min">1 Min</option>
                  <option value="5min">5 Min</option>
                  <option value="15min">15 Min</option>
                  <option value="30min">30 Min</option>
                  <option value="1hour">1 Hour</option>
                  <option value="4hour">4 Hour</option>
                  <option value="1day">1 Day</option>
                </select>
              </div>
            )}

            {/* content area */}
            {view === 'chart' && confirmedSymbol && interval && (
              <StockChart
                key={`${confirmedSymbol}-${interval}`}
                symbol={confirmedSymbol}
                interval={interval}
              />
            )}
            {view === 'fundamentals' && confirmedSymbol && (
              <Fundamentals symbol={confirmedSymbol} />
            )}
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}
      </div>

      <footer className="disclaimer-footer">
        Information provided is for educational purposes only and
        is not investment advice.
      </footer>
    </>
  );
}

export default App;
