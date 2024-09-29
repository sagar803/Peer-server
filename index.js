import express from "express";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import cors from "cors";
import http from "http";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const socketToUserMapping = new Map();

function getOnlineUsers() {
  return Array.from(socketToUserMapping.entries()).map(([id, name]) => ({
    id,
    name,
  }));
}

io.on("connection", (socket) => {
  console.log("New user connected");
  socket.emit("refresh", socket.id);

  socket.on("login", ({ name }) => {
    console.log("User Logged In:", { name, id: socket.id });
    socketToUserMapping.set(socket.id, name);
    socket.emit("self", { name, id: socket.id });
    const onlineUsers = getOnlineUsers();
    io.emit("online-users", { onlineUsers });
  });

  socket.on("call_user", ({ to, offer }) => {
    console.log("user called", to);
    const name = socketToUserMapping.get(socket.id);
    console.log(name);
    console.log(socket.id);
    console.log(to);
    socket.to(to).emit("incomming_call", { from: socket.id, offer });
  });

  socket.on("call_accepted", ({ to, ans }) => {
    console.log("call accepted", to);
    socket.to(to).emit("call_accepted", { from: socket.id, ans });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    console.log("sending ice candidate");
    socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  socket.on("call_rejected", ({ to }) => {
    console.log("call ended", to);
    socket.to(to).emit("call_rejected", { from: socket.id });
  });

  socket.on("end_call", ({ to }) => {
    console.log("call ended", to);
    socket.to(to).emit("call_disconnected", { from: socket.id });
  });
  socket.on("disconnect", () => {
    const onlineUsers = getOnlineUsers(socket.id);
    socketToUserMapping.delete(socket.id);
    io.emit("online-users", { onlineUsers });
    console.log("user disconnected");
  });
});

const port = process.env.PORT || 8001;
server.listen(port, () => {
  console.log("socket is up and running on port: ", port);
});

/*
Use socket.to(data.room).emit("joined_room", data) if you want all clients in the specified room, including the sender, to receive the event.
Use socket.broadcast.to(data.room).emit("joined_room", data) if you want all clients in the specified room, except the sender, to receive the event.
*/

/*

  socket.on('offer', (data) => {
     io.to(data.target).emit('offer', data.offer);
  });

  socket.on('answer', (data) => {
    io.to(data.target).emit('answer', data.answer);
  });



  */
