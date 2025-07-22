import express from 'express';
import gridRoutes from './routes/grid';

const app = express();

app.use(express.json());

// Enable CORS for frontend
import cors from 'cors';
app.use(cors({
  origin: 'http://localhost:3001', // allow frontend dev server
  credentials: true
}));


// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'Calculator API'
    });
  });

// API routes
app.use('/api/grid', gridRoutes);



export default app;