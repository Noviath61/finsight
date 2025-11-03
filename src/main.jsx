import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Parse from 'parse'; // Import Parse

Parse.initialize(
  import.meta.env.VITE_BACK4APP_APP_ID,
  import.meta.env.VITE_BACK4APP_JS_KEY
);
Parse.serverURL = 'https://parseapi.back4app.com/'; // Back4app server URL

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
