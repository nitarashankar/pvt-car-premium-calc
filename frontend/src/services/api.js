/**
 * API Service for communicating with backend
 */
import axios from 'axios';

// For Railway deployment, use environment variable
// For local development, use localhost:8000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const calculatorAPI = {
  // Calculate premium for single input
  calculatePremium: async (inputData) => {
    const payload = { ...inputData };
    const ncbValue = Number(payload.ncb_percent);

    if (!Number.isNaN(ncbValue)) {
      payload.ncb_percent = ncbValue > 1 ? ncbValue / 100 : ncbValue;
    }

    const response = await api.post('/calculate', payload);
    return response.data;
  },

  // Process CSV file
  processCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/csv/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Download processed CSV
  downloadCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/csv/download', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
    return response.data;
  },

  // Get configuration
  getODRates: async () => {
    const response = await api.get('/config/od-rates');
    return response.data;
  },

  getTPRates: async () => {
    const response = await api.get('/config/tp-rates');
    return response.data;
  },

  getAddonConfig: async () => {
    const response = await api.get('/config/addons');
    return response.data;
  },

  getDiscountConfig: async () => {
    const response = await api.get('/config/discounts');
    return response.data;
  },

  getGSTConfig: async () => {
    const response = await api.get('/config/gst');
    return response.data;
  },

  // Update configuration
  updateODRates: async (config) => {
    const response = await api.put('/config/od-rates', config);
    return response.data;
  },

  updateTPRates: async (config) => {
    const response = await api.put('/config/tp-rates', config);
    return response.data;
  },

  updateAddonConfig: async (config) => {
    const response = await api.put('/config/addons', config);
    return response.data;
  },

  updateDiscountConfig: async (config) => {
    const response = await api.put('/config/discounts', config);
    return response.data;
  },

  updateGSTConfig: async (config) => {
    const response = await api.put('/config/gst', config);
    return response.data;
  },

  // Validate input
  validateInput: async (params) => {
    const response = await api.get('/validate', { params });
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default calculatorAPI;
