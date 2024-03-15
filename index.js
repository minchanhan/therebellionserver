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
  console.log(`User Connected: ${socket.id}`); //

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`); //
    if (games.size === 0) return;
    if (socket.data.roomCode == null) return;

    const roomCode = socket.data.roomCode;
    var game = games.get(roomCode);

    if (game == null) return;

    if (game.getHasStarted()) {
      game.endGame(game, io, false, true, socket.id);
    } else {
      if (game.getPlayers().length <= 1) {
        games.delete(roomCode); // no emit needed, there'll be nothing left
      } else {
        game.removePlayer(socket.id); // remove one player
        game.sendSeatingInfo(io);
      }
    }

    console.log("games: ", games); //
  });

  // DATA //
  socket.on("set_username", (username) => {
    socket.data.username = username;
    console.log("username set: ", username);
  });

  socket.on("set_room_admin", (isAdmin) => {
    socket.data.isAdmin = isAdmin;
    console.log("isAdmin set: ", isAdmin);
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
    console.log("capacity set: ", capacity);
    sendUpdateGameSettings(socket.data.roomCode);
  });

  socket.on("set_selection_time", (selectionTime) => { // game settings
    socket.data.selectionTime = selectionTime;
    games.get(socket.data.roomCode)?.setSelectionTime(selectionTime);
    console.log("selection time set: ", selectionTime);
    sendUpdateGameSettings(socket.data.roomCode);
  });

  socket.on("set_private", (privateRoom) => { // game settings
    socket.data.privateRoom = privateRoom;
    games.get(socket.data.roomCode)?.setPrivateRoom(privateRoom);
    console.log("private room set: ", privateRoom);
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
    console.log(`User ${username} with id: ${id} joined room ${roomCode}`); //
    io.to(id).emit("final_username_set", username);
  
    game.setSeat(player, Team.Unknown, false, false);
    sendUpdateGameSettings(roomCode);
    io.to(roomCode).emit("player_joined_lobby", { 
      seats: game.getSeats(), 
      room: roomCode, 
      roomAdmin: game.getRoomAdmin() 
    });
  };

  const setAndReturnUniqueName = (game) => {
    // check for duplicate usernames
    var numDuplicates = 0;
    var isDuplicate = false;
    while (checkNameDupes(socket.data.username, game.getPlayers().length, game)) {
      numDuplicates += 1;
      if (isDuplicate) {
        socket.data.username = socket.data.username.slice(0, -1);
      }
      socket.data.username = socket.data.username + numDuplicates;
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
    if (game.getPlayers().length >= game.getCapacity()) {
      // Reached capacity, START THE GAME
      game.startGame(game, io);
    }
  };

  // ROOMS //
  socket.on("create_room", () => {
    // create room code
    var data = socket.data;
    var player = newPlayer(data.username, true);
    const roomCode = generateRoomCode();
    socket.data.roomCode = roomCode;

    socket.join(roomCode);

    const game = new Game(roomCode, [player], 5, true, 7, false); // default cap = 5, priv = true, selTime = 7
    games.set(roomCode, game);
    game.setSeat(player, Team.Unknown, false, false);

    console.log(`User ${data.username} with id: ${socket.id} created room ${data.roomCode}`); //
    io.to(roomCode).emit("player_joined_lobby", { 
      seats: game.getSeats(), 
      room: data.roomCode, 
      roomAdmin: game.getRoomAdmin() 
    });
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
      if (!games.get(roomCode).getHasStarted()) { // game hasn't started
        socket.emit("room_with_code", { exists: true, reason: "" });
        var game = games.get(roomCode);
        handlePlayerJoin(socket.id, roomCode, game, io);
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
  socket.on("send_msg", (msgData) => {
    // send back to all clients in room
    socket.to(socket.data.roomCode).emit("receive_msg", msgData);
  });

  // GAMEPLAY
  socket.on("selected_players_for_vote", (info) => { // 1
    const game = games.get(info.room);
    game.handleVote(game, io, info.selectedPlayers, info.room);
  });

  socket.on("vote_is_in", (info) => { // 2
    const game = games.get(info.room);
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

      io.to(info.room).emit("receive_msg", msgData); // send public tally to CHATBOX THIS TIME
    
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
    const game = games.get(info.room);
    game.setMissionResult(info.pass);
    const passes = game.getMissionResult()[0];
    const fails = game.getMissionResult()[1];
    const missionTeamSize = game.getMissionTeamSizes()[game.getMission() - 1];

    if (passes + fails === missionTeamSize) { // CHANGE TO NUMBER OF PEOPLE ON MISSIONS
      // announce mission results
      const missionPassed = fails === 0; // unless needs 2 fails to fail
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
      const missionResultSpeech = missionPassed ? `Well done my soliders. We have passed the mission successfully. We have \
      ${3 - game.getMissionPasses()} left before we complete the overthrowing. ` : `This isn't good... we have failed this mission... \
      Just ${3 - game.getMissionFails()} more failed missions and our plans of overthrowing the power is ruined. `;

      io.in(info.room).emit("mission_completed", { 
        mission: game.getMission(), 
        missionResultTrack: game.getMissionResultTrack() 
      });
      game.changeLeader(game, io, missionResultSpeech); // change leader
    }
  });

  // JUST FOR TESTING //
  socket.on("checkGames", () => { // on msg send
    console.log("games looks like: ", games.get(socket.data.roomCode).getPlayers());
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}..`);
});

