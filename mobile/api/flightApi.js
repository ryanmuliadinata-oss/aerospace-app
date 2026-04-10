import axios from 'axios';
import { API_BASE_URL } from '../config';
 
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});
 
export const runSimulation = async (flightPlan) => {
  const response = await client.post('/api/simulate', flightPlan);
  return response.data;
};
 
export const checkHealth = async () => {
  const response = await client.get('/api/health');
  return response.data;
};
 
 
export const getGreatCircleRoute = async (origin, destination, numWaypoints = 3, altitude = 35000) => {
  const response = await client.get('/api/greatcircle', {
    params: { origin, destination, waypoints: numWaypoints, altitude }
  });
  return response.data;
};
 