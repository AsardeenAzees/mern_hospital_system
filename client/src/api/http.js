import axios from 'axios';

export const http = axios.create({
    baseURL: 'http://localhost:5001/api',
    withCredentials: true,
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor for debugging
http.interceptors.request.use(
    (config) => {
        console.log('Making request to:', config.url, config.method?.toUpperCase())
        return config
    },
    (error) => {
        console.error('Request error:', error)
        return Promise.reject(error)
    }
);

// Response interceptor for better error handling
http.interceptors.response.use(
    (response) => {
        console.log('Response received:', response.status, response.config.url)
        return response
    },
    (error) => {
        console.error('Response error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            message: error.message,
            code: error.code
        })

        // Handle specific error cases
        if (error.code === 'ERR_NETWORK') {
            console.error('Network error - server may be down or CORS issue')
        } else if (error.response?.status === 401) {
            console.error('Unauthorized - token may be invalid or expired')
        }

        return Promise.reject(error)
    }
);
