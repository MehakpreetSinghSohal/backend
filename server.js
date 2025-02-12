const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const connectDB = require('./config/db'); // Import the connectDB function

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Allow frontend to connect
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB().then(() => console.log('MongoDB Connected ✅')).catch(err => console.error('MongoDB Connection Error ❌', err));

// Root Route (Fixes "Cannot GET /" issue)
app.get('/', (req, res) => {
  res.send('Event Management API is running 🚀');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for when a user joins an event
  socket.on('joinEvent', (eventId) => {
    socket.join(eventId); // Join the room for this event
    console.log(`User ${socket.id} joined event ${eventId}`);
  });

  // Listen for when a user leaves an event
  socket.on('leaveEvent', (eventId) => {
    socket.leave(eventId); // Leave the room for this event
    console.log(`User ${socket.id} left event ${eventId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
