import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const apiPath = import.meta.env.VITE_API_PATH;

const apiClient = axios.create({
    baseURL: `${baseUrl}${apiPath}`,
    headers: {
        'Content-Type': 'application/json'
    },
});

export default apiClient;