//const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const hostname = '192.168.100.198';
export const environment = {
  production: false,
  appName: 'Online Sharia Academy',
  version: '1.0.0',
  apiUrl: `http://${hostname}:8000/api/v1`,
  mobile: true,
};
