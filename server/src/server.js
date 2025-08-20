import 'dotenv/config';
import { connectDB } from './config/db.js';
import app from './app.js';

const port = process.env.PORT || 5000;

connectDB().then(() => {
    console.log('Database connected, starting server...');
    const server = app.listen(port, () => {
        console.log(`API running on http://localhost:${port}`);
        console.log('Server is listening on port:', port);
    });
    
    server.on('error', (error) => {
        console.error('Server error:', error);
    });
});
