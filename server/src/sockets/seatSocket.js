let ioInstance = null;

const initSeatSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // User joins a specific show room
    socket.on('joinShow', (showId) => {
      if (showId) {
        socket.join(`show_${showId}`);
        // console.log(`Socket ${socket.id} joined room show_${showId}`);
      }
    });

    // User leaves a specific show room
    socket.on('leaveShow', (showId) => {
      if (showId) {
        socket.leave(`show_${showId}`);
        // console.log(`Socket ${socket.id} left room show_${showId}`);
      }
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });
};

// Emit seat updates to all clients currently viewing that show
const emitSeatUpdate = (showId, eventType, data) => {
  if (ioInstance && showId) {
    ioInstance.to(`show_${showId}`).emit('seatUpdate', {
      eventType, // 'held' | 'booked' | 'released'
      showId: showId.toString(),
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
};

const getIo = () => ioInstance;

module.exports = { initSeatSocket, emitSeatUpdate, getIo };
