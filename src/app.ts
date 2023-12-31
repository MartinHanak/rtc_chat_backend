import express from "express";
import cors from "cors";
require("express-async-errors");
import { createServer, Server as HTTPServer } from "http";
import { FRONTEND_URL } from "./util/config";
import { Server, Server as SocketIOServer } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  userInfo,
} from "./types";

import { roomRouter } from "./controllers/room";
import { roomSSERouter } from "./controllers/roomSSE";
import { RedisSession } from ".";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/room", roomRouter);
app.use("/api/roomSSE", roomSSERouter);

app.get("/", (req, res) => {
  res.send(`<h1>Hello World</h1>`);
});

export const httpServer = createServer(app);
export const io = new SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: `http://${FRONTEND_URL}`,
  },
});

io.on("connection", async (socket) => {
  let room = decodeURIComponent(socket.handshake.headers.room as string);
  let username = socket.handshake.headers.username as string;
  let id = socket.id;
  let color = socket.handshake.headers.color;

  if (
    !(room && typeof room === "string" && !Array.isArray(room)) ||
    !(username && typeof username === "string" && !Array.isArray(username)) ||
    Array.isArray(color)
  ) {
    // Socket.io makes socket join rooms identified by socket.id by default
    // good fallback value
    room = id;
    username = id;
    color = undefined;
  }

  // save user-selected username
  await RedisSession.saveUser(id, username, color);

  // join room
  console.log(`user ${username} joined the room ${room}`);
  socket.join(room);

  // webRTC

  socket.on("offer", (fromSocketId, toSocketId, offer) => {
    console.log(`Offer received`);
    socket.broadcast
      .to(toSocketId)
      .emit("offer", fromSocketId, toSocketId, offer);
  });

  socket.on("answer", (fromSocketId, toSocketId, answer) => {
    console.log(`Answer received`);
    socket.broadcast
      .to(toSocketId)
      .emit("answer", fromSocketId, toSocketId, answer);
  });

  socket.on("ice-candidate", (fromSocketId, toSocketId, candidate) => {
    socket.broadcast
      .to(toSocketId)
      .emit("ice-candidate", fromSocketId, toSocketId, candidate);
  });

  // chat

  socket.on("message", (fromSocketId, message: string, time: number) => {
    // not-broadcasted, sender also receives their own message
    console.log(`Socket ${fromSocketId} sent a message.`);
    io.to(room).emit("message", fromSocketId, message, time);
  });

  // user settings
  socket.on(
    "localSettingsChange",
    (fromSocketId: string, newInfo: userInfo) => {
      RedisSession.updateUserInfo(fromSocketId, newInfo)
        .then(() => {
          console.log(
            `User ${fromSocketId} updated successfully to new userInfo`
          );
          console.log(newInfo);
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          updateRoomUsers(io, room);
        });
    }
  );
});

// room events provided by Socket.io
io.of("/").adapter.on("create-room", (room) => {
  console.log(`room ${room} was created`);
});

io.of("/").adapter.on("delete-room", (room) => {
  console.log(`room ${room} was deleted`);
  // TODO: fix automatic room deletion
  RedisSession.deleteRoom(room);
});

io.of("/").adapter.on("join-room", (room, id) => {
  console.log(`socket ${id} has joined room ${room}`);
  updateRoomUsers(io, room);
});

io.of("/").adapter.on("leave-room", (room, id) => {
  console.log(`socket ${id} has left the room ${room}`);
  updateRoomUsers(io, room);
});

// update list of users connected to the given room
async function updateRoomUsers(
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  room: string
) {
  const rooms = io.of("/").adapter.rooms;
  const existingRoom = rooms.get(room);

  if (existingRoom) {
    const users: userInfo[] = [];
    // looping set = guarantee that order of users = insertion order
    for (const userSocketId of existingRoom) {
      const user = await RedisSession.getUser(userSocketId);

      const userInfo: userInfo = {} as userInfo;
      if (
        user &&
        typeof user.username === "string" &&
        typeof user.socketId === "string"
      ) {
        userInfo.username = user.username;
        userInfo.socketId = user.socketId;
      }
      if (user && typeof user.color === "string") {
        userInfo.color = user.color;
      }

      users.push(userInfo);
    }

    console.log(users);
    io.to(room).emit("room-users", users);
  }
}
