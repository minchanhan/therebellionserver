const Team = require("../Enums/Team.js");
const MissionResult = require("../Enums/MissionResult.js");

class Game {
  constructor(roomCode, players, capacity, privateRoom, selectionTime, hasStarted) {
    this.roomCode = roomCode; // string
    this.players = players; // arr[Player]

    // room settings
    this.capacity = capacity // int
    this.privateRoom = privateRoom; // bool
    this.selectionTime = selectionTime // int
    this.hasStarted = hasStarted // bool

    // game logic
    this.leaderIndex = 0; // int, to help Game helpers
    this.mission = 1; // int, the mission/round game is on ***
    this.curVoteTally = [[], []]; // [arr[username], arr[username]] *** [approvers[], disapprovers[]]
    this.missionResult = [0, 0]; // [int: passes, int: fails] ***
    this.seats = []; // arr[[player.username, team, isLeader, onMission]]
    this.numSpies = this.capacity < 7 ? 2 
                    : this.capacity < 10 ? 3 
                    : 4; // int, relies on capacity
    this.missionPasses = 0; // int ***
    this.missionFails = 0; // int ***
    this.missionTeamSizes = []; // arr[int]

    this.curMissionVoteDisapproves = 0; // int, ***
    this.missionResultTrack = [ // ***
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None
    ];
    this.gameRound = 1;
    this.playerRevealArr = [];
    // *** means reset before action
  };

  /* Properties */
  getRoomCode() {
    return this.roomCode;
  }

  addPlayer(player) {
    this.players.push(player);
  };
  removePlayer(removedId) { // to be used if player leaves waiting lobby
    for (let i = 0; i < this.players.length; i++) {
      if (this.getPlayerId(i) === removedId) {
        this.players.splice(i, 1);
        this.seats.splice(i, 1);
      }
    }
  }
  getPlayers() {
    return this.players;
  };
  getPlayerId(index) {
    return this.players[index].getId();
  }
  getPlayerUsername(index) {
    return this.players[index].getUsername();
  }
  getPlayerByUsername(username, numPlayers) {
    for (let i = 0; i < numPlayers; i++) {
      if (this.getPlayerUsername(i) === username) {
        return this.getPlayers()[i];
      }
    }
  }
  getPlayerTeam(index) {
    return this.players[index].getTeam();
  }
  setPlayerTeam(team, index) {
    this.players[index].setTeam(team);
  }

  setLeader(leader, leaderIndex, isLeader) { // seat change
    leader.setIsLeader(isLeader);
    for (let i = 0; i < this.capacity; i++) {
      if (i === leaderIndex) {
        this.seats[i][2] = true;
      } else {
        this.seats[i][2] = false;
      }
    }
  }

  getCapacity() {
    return this.capacity;
  };
  setCapacity(capacity) {
    this.capacity = capacity;
  };

  getPrivateRoom() {
    return this.privateRoom;
  };
  setPrivateRoom(privateRoom) {
    this.privateRoom = privateRoom;
  };

  getSelectionTime() {
    return this.selectionTime;
  };
  setSelectionTime(selectionTime) {
    this.selectionTime = selectionTime;
  }

  getHasStarted() {
    return this.hasStarted;
  };
  setHasStarted(hasStarted) {
    this.hasStarted = hasStarted;
  };

  getLeaderIndex() {
    return this.leaderIndex;
  }
  setLeaderIndex(newLeaderIndex) {
    this.leaderIndex = newLeaderIndex;
  }
  changeLeaderIndex() {
    if ((this.leaderIndex + 1) === this.capacity) {
      this.leaderIndex = 0;
    } else {
      this.leaderIndex += 1;
    }
  }

  getMission() {
    return this.mission;
  }
  addMission() {
    this.mission += 1;
  }
  resetMission() {
    this.mission = 1;
  }

  getCurVoteTally() {
    return this.curVoteTally;
  }
  setCurVoteTally(approve, voter) {
    approve ? this.curVoteTally[0].push(voter) : this.curVoteTally[1].push(voter);
  }
  clearCurVoteTally() {
    this.curVoteTally = [[], []];
  }

  getMissionResult() {
    return this.missionResult;
  }
  setMissionResult(pass) {
    pass ? this.missionResult[0] += 1 : this.missionResult[1] += 1;
  }
  clearMissionResult() {
    this.missionResult = [0, 0];
  }

  clearOnMission() { // seat change
    for (let i = 0; i < this.capacity; i++) {
      this.seats[i][3] = false;
    }
  }

  getSeats() {
    return this.seats;
  }
  setSeat(player, team, isLeader, onMission) { // username and team only (ADDS SEAT, DOESN'T ALTER IT)
    this.seats.push([player.getUsername(), team, isLeader, onMission]); // keeps order of players with team
  }
  clearSeats() {
    this.seats = [];
  }

  getNumSpies() {
    return this.numSpies;
  }
  setNumSpies(capacity) {
    this.numSpies = capacity < 7 ? 2 
                    : capacity < 10 ? 3 
                    : 4;
  }

  getMissionPasses() {
    return this.missionPasses;
  }
  addMissionPasses() {
    this.missionPasses += 1;
  }
  clearMissionPasses() {
    this.missionPasses = 0;
  }

  getMissionFails() {
    return this.missionFails;
  }
  addMissionFails() {
    this.missionFails += 1;
  }
  clearMissionFails() {
    this.missionFails = 0;
  }

  getMissionTeamSizes() {
    return this.missionTeamSizes;
  }
  setMissionTeamSizes(missionTeamSizes) {
    this.missionTeamSizes = missionTeamSizes;
  }

  getCurMissionVoteDisapproves() {
    return this.curMissionVoteDisapproves;
  }
  setCurMissionVoteDisapproves(newVal) {
    this.curMissionVoteDisapproves = newVal;
  }

  getMissionResultTrack() {
    return this.missionResultTrack;
  }
  setMissionResultTrack(mission, missionPassed) {
    this.missionResultTrack[mission - 1] = missionPassed ? MissionResult.Pass : MissionResult.Fail;
  }
  clearMissionResultTrack() {
    this.missionResultTrack = [
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None
    ];
  }

  getGameRound() {
    return this.gameRound;
  }
  addGameRound() {
    this.gameRound += 1;
  }

  getPlayerRevealArr() {
    return this.playerRevealArr;
  }
  addPlayerRevealArr(line) {
    this.playerRevealArr.push(line);
  }
  clearPlayerRevealArr() {
    this.playerRevealArr = [];
  }
  
  /* Helpers */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
  };

  fillArray(value, len) {
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(value);
    }
    return arr;
  };

  getRoomAdmin() {
    const players = this.getPlayers();
    for (let i = 0; i < players.length; i++) {
      if (players[i].getIsAdmin()) {
        return players[i].getUsername();
      }
    }
  }

  /* Game Logic */
  randomizeSeatAndTeam() {
    this.clearSeats();
    this.clearPlayerRevealArr();
    const goodTeamArr = this.fillArray(Team.Good, this.getCapacity() - this.getNumSpies());
    const badTeamArr = this.fillArray(Team.Bad, this.getNumSpies());
    var teamArr = goodTeamArr.concat(badTeamArr);
    this.shuffle(teamArr);
    this.shuffle(this.getPlayers());

    for (let i = 0; i < this.getCapacity(); i++) {
      const player = this.getPlayers()[i];
      this.setPlayerTeam(teamArr[i], i);
      this.setSeat(player, teamArr[i], false, false);
      this.addPlayerRevealArr(`${player.getUsername()} was ${player.getTeam() === "badTeam" ? "an evil spy" : "part of the rebellion"}`);
    }
  };

  sendSeatingInfo(io) {
    const seats = this.getSeats();
    const numPlayers = seats.length;

    var coveredSeats = JSON.parse(JSON.stringify(seats)); // deep copy of seats, team will be covered
    for (let i = 0; i < numPlayers; i++) {
      coveredSeats[i][1] = Team.Unknown;
    }

    for (let i = 0; i < numPlayers; i++) {
      const player = this.getPlayerByUsername(seats[i][0], numPlayers);
      if (player.getTeam() === Team.Bad) {
        io.to(player.getId()).emit("seats_info_share", seats);
      } else {
        io.to(player.getId()).emit("seats_info_share", coveredSeats);
      }
    }
  };

  gameMasterSpeech(game, io, speech) {
    io.to(game.getRoomCode()).emit("game_master_speech", speech);
  };

  letLeaderSelect(game, io, leaderId) {
    for (let i = 0; i < game.getCapacity(); i++) {
      var playerId = game.getPlayers()[i].getId();
      io.to(playerId).emit("leader_is_selecting", playerId === leaderId);
    }
  };

  handleVote(game, io, selectedMembers, room) {
    const cap = game.getCapacity();
    var seats = game.getSeats();

    for (let i = 0; i < cap; i++) { // assigns onMission to seats
      if (selectedMembers.includes(seats[i][0])) {
        seats[i][3] = true;
      } else {
        seats[i][3] = false;
      }
    }

    game.sendSeatingInfo(io)
    io.in(room).emit("vote_on_these_players", { selectedPlayers: selectedMembers });
    
    // send out msg
    const speech = `Very well, soldiers, please approve or disapprove ${selectedMembers.join(', ')} carrying \
    out mission ${game.mission}. `;
    game.gameMasterSpeech(game, io, speech);
  };

  handleMission(game, io, selectedPlayers) {
    const cap = game.getCapacity();
    var seats = game.getSeats();

    for (let i = 0; i < cap; i++) { // send pass/fail action to players onMissionTeam
      const onMissionTeam = seats[i][3];
      var playerId = game.getPlayers()[i].getId();
      io.to(playerId).emit("go_on_mission", onMissionTeam);
    }

    game.setCurMissionVoteDisapproves(0); // Reset vote count
    const startMissionSpeech = `The vote has been approved, we begin our mission now.
    ${selectedPlayers.slice(0, -1).join(', ')} and ${selectedPlayers.slice(-1)} please
    make a decision, PASS or FAIL this mission. (Resistance members must choose pass...). `;
    game.gameMasterSpeech(game, io, startMissionSpeech);
  }

  // change leader
  changeLeader(game, io, resultSpeech) {
    // clean
    game.clearMissionResult();
    game.clearCurVoteTally();
    game.changeLeaderIndex(); // changes leader index
    game.clearOnMission(); // clears everyone's onMission in this.seats

    var leader = game.getPlayers()[game.getLeaderIndex()];
    game.setLeader(leader, game.getLeaderIndex(), true); // also changes everyone's isLeader in this.seats
    game.sendSeatingInfo(io); // new seating info
    io.to(game.getRoomCode()).emit("vote_track", game.getCurMissionVoteDisapproves());

    const newLeaderSpeech = `We proceed. The new leader is ${leader.getUsername()}. \
    ${leader.getUsername()}, please choose ${game.getMissionTeamSizes()[game.getMission() - 1]} members for mission ${game.getMission()}. `;

    game.gameMasterSpeech(game, io, resultSpeech + newLeaderSpeech);
    game.letLeaderSelect(game, io, leader.getId());
  };

  resetGameStates(game) {
    game.resetMission();
    game.clearCurVoteTally();
    game.clearMissionResult();
    game.clearOnMission(); // clears everyone's onMission in this.seats
    // isLeader is properly set start of game
    game.clearMissionPasses();
    game.clearMissionFails();
    // curMissionVoteDisapproves is set to 0 at start of vote
    game.clearMissionResultTrack();
  }

  startGame(game, io) {
    if (game.getGameRound() > 1) game.resetGameStates(game, io);
    // start game
    game.setHasStarted(true);

    // set mission team sizes
    const capacity = game.getCapacity();
    const teamSize1 = capacity <= 7 ? 2 : 3;
    const teamSize2 = capacity <= 7 ? 3 : 4;
    const teamSize3 = capacity === 5 ? 2 : (capacity === 7) ? 3 : 4;
    const teamSize4 = capacity <= 6 ? 3 : (capacity === 7) ? 4 : 5;
    const teamSize5 = capacity === 5 ? 3 : (capacity <= 7) ? 4 : 5;
    game.setMissionTeamSizes([teamSize1, teamSize2, teamSize3, teamSize4, teamSize5]);

    // randomize teams
    console.log("Game is starting, about to randomize seat and teams"); //
    game.randomizeSeatAndTeam();
    game.sendSeatingInfo(io);

    // randomize leader
    var leaderIndex = Math.floor(Math.random() * capacity); // range 0 to (cap - 1)
    game.setLeaderIndex(leaderIndex);
    
    var leader = game.getPlayers()[leaderIndex];
    game.setLeader(leader, leaderIndex, true); // also changes this.seats
    game.sendSeatingInfo(io);

    // start missions
    const welcomeMsg = `Welcome soldiers, thank you for joining the resistance. \
    We need 3 missions successes to overthrow the capital. However, I am aware of ${game.getNumSpies()} spies among us... \

    We start our first mission. ${leader.getUsername()} will be the leader. \
    ${leader.getUsername()}, choose ${game.getMissionTeamSizes()[game.getMission() - 1]} members for mission ${game.getMission()}`;
    game.gameMasterSpeech(game, io, welcomeMsg);
    // set timer
    // give leader powers, assign it the start
    game.letLeaderSelect(game, io, leader.getId());
  };

  sendAdminCommands (id, io) {
    const msgData = {
      msg: `Admins can kick players using \`/kick <username>\`
      
      Admins can transfer admin duties using \`/admin <username>\``,
      sender: "THE UNIVERSE",
      time: ""
    };

    io.to(id).emit("receive_msg", msgData); // send to CHATBOX
  }

  changeRoomAdmin(game, newAdminUsername, manualTransfer=true, io, socket) {
    if (manualTransfer) game.getPlayerByUsername(socket.data.username, game.getSeats().length).setIsAdmin(false);
    const newAdmin = game.getPlayerByUsername(newAdminUsername, game.getSeats().length);
    newAdmin.setIsAdmin(true);

    for (let i = 0; i < game.getPlayers().length; i++) {
      const plrId = game.getPlayers()[i].getId();
      io.to(plrId).emit("room_admin_changed", {
        isAdmin: plrId === newAdmin.getId(), 
        adminName: newAdminUsername
      });
    }

    game.sendAdminCommands(newAdmin.getId(), io);
    const adminTransferMsg = {
      msg: `${newAdminUsername} has been made admin`,
      sender: "THE UNIVERSE",
      time: ""
    };
    io.to(socket.data.roomCode).emit("receive_msg", adminTransferMsg);
  }

  endGame(
    game, 
    io, 
    win=true, 
    disconnect=false, 
    disconnectedPlayerId="", 
    isAdmin=false, 
    socket=null
  ) {
    game.setHasStarted(false);
    const roomCode = game.getRoomCode();
    const message = win ? "The Resistance Wins" : 
                    !disconnect ? "The Spies Win" : 
                    disconnect ? "Game Aborted Due to User Disconnect >:(" :
                    "Game Over";

    if (!disconnect) game.addGameRound();
    
    game.gameMasterSpeech(game, io, message);

    io.to(roomCode).emit("set_game_end", { 
      playerRevealArr: game.getPlayerRevealArr(), 
      endMsg: "Game Over: " + message, 
      kicked: false 
    });

    if (disconnect) {
      game.removePlayer(disconnectedPlayerId); // remove one player
      if (isAdmin) game.changeRoomAdmin(game, game.getPlayers()[0].getUsername(), false, io, socket);
    }

    game.sendSeatingInfo(io);
  };
}

module.exports = Game;