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
}

var waitingLobbies = [] // array of lobbies
var activeGames = []; // contains games

io.on("connection", (socket) => {
  // CONNECTION
  console.log(`User Connected: ${socket.id}`);

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
  })

  // DATA //
  socket.on("set_username", (username) => {
    socket.data.username = username;
  });

  socket.on("set_capacity", (capacity) => { // from CreateRoom
    socket.data.capacity = capacity;
  });

  const getIndexOfRoomInWaitingLobbies = (roomCode) => {
    return waitingLobbies.findIndex(e => e.roomCode === roomCode);
  }

  socket.on("check_for_room", (roomCode) => { // from JoinRoom
    const index = getIndexOfRoomInWaitingLobbies(roomCode);
    if (index > -1) {
      // waitingLobbies contains roomCode at index
      socket.emit("room_with_code", {exists: true});
      socket.data.roomCode = roomCode;
      socket.data.roomWaitingLobbyIndex = index;
    } else {
      socket.emit("room_with_code", {exists: false});
    }
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
  }

  socket.on("create_room", () => {
    // create room code
    socket.data.roomCode = generateRoomCode();
    var data = socket.data;
    var player = newPlayer(data.username);

    console.log(`User ${data.username} with id: ${socket.id} created room ${data.roomCode}`);
    socket.join(data.roomCode);

    var lobby = {
      roomCode: data.roomCode,
      playerList: [player],
      capacity: data.capacity,
    }
    waitingLobbies.push(lobby);
    socket.data.roomWaitingLobbyIndex = waitingLobbies.length - 1;

    socket.emit("set_game_start");
  });

  socket.once("join_room", () => {
    const data = socket.data;
    var player = newPlayer(data.username);

    console.log(`User ${data.username} with id: ${socket.id} joined room ${data.roomCode}`);
    socket.join(data.roomCode);

    if (waitingLobbies[data.roomWaitingLobbyIndex]) {
      var playerList = waitingLobbies[data.roomWaitingLobbyIndex].playerList.length;
      var cap = waitingLobbies[data.roomWaitingLobbyIndex].capacity;
        if (playerList < 2) { // change to cap later
          waitingLobbies[data.roomWaitingLobbyIndex].playerList.push(player);
        } else {
          // START THE GAME
          var game = new Game(
            data.roomCode, // roomCode
            waitingLobbies[data.roomWaitingLobbyIndex].playerList, // Players
            data.capacity, // capacity
          );
          
          console.log("removing waitingLobbies");

          waitingLobbies.splice(data.roomWaitingLobbyIndex, 1);
          socket.emit("subtract", data.roomWaitingLobbyIndex);

          console.log("game starting");
          // start game once Arr[players] reaches capacity
        }
    } 

    socket.emit("set_game_start");
  });

  // Update room index in waitingLobbies (maybe just have the socket find the index when they need to)
  socket.on("subtract", (removedIndex) => {
    if (socket.data.roomWaitingLobbyIndex > removedIndex) {
      socket.data.roomWaitingLobbyIndex -= 1;
    }
  });

  socket.on("subtract_log", () => { // remove after test
    console.log(`${socket.data.username}: `, socket.data.roomWaitingLobbyIndex);
  });

  // MESSAGES
  socket.on("send_msg", (msgData) => { // need to send to client the room code and username
    // send back to all clients
    socket.to(socket.data.roomCode).emit("receive_msg", {...msgData, roomCode: socket.data.roomCode});
  });

  // JUST FOR TESTING //
  socket.on("checkLobby", () => { // on msg send
    console.log("waiting room at the end of join room in server is: ", waitingLobbies);
  })


});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}..`);
});

