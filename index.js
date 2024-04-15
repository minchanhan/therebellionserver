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

  const sendNotInLobby = (username) => {
    const error = {
      msg: `${username} not in lobby, try removing extra spaces in this command?`,
      sender: "ADMIN INFO",
      time: getTime()
    };
    io.to(socket.id).emit("msg_list_update", error);
  };

  const handlePlayerJoin = (socket, username, roomCode, game, sendRoomValidity) => {
    console.log("handlePlayerJoin called");
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
      sender: "PLAYER UPDATE",
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
          game.changeRoomAdmin(game, game.getPlayers()[0].getUsername(), false, io, socket);
        }
        game.sendSeatingInfo(io);
      }
    }
  });

  /* ----- IN ROOM CHECK ----- */
  socket.on("am_i_in_room", (room, areYouInRoom) => {
    areYouInRoom({ inRoom: socket.rooms.has(room) });
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
      [], // curSelectedPlayers
      [[],[]], // curVoteTally,
      0, // curMissionVoteDisapproves
      0, // curMissionFails
      [
        MissionResult.None, 
        MissionResult.None, 
        MissionResult.None, 
        MissionResult.None, 
        MissionResult.None
      ], // missionResultTrack
      [[],[],[],[],[]], // missionHistory
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
  socket.on("send_msg", (msgData, roomCode, isAdmin, username) => {
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
      const kickedUsername = msgData.msg.slice(6, msgLen);
      if (kickedUsername === username) return;
      if (!checkNameInGame(kickedUsername, game.getPlayers().length, game)) {
        sendNotInLobby(kickedUsername);
        return;
      }
      
      game.removePlayer(kickedUsername);

      const kickMsg = {
        msg: `${kickedUsername} was kicked by admin`,
        sender: "PLAYER UPDATE",
        time: getTime()
      };
      game.updateSeats(io);
      game.updateChatMsg(io, kickMsg);
      io.to(kickedPlayerId).emit("kicked_player");
      io.to(kickedPlayerId).emit("set_game_end", { playerRevealArr: [], endMsg: "", kicked: true });
      return;
    }

    if (msgData.msg.slice(0, 6) === "/admin" && isAdmin) {
      const newAdminUsername = msgData.msg.slice(7, msgLen);
      if (newAdminUsername === username) return;

      if (!checkNameInGame(newAdminUsername, game.getPlayers().length, game)) {
        sendNotInLobby(newAdminUsername);
        return;
      }

      // player exists
      game.changeRoomAdmin(game, newAdminUsername, true, io, socket);
      return;
    }

    // send back to all clients in room
    socket.to(socket.data.roomCode).emit("msg_list_update", msgData);
  });

  /* ----- GAMEPLAY ----- */
  socket.on("admin_start_game", () => {
    const game = games.get(socket.data.roomCode);
    game.startGame(game, io);
  });

  socket.on("team_submitted_for_vote", (info) => { // 1
    const game = games.get(info.roomCode);
    game.setLeaderSelectedTeam(true);
    game.handleVote(game, io, info.selectedPlayers, info.roomCode);
  });

  socket.on("vote_is_in", (info) => { // 2
    const game = games.get(info.roomCode);
    const voter = info.username;
    game.setCurVoteTally(info.approve, voter);

    const approvals = game.getCurVoteTally()[0].length;
    const disapprovals = game.getCurVoteTally()[1].length;

    if ((approvals + disapprovals) === game.getCapacity()) {
      const voteApproved = (approvals - disapprovals) > 0;

      // Send voting results to chats
      const voteResultMsg = `${approvals > 0 ? game.getCurVoteTally()[0].join(', ') : "Nobody"} approved mission.\n

      ${disapprovals > 0 ? game.getCurVoteTally()[1].join(', ') : "Nobody"} disapproved mission.`;

      const msgData = {
        msg: voteResultMsg,
        sender: "PUBLIC TALLY",
        time: `Mission ${game.getMission()}, Vote ${game.getCurMissionVoteDisapproves() + 1}`
      };

      io.to(info.roomCode).emit("msg_list_update", msgData); // send public tally to CHATBOX THIS TIME
    
      if (voteApproved) {
        // commence mission
        game.handleMission(game, io, info.selectedPlayers);
      } else {
        game.setCurMissionVoteDisapproves(game.getCurMissionVoteDisapproves() + 1);
        if (game.getCurMissionVoteDisapproves() > 4) {
          game.endGame(game, io, false);
          return;
        }
        const revoteSpeech = `I see, you do not trust ${info.selectedPlayers.slice(0, -1).join(', ')} and ${info.selectedPlayers.slice(-1)}
        to go on this mission. `;
        game.changeLeader(game, io, revoteSpeech);
      }
      return;
    }
  });

  socket.on("mission_result_is_in", (info) => { // 3
    const game = games.get(info.roomCode);
    game.setMissionResult(info.pass);
    const passes = game.getMissionResult()[0];
    const fails = game.getMissionResult()[1];
    const missionTeamSize = game.getMissionTeamSizes()[game.getMission() - 1];

    if (passes + fails === missionTeamSize) { // CHANGE TO NUMBER OF PEOPLE ON MISSIONS
      // announce mission results
      const cap = game.getCapacity();
      const mission = game.getMission();
      const missionPassed = cap >= 7 && mission === 4 ? fails < 2 : fails === 0;
      game.setMissionResultTrack(game.getMission(), missionPassed);

      game.addMission(); // increment mission
      missionPassed ? game.addMissionPasses() : game.addMissionFails();

      if (game.getMissionPasses() === 3) {
        game.endGame(game, io, true);
        return;
      } else if (game.getMissionFails() === 3) {
        game.endGame(game, io, false);
        return;
      }

      // If still going, then keep going with mission      
      const missionResultSpeech = missionPassed ? `Well done soliders. The mission has passed. We have \
      ${3 - game.getMissionPasses()} left before we complete the overthrowing. ` : `This isn't good... we failed the mission... \
      ${3 - game.getMissionFails()} failed missions remain before plans of overthrowing the power is ruined. `;

      io.in(info.roomCode).emit("mission_completed", { 
        mission: game.getMission(), 
        missionResultTrack: game.getMissionResultTrack() 
      });
      game.changeLeader(game, io, missionResultSpeech); // change leader
    }
  });
});

// server running...
server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}..`);
});

