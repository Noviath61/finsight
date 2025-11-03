import { useState, useEffect, useRef } from 'react';
import './App.css';
import StockChart from './StockChart';
import Fundamentals from './Fundamentals';
import Parse from 'parse';
import Login from './Login';
import Signup from './Signup'; 

function App() {
  // Twelve Data key for price call
  const API_KEY = import.meta.env.VITE_TWELVE_API_KEY;

  // UI / data state
  const [symbol, setSymbol] = useState('');
  const [price, setPrice] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const [quoteData, setQuoteData] = useState(null); // State for OHLCV data

  // Authentication state
  const [currentUser, setCurrentUser] = useState(Parse.User.current());
  const [authView, setAuthView] = useState('none'); // 'none', 'login', or 'signup'

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

  // fetch current price AND quote data
  const fetchStockData = async (inputSymbol) => {
    const finalSymbol = inputSymbol || symbol;
    setQuoteData(null); 
    if (!finalSymbol) {
      setPrice(null);
      setSelectedName('');
      setConfirmedSymbol('');
      setError('Please enter a stock ticker symbol.');
      return;
    }

    const selected = stockList.find(s => s.symbol === finalSymbol);
    const company = selected ? selected.companyName : '';

    try {
      const [priceResponse, quoteResponse] = await Promise.all([
        fetch(`https://api.twelvedata.com/price?symbol=${finalSymbol}&apikey=${API_KEY}`),
        fetch(`https://financialmodelingprep.com/api/v3/quote/${finalSymbol}?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
      ]);

      const priceData = await priceResponse.json();
      const quoteJson = await quoteResponse.json();
      const currentQuote = Array.isArray(quoteJson) && quoteJson.length > 0 ? quoteJson[0] : null;

      if (priceData.price && currentQuote) {
        setConfirmedSymbol(finalSymbol);
        setSelectedName(company);
        setPrice(priceData.price);
        setQuoteData(currentQuote);
        setError('');
        setInterval(prev => prev);
      } else {
        setConfirmedSymbol('');
        setSelectedName('');
        setPrice(null);
        setQuoteData(null);
        setError(priceData.price ? 'Could not fetch quote data.' : 'Stock price not found.');
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setConfirmedSymbol('');
      setSelectedName('');
      setPrice(null);
      setQuoteData(null);
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

  const handleAuthSuccess = () => {
    setCurrentUser(Parse.User.current());
    setAuthView('none'); // Hide forms on success
  };

  const handleLogout = async () => {
    try {
      await Parse.User.logOut();
      setCurrentUser(null);
      console.log('User logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <>
    <div className="home-button-container">
        <button onClick={() => setAuthView('none')} className="home-button">
          🏠 Home
        </button>
      </div>

      <div className="app-wrapper">
        
        <div className="header-controls">
          <div className="market-status">
            <span className={`status-dot ${isMarketOpen ? 'open' : 'closed'}`}></span>
            {isMarketOpen ? 'Market is open' : 'Market is closed'}
          </div>
          
          {/* Conditionally show Login/Signup or Logout button */}
          {currentUser ? (
            <button onClick={handleLogout} className="logout-button">Logout ({currentUser.getUsername()})</button>
          ) : (
            <div className="auth-buttons">
              <button onClick={() => setAuthView('login')} className="auth-toggle-button">Login</button>
              <button onClick={() => setAuthView('signup')} className="auth-toggle-button signup">Sign Up</button>
            </div>
          )}
        </div>

        {authView === 'none' ? (
          // If not logging in, show the main app content
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
                    setResults([]);
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
                <h2>${confirmedSymbol}</h2>
                <p>{selectedName}</p>
                <p className="current-price">${parseFloat(price).toFixed(2)}</p>

                <div className="view-toggle-buttons">
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

                {view === 'chart' && (
                  <div style={{ marginTop: '4px', marginBottom: '12px' }}>
                    <label htmlFor="interval" style={{ marginRight: '10px' }}>Range:</label>
                    <select
                      id="interval"
                      value={interval}
                      onChange={(e) => setInterval(e.target.value)}
                      className="range-select"
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

                {view === 'chart' && confirmedSymbol && interval && (
                  <>
                    <StockChart
                      key={`${confirmedSymbol}-${interval}`}
                      symbol={confirmedSymbol}
                      interval={interval}
                    />
                    {quoteData && (
                      <div className="ohlcv-data chart-ohlcv">
                        <h4 className="ohlcv-title">Today</h4>
                        <div className="data-row"><span className="label">Open</span> <span className="value">{quoteData.open?.toFixed(2) ?? 'N/A'}</span></div>
                        <div className="data-row"><span className="label">High</span> <span className="value">{quoteData.dayHigh?.toFixed(2) ?? 'N/A'}</span></div>
                        <div className="data-row"><span className="label">Low</span> <span className="value">{quoteData.dayLow?.toFixed(2) ?? 'N/S'}</span></div>
                        <div className="data-row"><span className="label">Prev Close</span> <span className="value">{quoteData.previousClose?.toFixed(2) ?? 'N/A'}</span></div>
                        <div className="data-row"><span className="label">Volume</span> <span className="value">{quoteData.volume?.toLocaleString() ?? 'N/A'}</span></div>
                      </div>
                    )}
                  </>
                )}
                {view === 'fundamentals' && confirmedSymbol && (
                  <Fundamentals symbol={confirmedSymbol} />
                )}
              </div>
            )}

            {error && <p className="error-msg">{error}</p>}
          </div>
        ) : (
          // ELSE, show the correct auth form
          authView === 'login' ? (
            <Login
              onLoginSuccess={handleAuthSuccess}
              switchToSignup={() => setAuthView('signup')}
            />
          ) : (
            <Signup
              onSignupSuccess={handleAuthSuccess}
              switchToLogin={() => setAuthView('login')}
            />
          )
        )}
      </div>

      <footer className="disclaimer-footer">
        Information provided is for educational purposes only and
        is not investment advice.
      </footer>
    </>
  );
}

export default App;