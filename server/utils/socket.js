let io;

function init(server) {
  const { Server } = require('socket.io');
 io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://secure-lens-six.vercel.app'
    ],
    methods: ['GET', 'POST'],
  },
});

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client joins a room identified by scanId to receive scan-specific events
    socket.on('join:scan', (scanId) => {
      socket.join(scanId);
      console.log(`📡 Socket ${socket.id} joined scan room: ${scanId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call init(server) first.');
  return io;
}

module.exports = { init, getIO };
