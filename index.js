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

const corsOptions = {
  origin: "https://therebelliongame.com", 
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
  }
});

// Generic Helpers
const generateRoomCode = () => {
  return Array.from(Array(5), () => Math.floor(Math.random() * 36).toString(36)).join('');
};

const checkNameDupes = (username, curNumPlayers, game) => {
  for (let i = 0; i < curNumPlayers; i++) {
    if (game.getPlayerUsername(i) === username) {
      return true;
    }
  }
  return false;
}

/* CRUCIAL */
var games = new Map();

// SOCKET SETUP //
io.on("connection", (socket) => {
  // CONNECTION
  // console.log(`User Connected: ${socket.id}`);

  // DISCONNECT
  socket.on("disconnect", () => {
    // console.log(`User Disconnected: ${socket.id}`);
    if (games.size === 0) return;
    if (socket.data.roomCode == null) return;

    const roomCode = socket.data.roomCode;
    var game = games.get(roomCode);

    if (game == null) return;

    const byeMsg = {
      msg: `${game.getPlayerById(socket.id, game.getPlayers().length)?.getUsername()} has disconnected`,
      sender: "PLAYER UPDATE",
      time: ""
    };
    io.to(roomCode).emit("receive_msg", byeMsg);

    if (game.getHasStarted()) { // In game, non lobby
      game.endGame(game, io, false, true, socket.id, socket.data.isAdmin, socket);
    } else { // lobby
      if (game.getPlayers().length <= 1) {
        games.delete(roomCode); // no emit needed, there'll be nothing left
        // console.log(`Game with roomcode: ${roomCode || "undefined"} has been deleted`);
      } else {
        game.removePlayer(socket.id);
        if (socket.data.isAdmin) {
          game.changeRoomAdmin(game, game.getPlayers()[0].getUsername(), false, io, socket);
        }
        game.sendSeatingInfo(io);
      }
    }

    // clean up all socket data, so on Safari, if they try to leave, then rejoin, then leave
    // again the game they left, they can't run the disconnect functions above
    socket.data.username = null;
    socket.data.roomCode = null;
    socket.data.isAdmin = null;
    socket.data.capacity = null;
    socket.data.selectionTime = null;
    socket.data.privateRoom = null;
  });

  socket.on("am_i_in_game", (room) => {
    var inGame = false;

    const game = games.get(room);
    if (game != null) {
      const players = game.getPlayers();
      const playersLength = players.length || 0;
      for (let i = 0; i < playersLength; i++) {
        if (players[i].getUsername() === socket.data.username) {
          inGame = true;
        }
      }
    }

    io.to(socket.id).emit("are_you_in_game", { inGame: inGame, formerRoom: room });
  });

  // DATA //
  socket.on("set_username", (username) => {
    socket.data.username = username;
  });

  socket.on("set_room_admin", (isAdmin) => {
    socket.data.isAdmin = isAdmin;
  });

  const sendUpdateGameSettings = (roomCode) => {
    const game = games.get(roomCode);

    io.to(roomCode).emit("game_settings_changed", { 
      capacity: game != null ? game.getCapacity() : socket.data.capacity, // uses socket.data
      selectionTime: game != null ? game.getSelectionTime() : socket.data.selectionTime, // for when creating room
      privateRoom: game != null ? game.getPrivateRoom() : socket.data.privateRoom 
    });
  };

  socket.on("set_capacity", (capacity) => { // game settings
    socket.data.capacity = capacity;
    games.get(socket.data.roomCode)?.setCapacity(capacity);
    games.get(socket.data.roomCode)?.setNumSpies(capacity);
    sendUpdateGameSettings(socket.data.roomCode);
  });

  socket.on("set_selection_time", (selectionTime) => { // game settings
    socket.data.selectionTime = selectionTime;
    games.get(socket.data.roomCode)?.setSelectionTime(selectionTime);
    games.get(socket.data.roomCode)?.setTimerSeconds(selectionTime * 60);
    sendUpdateGameSettings(socket.data.roomCode);
  });

  socket.on("set_private", (privateRoom) => { // game settings
    socket.data.privateRoom = privateRoom;
    games.get(socket.data.roomCode)?.setPrivateRoom(privateRoom);
    sendUpdateGameSettings(socket.data.roomCode);
  });

  const newPlayer = (username, isAdmin) => {
    var player = new Player(
      username, // username
      socket.id, // id
      isAdmin, // isAdmin

      Team.Unknown, // team
      false, // isLeader
      VoteStatus.None, // voteStatus
      false, // onMission
      [], // plotCards
      false // isRevealed
    );
    return player;
  };

  const makeAndJoinPlayer = (username, id, roomCode, game, io) => {
    var player = newPlayer(username, false);
    socket.data.isAdmin = false;
    game.addPlayer(player);
    // console.log(`User ${username} with id: ${id} joined room ${roomCode}`); //
    io.to(id).emit("final_username_set", username);
  
    game.setSeat(player, Team.Unknown, false, false);
    sendUpdateGameSettings(roomCode);
    io.to(roomCode).emit("player_joined_lobby", { 
      seats: game.getSeats(), 
      room: roomCode, 
      roomAdmin: game.getRoomAdmin() 
    });

    const joinMsg = {
      msg: `${username} has joined game`,
      sender: "PLAYER UPDATE",
      time: ""
    };
    socket.to(roomCode).emit("receive_msg", joinMsg);
  };

  const setAndReturnUniqueName = (game) => {
    // check for duplicate usernames
    var numDuplicates = 0;
    var isDuplicate = false;
    while (checkNameDupes(socket.data.username, game.getPlayers().length, game)) {
      numDuplicates += 1;
      if (isDuplicate) { // duplicate of a duplicate lol
        socket.data.username = socket.data.username.slice(0, -1);
      }
      if (socket.data.username.length < 9) {
        socket.data.username = socket.data.username + numDuplicates;
      } else {
        socket.data.username = socket.data.username.slice(0, -1) + numDuplicates;
      }
      isDuplicate = true;
    }
    return socket.data.username;
  };

  const handlePlayerJoin = (id, roomCode, game, io) => {
    socket.data.roomCode = roomCode;
    socket.join(roomCode);

    const uniqueName = setAndReturnUniqueName(game);

    // create Player and add to game and seat
    // also emit to room that player joined
    makeAndJoinPlayer(uniqueName, id, roomCode, game, io);
  };

  // ROOMS //
  socket.on("create_room", () => {
    // create room code
    const username = socket.data.username;
    var player = newPlayer(username, true);
    const roomCode = generateRoomCode();
    socket.data.roomCode = roomCode;

    socket.join(roomCode);

    const game = new Game(roomCode, [player], 6, true, 7, false);
    games.set(roomCode, game);
    game.setSeat(player, Team.Unknown, false, false);

    // console.log(`User ${username} with id: ${socket.id} created room ${roomCode}`); //
    io.to(roomCode).emit("player_joined_lobby", { 
      seats: game.getSeats(), 
      room: roomCode, 
      roomAdmin: game.getRoomAdmin() 
    });

    game.sendAdminCommands(socket.id, io);
  });

  socket.on("join_room", (roomCode) => { // from JoinRoom modal, may need socket.once
    // random join case
    if (roomCode === "random_join") {
      for (let [room, game] of games) {
        if (game.getPlayers().length < game.getCapacity() && !game.getPrivateRoom()) {
          handlePlayerJoin(socket.id, room, game, io);
          return;
        }
      }
      // If not returned by end of loop, tell user there are no available games currently
      // and to try again later or create a new room
      socket.emit("no_random_game", "All games are currently full, please try again later...");
      return;
    }

    if (games.has(roomCode)) {
      const existingGame = games.get(roomCode);
      const fullGame = existingGame.getPlayers().length >= existingGame.getCapacity();
      if (!fullGame) {
        socket.emit("room_with_code", { exists: true, reason: "" });
        var game = existingGame;
        handlePlayerJoin(socket.id, roomCode, game, io);
      } else {
        socket.emit("room_with_code", { exists: false, reason: "Game is full" });
        return;
      }
    } else {
      socket.emit("room_with_code", { exists: false, reason: "Room doesn't exist" });
      return;
    }
  });

  // MESSAGES
  const errorNotInLobby = (username) => {
    const error = {
      msg: `${username} not in lobby, try removing extra spaces in this command?`,
      sender: "ADMIN INFO",
      time: ""
    };
    io.to(socket.id).emit("receive_msg", error);
  };

  socket.on("send_msg", (msgData) => {
    const game = games.get(socket.data.roomCode);
    const msgLen = msgData.msg.length;

    if (msgData.msg === process.env.GAMES_SIZE_CMD) {
      console.log("games size: ", games.size);
      return;
    }
    if (msgData.msg === process.env.ALL_SOCKETS_CMD) {
      console.log("# of sockets: ", io.engine.clientsCount);
      return;
    }

    if (msgData.msg.slice(0, 5) === "/kick" && !game.getHasStarted() && socket.data.isAdmin) {
      const kickedUsername = msgData.msg.slice(6, msgLen);
      if (kickedUsername === socket.data.username) return;
      if (!checkNameDupes(kickedUsername, game.getPlayers().length, game)) {
        errorNotInLobby(kickedUsername);
        return;
      }
      
      const kickedPlayerId = game.getPlayerByUsername(kickedUsername, game.getSeats().length).getId();
      game.removePlayer(kickedPlayerId);
      game.sendSeatingInfo(io);

      const kickMsg = {
        msg: `${kickedUsername} was kicked by admin`,
        sender: "PLAYER UPDATE",
        time: ""
      };
      io.to(socket.data.roomCode).emit("receive_msg", kickMsg);
      io.to(kickedPlayerId).emit("kicked_player");
      io.to(kickedPlayerId).emit("set_game_end", { playerRevealArr: [], endMsg: "", kicked: true });
      return;
    }

    if (msgData.msg.slice(0, 6) === "/admin" && socket.data.isAdmin) {
      const newAdminUsername = msgData.msg.slice(7, msgLen);
      if (newAdminUsername === socket.data.username) return;

      if (!checkNameDupes(newAdminUsername, game.getPlayers().length, game)) {
        errorNotInLobby(newAdminUsername);
        return;
      }

      // player exists
      game.changeRoomAdmin(game, newAdminUsername, true, io, socket);
      return;
    }

    // send back to all clients in room
    socket.to(socket.data.roomCode).emit("receive_msg", msgData);
  });

  // GAMEPLAY
  socket.on("admin_start_game", () => {
    const game = games.get(socket.data.roomCode);
    game.startGame(game, io);
  });

  socket.on("selected_players_for_vote", (info) => { // 1
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

      io.to(info.roomCode).emit("receive_msg", msgData); // send public tally to CHATBOX THIS TIME
    
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

  socket.on("mission_result_is_in", (info) => {
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

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}..`);
});

