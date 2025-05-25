import { io, Socket } from "socket.io-client";

export const connectSocket = (userId: string): Socket => {
  const socket = io("http://localhost:5000", {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    query: { userId },
  });

  socket.on("connect", () => {
    console.log("Socket connected with ID:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = (socket: Socket) => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
