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

/* CRUCIAL */
var games = new Map();

// SOCKET SETUP //
io.on("connection", (socket) => {
  // CONNECTION
  console.log(`User Connected: ${socket.id}`);

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
    if (games.size === 0) return;
    if (socket.data.roomCode == null) return;

    const roomCode = socket.data.roomCode;

    var game = games.get(roomCode);
    if (game.getHasStarted()) {
      io.to(roomCode).emit("set_game_end", game.getSeats()); // pass in full list of players
      games.delete(roomCode);
    } else {
      if (game.getPlayers().length <= 1) {
        games.delete(roomCode); // no emit needed, there'll be nothing left
      } else {
        game.removePlayer(socket.id); // remove one player
        io.to(roomCode).emit("player_left_lobby", game.getSeats());
      }
    }

    console.log("games: ", games);
  });

  // DATA //
  socket.on("set_username", (username) => {
    socket.data.username = username;
  });

  socket.on("set_capacity", (capacity) => { // from CreateRoom
    socket.data.capacity = capacity;
  });

  socket.on("set_selection_time", (selectionTime) => { // from CreateRoom
    socket.data.selectionTime = selectionTime;
  });

  const newPlayer = (username) => {
    var player = new Player(
      username, // username
      socket.id, // id

      Team.Unknown, // team
      false, // isLeader
      VoteStatus.None, // voteStatus
      false, // onMission
      [], // plotCards
      false // isRevealed
    );
    return player;
  };

  // ROOMS //
  socket.on("create_room", () => {
    // create room code
    var data = socket.data;
    var player = newPlayer(data.username);
    const roomCode = generateRoomCode();
    socket.data.roomCode = roomCode;

    socket.join(roomCode);

    const game = new Game(roomCode, [player], data.capacity, data.selectionTime, false);
    games.set(roomCode, game);
    game.setSeat(player, Team.Unknown);

    console.log(`User ${data.username} with id: ${socket.id} created room ${data.roomCode}`);
    io.to(roomCode).emit("player_joined_lobby", { seats: game.getSeats(), numPlayers: data.capacity });
  });

  socket.on("join_room", (roomCode) => { // from JoinRoom modal, may need socket.once
    if (games.has(roomCode)) {
      if (!games.get(roomCode).getHasStarted()) { // game hasn't started
        socket.emit("room_with_code", { exists: true, reason: "" });
        socket.data.roomCode = roomCode;
        socket.join(roomCode)

        var data = socket.data;
        var player = newPlayer(data.username);
        var game = games.get(roomCode);
        const cap = game.getCapacity();

        game.addPlayer(player);
        console.log(`User ${data.username} with id: ${socket.id} joined room ${data.roomCode}`);

        game.setSeat(player, Team.Unknown);
        
        io.to(roomCode).emit("player_joined_lobby", { seats: game.getSeats(), numPlayers: cap });

        var curNumPlayers = game.getPlayers().length;

        if (curNumPlayers >= cap) {
          // Reached capacity, START THE GAME
          // GAME LOGIC BEGINS HERE
          game.startGame(game, io);
        }
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
    console.log("games looks like: ", games.get(socket.data.roomCode).getPlayers());
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}..`);
});

