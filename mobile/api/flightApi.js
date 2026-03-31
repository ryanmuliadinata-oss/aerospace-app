import axios from 'axios';
import { API_BASE_URL } from '../config';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

export const runSimulation = async (flightPlan) => {
  const response = await client.post('/simulate', flightPlan);
  return response.data;
};

export const checkHealth = async () => {
  const response = await client.get('/health');
  return response.data;
};