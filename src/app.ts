import express from "express";
import cors from "cors";
require('express-async-errors');
import { createServer, Server as HTTPServer } from 'http';
import { FRONTEND_URL } from "./util/config";
import { Server, Server as SocketIOServer} from "socket.io"
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "./types";

export const app = express();

app.use(cors())

app.get("/", (req, res) => {
    res.send(`<h1>Hello World</h1>`); 
});


export const httpServer = createServer(app);
export const io  = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
        origin: `http://${FRONTEND_URL}`
    }
});

io.on("connection", async (socket) => {
    let room = socket.handshake.headers.room as string;
    let id = socket.id;

    if(!(room && typeof room === 'string' && !Array.isArray(room))) {
        // Socket.io makes socket join rooms identified by socket.id by default
        // good fallback value
        room = id;
    }

    // room

    socket.join(room);

    // webRTC

    socket.on("offer", (fromSocketId, toSocketId, offer ) => {
        console.log(`Offer received`);
        socket.broadcast.to(toSocketId).emit("offer", fromSocketId,toSocketId, offer);
    })

    socket.on("answer", (fromSocketId, toSocketId, answer) => {
        console.log(`Answer received`);
        socket.broadcast.to(toSocketId).emit("answer", fromSocketId, toSocketId, answer);
    })

    socket.on("ice-candidate", (fromSocketId, toSocketId, candidate) => {
        console.log(`ICE candidate:`);
        socket.broadcast.to(toSocketId).emit("ice-candidate", fromSocketId, toSocketId, candidate);
    })

    // chat

    socket.on("message", (fromSocketId, message: string, time: number) => {
        // not-broadcasted, sender also receives their own message
        console.log(`Socket ${fromSocketId} sent a message.`)
        io.to(room).emit("message", fromSocketId, message, time);
    });

})

// room events provided by Socket.io
io.of("/").adapter.on("create-room", (room) => {
    console.log(`room ${room} was created`);
});

io.of("/").adapter.on("delete-room", (room) => {
    console.log(`room ${room} was deleted`);
});

io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
    updateRoomUsers(io, room);
});

io.of("/").adapter.on("leave-room", (room, id) => {
    console.log(`socket ${id} has left the room ${room}`);
    updateRoomUsers(io, room);
});


// update list of connected users to the given room
function updateRoomUsers(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, room: string) {
    const rooms = io.of("/").adapter.rooms;
    const existingRoom = rooms.get(room);

    if(existingRoom) {
        const users : string[] = [];
        existingRoom.forEach((userIdInRoom) => {
            users.push(userIdInRoom);
        })

        io.to(room).emit('room-users', users);
    }
}
