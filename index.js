const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

const Player = require("./model/Player.js");
const Game = require("./model/Game.js");
const Team = require("./Enums/Team.js");
const VoteStatus = require("./Enums/VoteStatus.js");

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ extended: false }));

const server = http.createServer(app);

const io = new Server(server, { // for work with socket.io
  cors: {
    origin: ["http://localhost:3000"], // client
    methods: ["GET", "POST"]
  },
});

const generateRoomCode = () => {
  return Array.from(Array(5), () => Math.floor(Math.random() * 36).toString(36)).join('');
};

var games = new Map();

io.on("connection", (socket) => {
  // CONNECTION
  console.log(`User Connected: ${socket.id}`);

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
  });

  // DATA //
  socket.on("set_username", (username) => {
    socket.data.username = username;
  });

  socket.on("set_capacity", (capacity) => { // from CreateRoom
    socket.data.capacity = capacity;
  });

  const newPlayer = (username) => {
    var player = new Player(
      username, // username
      socket.id, // id

      Team.None, // team
      false, // isLeader
      VoteStatus.None, // voteStatus
      false, // onMission
      [], // plotCards
      false // isRevealed
    );
    return player;
  };

  socket.on("create_room", () => {
    // create room code
    var data = socket.data;
    var player = newPlayer(data.username);
    const roomCode = generateRoomCode();
    socket.data.roomCode = roomCode;

    socket.join(roomCode);

    const game = new Game(roomCode, [player], data.capacity, false);
    games.set(roomCode, game);
    socket.emit("set_game_screen"); // UI change, moves user to game screen
    console.log(`User ${data.username} with id: ${socket.id} created room ${data.roomCode}`);
  });

  socket.on("join_room", (roomCode) => { // from JoinRoom modal, may need socket.once
    if (games.has(roomCode)) {
      if (!games.get(roomCode).getHasStarted()) { // game hasn't started
        socket.emit("room_with_code", { exists: true, reason: "" });
        var data = socket.data;
        var player = newPlayer(data.username);
        socket.data.roomCode = roomCode;
        socket.join(roomCode)
        games.get(roomCode).addPlayer(player);
        console.log(`User ${data.username} with id: ${socket.id} joined room ${data.roomCode}`);

        var playerListLen = games.get(roomCode).getPlayers().length;
        var cap = 2; // games.get(roomCode).getCapacity(); change later
        if (playerListLen >= cap) {
          // Reached capacity, START THE GAME
          console.log("game starting");
          games.get(roomCode).setHasStarted(true);

        } else {
          return;
        }
        socket.emit("set_game_screen");
      } else {
        socket.emit("room_with_code", { exists: false, reason: "Game has already started" });
        return;
      }
    } else {
      socket.emit("room_with_code", { exists: false, reason: "Room doesn't exist" });
      return;
    }
  });

  // MESSAGES
  socket.on("send_msg", (msgData) => { // need to send to client the room code and username
    // send back to all clients
    socket.to(socket.data.roomCode).emit("receive_msg", {...msgData, roomCode: socket.data.roomCode});
  });

  // JUST FOR TESTING //
  socket.on("checkGames", () => { // on msg send
    console.log("games looks like: ", games);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}..`);
});

