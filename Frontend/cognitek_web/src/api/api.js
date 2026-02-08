import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Use 127.0.0.1 or localhost
});

export default api;