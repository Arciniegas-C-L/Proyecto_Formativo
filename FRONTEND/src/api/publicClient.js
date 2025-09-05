
import axios from 'axios';

export const publicApi = axios.create({
  baseURL: 'http://localhost:8000/BACKEND/', 
  headers: {
    'Content-Type': 'application/json',
  },
});
