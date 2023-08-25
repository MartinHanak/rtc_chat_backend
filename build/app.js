"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require('express-async-errors');
const http_1 = require("http");
const config_1 = require("./util/config");
const socket_io_1 = require("socket.io");
const usersPerRoom = 3;
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
exports.app.get("/", (req, res) => {
    res.send(`<h1>Hello World</h1>`);
});
const roomHost = new Map();
exports.httpServer = (0, http_1.createServer)(exports.app);
exports.io = new socket_io_1.Server(exports.httpServer, {
    cors: {
        origin: `http://${config_1.FRONTEND_URL}`
    }
});
exports.io.on("connection", async (socket) => {
    let room = socket.handshake.headers.room;
    let id = socket.id;
    if (!(room && typeof room === 'string' && !Array.isArray(room))) {
        // Socket.io makes socket join rooms identified by socket.id by default
        // good fallback value
        room = id;
    }
    const rooms = exports.io.of("/").adapter.rooms;
    if (!rooms.has(room)) {
        // new room created
        socket.join(room);
        roomHost.set(room, socket.id);
        socket.emit("created", roomHost.get(room) || '');
    }
    else {
        let existingRoom = rooms.get(room);
        if (existingRoom && existingRoom.size <= usersPerRoom) {
            // join existing room
            let hostId = roomHost.get(room);
            if (!hostId) {
                console.log(`Room ${existingRoom} has no hostId when room joined.`);
                hostId = '';
            }
            socket.join(room);
            socket.emit("joined", hostId);
        }
        else {
            // room full
            socket.emit("full");
        }
    }
    socket.on("ready", (fromSocketId) => {
        console.log(`Socket ${fromSocketId} is ready.`);
        socket.broadcast.to(room).emit("ready", fromSocketId);
    });
    socket.on("ice-candidate", (fromSocketId, candidate) => {
        console.log(`ICE candidate:`);
        console.log(candidate);
        socket.broadcast.to(room).emit("ice-candidate", fromSocketId, candidate);
    });
    socket.on("offer", (fromSocketId, offer) => {
        console.log(`Offer received`);
        socket.broadcast.to(room).emit("offer", fromSocketId, offer);
    });
    socket.on("answer", (fromSocketId, answer) => {
        console.log(`Answer received`);
        socket.broadcast.to(room).emit("answer", fromSocketId, answer);
    });
    socket.on("disconnect", (reason) => {
        // socket is automatically removed from room on disconnect
        console.log(`Socket disconnected`);
    });
    socket.on("leave", (fromSocketId) => {
        console.log(`Socket left room, emitted "leave"`);
        socket.broadcast.to(room).emit("leave", fromSocketId);
    });
    socket.on("message", (fromSocketId, message) => {
        // not-broadcasted, sender also receives their own message
        console.log(`Socket ${fromSocketId} sent a message.`);
        exports.io.to(room).emit("message", fromSocketId, message);
    });
});
// room events provided by Socket.io
exports.io.of("/").adapter.on("create-room", (room) => {
    console.log(`room ${room} was created`);
});
exports.io.of("/").adapter.on("delete-room", (room) => {
    console.log(`room ${room} was deleted`);
});
exports.io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
});
exports.io.of("/").adapter.on("leave-room", (room, id) => {
    console.log(`socket ${id} has left the room ${room}`);
});
//# sourceMappingURL=app.js.map