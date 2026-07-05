import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'

// Global Axios interceptor to normalize URL paths and remove double slashes (e.g. //api -> /api)
axios.interceptors.request.use((config) => {
  if (config.url) {
    config.url = config.url.replace(/([^:]\/)\/+/g, '$1');
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)