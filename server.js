const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const io = socketIo(server, {
    maxHttpBufferSize: 1e6, // 1 MB - ajustează după nevoie
});

class Message {
    constructor(user, text, time, type = 'text', fileData = null) {
        this.user = user;
        this.text = text;
        this.time = time;
        this.type = type;
        this.fileData = fileData;
    }
}

class ChatServer {
    constructor(port) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.messageHistory = [];
        this.configureRoutes();
        this.handleConnections();
    }

    configureRoutes() {
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    handleConnections() {
        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.id}`);
            
            // Trimite istoricul mesajelor
            socket.emit('messageHistory', this.messageHistory);

            socket.on('sendMessage', (data) => {
                console.log('Received message:', data);
                const message = new Message(data.user, data.text, data.time);
                this.messageHistory.push(message);
                this.io.emit('receiveMessage', message);
            });

            socket.on('sendFile', (fileMessage) => {
                console.log('Received file:', fileMessage.fileData.name);
                this.messageHistory.push(fileMessage);
                // Transmite către toți ceilalți clienți
                socket.broadcast.emit('receiveFile', fileMessage);
            });

            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.id}`);
            });
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`Server running on http://localhost:${this.port}`);
        });
    }
}

const chatServer = new ChatServer(3000);
chatServer.start();