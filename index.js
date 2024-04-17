const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

const Player = require("./model/Player.js");
const Game = require("./model/Game.js");
const Team = require("./Enums/Team.js");
const MissionResult = require("./Enums/MissionResult.js");

dotenv.config();

/* ===== SERVER SETUP ===== */
const app = express();

const origin = process.env.NODE_ENV === "dev" ? "http://localhost:3000" : "https://therebelliongame.com";
const corsOptions = {
  origin: origin, 
  credentials: true,
  optionSuccessStatus: 200,
  methods: ["GET", "POST"]
};

app.use(cors(corsOptions));
app.use(express.json({ extended: false }));
app.get('/', (req, res) => {
  res.send('Server is running :)');
});

const server = http.createServer(app);

const io = new Server(server, { // for work with socket.io
  cors: corsOptions,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 mins backup
    skipMiddlewares: true,
  },
  transports: ["websocket"]
});

var games = new Map();

/* ===== HELPER FUNCTIONS ===== */
const getTime = () => {
  var mins = new Date(Date.now()).getMinutes();
  if (mins < 10) {
    mins = "0" + mins;
  }
  return new Date(Date.now()).getHours() + ":" + mins;
};

const generateRoomCode = () => { // random room code
  return Array.from(Array(6), () => Math.floor(Math.random() * 36).toString(36)).join('');
};

const checkNameInGame = (username, curNumPlayers, game) => { // check if name exists in game
  for (let i = 0; i < curNumPlayers; i++) {
    if (game.getPlayers()[i].getUsername() === username) {
      return true;
    }
  }
  return false;
};

const setAndReturnUniqueName = (game, username) => {
  // check for duplicate usernames
  var numDuplicates = 0;
  var isDuplicate = false;
  while (checkNameInGame(username, game.getPlayers().length, game)) {
    numDuplicates += 1;
    if (isDuplicate) { // duplicate of a duplicate lol
      username = username.slice(0, -1);
    }
    if (username.length < 9) {
      username = username + numDuplicates;
    } else {
      username = username.slice(0, -1) + numDuplicates;
    }
    isDuplicate = true;
  }
  return username;
};

const newPlayer = (id, username, isAdmin) => {
  var player = new Player(
    id,
    username, // username
    isAdmin, // isAdmin
    Team.Unknown, // team
    false, // isLeader
    false, // onMission
  );
  return player;
};

io.on("connection", (socket) => {
  /* ----- CONNECTION ----- */
  io.emit('initial_ping');

  if (socket.recovered) {
    console.log(`Socket recovered with id: ${socket.id}`);
  } else {
    console.log(`Brand new connection with id: ${socket.id}`);
  }

  /* ===== EMITS ===== */
  const sendInitialInfo = (game, msg) => {
    game.sendGameSettingsChanges(io);
    game.updateChatMsg(io, msg);
    game.updateSeats(io);
  };

  const sendNotInLobby = (game, username) => {
    const cmdErrorMsg = {
      msg: `Admin tried kicking ${username} but they're not in lobby, try removing extra spaces in this command or use CAPS?`,
      sender: "GAME MASTER",
      time: getTime()
    };
    game.updateChatMsg(io, cmdErrorMsg);
  };

  const handlePlayerJoin = (socket, username, roomCode, game, sendRoomValidity) => {
    const uniqueName = setAndReturnUniqueName(game, username);
    const player = newPlayer(socket.id, uniqueName, false);
    socket.join(roomCode);
    game.addPlayer(player);

    const joinMsg = {
      msg: `${uniqueName} has joined game`, sender: "PLAYER UPDATE", time: getTime()
    };
    sendInitialInfo(game, joinMsg);
    sendRoomValidity({ roomExists: true, roomCode: roomCode, uniqueName: uniqueName });
  };

  /* ===== EVENT LISTENERS ===== */
  /* ----- DISCONNECTION ----- */
  socket.on("disconnect", (reason, details) => {
    console.log(`User ${socket.id} disconnected because: ${reason} and ${details}`);

    if (games.size === 0) return;
    if (socket.data.roomCode == null) return;

    const roomCode = socket.data.roomCode;
    var game = games.get(roomCode);

    if (game == null) return;

    const byeMsg = {
      msg: `${game.getPlayerById(socket.id, game.getPlayers().length)?.getUsername()} has disconnected`,
      sender: "GAME MASTER",
      time: getTime()
    };
    io.to(roomCode).emit("msg_list_update", byeMsg);

    if (game.getHasStarted()) { // In game, non lobby
      game.endGame(game, io, false, true, socket.id, socket.data.isAdmin, socket);
    } else { // lobby
      if (game.getPlayers().length <= 1) {
        games.delete(roomCode); // no emit needed, there'll be nothing left
        console.log(`Game with roomcode: ${roomCode || "undefined"} has been deleted`);
      } else {
        game.removePlayer(username);
        if (socket.data.isAdmin) {
          game.updateRoomAdmin(io, game.getPlayers()[0].getUsername(), getTime());
        }
        game.sendSeatingInfo(io);
      }
    }
  });

  /* ----- IN ROOM CHECK ----- */
  /* socket.on("am_i_in_room", (room, areYouInRoom) => {
    areYouInRoom({ inRoom: socket.rooms.has(room) });
  }); */

  /* ----- REMOVE PLAYER ----- */
  socket.on("remove_me", (username, roomCode, isAdmin) => {
    console.log("remove me called", username, roomCode, isAdmin);
    if (socket.rooms.has(roomCode)) {
      const game = games.get(roomCode);
      if (checkNameInGame(username, game.getPlayers().length, game)) {
        game.removePlayer(username);
        if (game.getHasStarted()) game.endGame(io, false, true, isAdmin);
        socket.leave(roomCode);
      }
    }
  });

  /* ----- CREATE ROOM ----- */
  socket.on("create_room", (username, navigateTo) => {
    // create room code
    const admin = newPlayer(socket.id, username, true);
    const roomCode = generateRoomCode();
    socket.join(roomCode);
    console.log("Created room: ", roomCode);

    const game = new Game(
      roomCode, // roomCode
      admin, // roomAdmin
      6, // capacity
      true, // private room
      7 * 60, // selectionSecs
      1, // numGames
      false, // hasStarted
      false, // teamSelectHappening
      false, // voteHappening
      false, // missionHappening
      [admin], // players
      [], // msgList
      1, // curMission
      0, // curMissionVoteDisapproves
      [
        MissionResult.None, 
        MissionResult.None, 
        MissionResult.None, 
        MissionResult.None, 
        MissionResult.None
      ], // missionResultTrack
      [[],[],[],[],[]], // missionHistory
      [[],[]], // curVoteTally,
      [0,0], // curMissionTally
    );
    games.set(roomCode, game);

    const createMsg = {
      msg: `${username} has created game`, sender: "PLAYER UPDATE", time: getTime()
    };
    sendInitialInfo(game, createMsg);
    navigateTo({ room: roomCode });
  });

  /* ----- JOIN ROOM ----- */
  socket.on("join_room", (username, roomCode, sendRoomValidity) => {
    if (roomCode === "random_join") {
      for (let [room, game] of games) {
        if (game.getPlayers().length < game.getCapacity() && !game.getPrivateRoom()) {
          handlePlayerJoin(socket, username, room, game, sendRoomValidity);
          return;
        }
      }
      // If not returned by end of loop, there are no available games currently
      sendRoomValidity({ 
        roomExists: false,
        msg:  "All games are currently full, please try again later..." 
      });
      return;
    }

    if (games.has(roomCode)) {
      const existingGame = games.get(roomCode);
      const fullGame = existingGame.getPlayers().length >= existingGame.getCapacity();
      if (!fullGame) {
        handlePlayerJoin(socket, username, roomCode, existingGame, sendRoomValidity);
        return;
      } else {
        sendRoomValidity({ roomExists: false, msg: "Game is full" });
        return;
      }
    } else {
      sendRoomValidity({ roomExists: false, msg: "Room doesn't exist" })
      return;
    }
  });

  /* ----- LEAVE ROOM ----- */
  socket.on("leave_room", (roomCode) => {
    socket.leave(roomCode);
  });

  /* ----- GAME SETTINGS ----- */
  socket.on("set_capacity", (newCapacity, roomCode) => { // game settings
    games.get(roomCode).setCapacity(newCapacity);
    io.to(roomCode).emit("capacity_change", newCapacity);
  });
  socket.on("set_selection_secs", (newSecs, roomCode) => { // game settings
    games.get(roomCode).setSelectionSecs(newSecs);
    io.to(roomCode).emit("selection_secs_change", newSecs);
  });
  socket.on("set_private_room", (newPrivateRoom, roomCode) => { // game settings
    games.get(roomCode).setPrivateRoom(newPrivateRoom);
    io.to(roomCode).emit("private_room_change", newPrivateRoom);
  });

  /* ----- MESSAGES ----- */
  socket.on("send_msg", (msgData, roomCode, username, isAdmin) => {
    const game = games.get(roomCode);
    const msgLen = msgData.msg.length;

    if (msgData.msg === process.env.GAMES_SIZE_CMD) {
      console.log("Games size: ", games.size);
      return;
    }
    if (msgData.msg === process.env.ALL_SOCKETS_CMD) {
      console.log("# of sockets: ", io.engine.clientsCount);
      return;
    }

    if (msgData.msg.slice(0, 5) === "/kick" && !game.getHasStarted() && isAdmin) {
      const kickedUsername = msgData.msg.slice(6, msgLen).toUpperCase();
      if (kickedUsername === username) return;
      if (!checkNameInGame(kickedUsername, game.getPlayers().length, game)) {
        sendNotInLobby(game, kickedUsername);
        return;
      }
      const removedPlayerId = game.getPlayerByUsername(kickedUsername).getId();
      game.removePlayer(kickedUsername);
      game.updateSeats(io);
      const kickMsg = {
        msg: `${kickedUsername} was kicked by admin`,
        sender: "GAME MASTER",
        time: getTime()
      };
      game.updateChatMsg(io, kickMsg);

      io.to(removedPlayerId).emit("kicked_player");
      return;
    }

    if (msgData.msg.slice(0, 6) === "/admin" && isAdmin) {
      const newAdminUsername = msgData.msg.slice(7, msgLen).toUpperCase();
      if (newAdminUsername === username) return;

      if (!checkNameInGame(newAdminUsername, game.getPlayers().length, game)) {
        sendNotInLobby(game, newAdminUsername);
        return;
      }

      game.updateRoomAdmin(io, newAdminUsername, true, getTime());
      return;
    }

    // send back to all clients in room
    game.updateChatMsg(io, msgData);
  });

  /* ----- GAMEPLAY ----- */
  socket.on("admin_start_game", (roomCode) => {
    games.get(roomCode).startGame(io);
  });

  socket.on("team_submitted_for_vote", (info) => {
    const game = games.get(info.roomCode);
    game.handleVote(io, info.selectedPlayers);
  });

  socket.on("vote_is_in", (info) => {
    const game = games.get(info.roomCode);
    game.handleVoteEntries(io, info.username, info.approve); 
    // calls handleMissionStart or handleTeamSelect or handleGameEnd
  });

  socket.on("mission_entry_is_in", (info) => {
    const game = games.get(info.roomCode);
    game.handleMissionEntries(io, info.pass);
  });

  socket.on("request_seats", (username, roomCode) => {
    games.get(roomCode).updateSeats(io, true, username, socket);
  });
});

// server running...
server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}..`);
});

