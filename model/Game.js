const Team = require("../Enums/Team.js");
const MissionResult = require("../Enums/MissionResult.js");

class Game {
  constructor(
    roomCode, 
    roomAdmin, 
    capacity, 
    privateRoom, 
    selectionTimeSecs,
    numGames,
    hasStarted, 
    teamSelectHappening,
    voteHappening,
    missionHappening,
    players,
    msgList,
    curMission,
    curSelectedPlayers,
    curVoteTally,
    curMissionVoteDisapproves,
    curMissionFails,
    missionResultTrack,
    missionHistory,
  ) {
    // game settings
    this.roomCode = roomCode; // string
    this.roomAdmin = roomAdmin; // Player
    this.capacity = capacity; // int
    this.privateRoom = privateRoom; // bool
    this.selectionTimeSecs = selectionTimeSecs; // int (in seconds)
    this.numGames = numGames; // int

    // game states
    this.hasStarted = hasStarted; // bool
    this.teamSelectHappening = teamSelectHappening; // bool
    this.voteHappening = voteHappening; // bool
    this.missionHappening = missionHappening; // bool

    // game screen
    this.players = players; // arr[Player]

    this.msgList = msgList; // arr[msg]
    
    this.curMission = curMission; // int, the mission/round game is on ***
    this.curSelectedPlayers = curSelectedPlayers; // arr[Player]

    this.curVoteTally = curVoteTally; // [arr[approve Player], arr[disapprove Player]]
    this.curMissionVoteDisapproves = curMissionVoteDisapproves; // int

    this.curMissionFails = curMissionFails; // int
    this.missionResultTrack = missionResultTrack; // arr[MissionResult (None, Pass, Fail)]
    
    this.missionHistory = missionHistory; // arr[[curSelectedPlayers, curVoteTally]]
  };

  /* ===== PROPERTIES ===== */
  getRoomCode() {
    return this.roomCode;
  };
  setRoomCode(roomCode) {
    this.roomCode = roomCode;
  };

  getRoomAdmin() {
    return this.roomAdmin;
  };
  setRoomAdmin(roomAdmin) {
    this.roomAdmin = roomAdmin;
  };

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

  getSelectionTimeSecs() {
    return this.selectionTimeSecs;
  };
  setSelectionTimeSecs(selectionTimeSecs) {
    this.selectionTimeSecs = selectionTimeSecs;
  };

  getNumGames() {
    return this.numGames;
  };
  setNumGames(numGames) {
    this.numGames = numGames;
  };

  getHasStarted() {
    return this.hasStarted;
  };
  setHasStarted(hasStarted) {
    this.hasStarted = hasStarted;
  };

  getTeamSelectHappening() {
    return this.teamSelectHappening;
  };
  setTeamSelectHappening(teamSelectHappening) {
    this.teamSelectHappening = teamSelectHappening;
  };

  getVoteHappening() {
    return this.voteHappening;
  };
  setVoteHappening(voteHappening) {
    this.voteHappening = voteHappening;
  };

  getMissionHappening() {
    return this.missionHappening;
  };
  setMissionHappening(missionHappening) {
    this.missionHappening = missionHappening;
  };

  getPlayers() {
    return this.players;
  };
  setPlayers(players) {
    this.players = players;
  };
  addPlayer(player) {
    this.players.push(player);
  };
  removePlayer(username) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].getUsername() === username) {
        this.players.splice(i, 1);
        return;
      }
    }
  }


  getMsgList() {
    return this.msgList;
  };
  setMsgList(msgList) {
    this.msgList = msgList;
  };
  addMsgList(msg) {
    this.msgList.push(msg);
  };

  getCurMission() {
    return this.curMission;
  };
  addCurMission() {
    this.curMission += 1;
  };
  resetCurMission() {
    this.curMission = 1;
  };

  getCurSelectedPlayers() {
    return this.curSelectedPlayers;
  };
  setCurSelectedPlayers(curSelectedPlayers) {
    this.curSelectedPlayers = curSelectedPlayers;
  };

  getCurVoteTally() {
    return this.curVoteTally;
  };
  setCurVoteTally(approve, voter) {
    approve ? this.curVoteTally[0].push(voter) : this.curVoteTally[1].push(voter);
  };
  clearCurVoteTally() {
    this.curVoteTally = [[], []];
  };

  getCurMissionVoteDisapproves() {
    return this.curMissionVoteDisapproves;
  };
  setCurMissionVoteDisapproves(newVal) {
    this.curMissionVoteDisapproves = newVal;
  };

  getCurMissionFails() {
    return this.curMissionFails;
  };
  addCurMissionFails() {
    this.curMissionFails += 1;
  };
  clearCurMissionFails() {
    this.curMissionFails = 0;
  };

  getMissionResultTrack() {
    return this.missionResultTrack;
  };
  setMissionResultTrack(mission, missionPassed) {
    this.missionResultTrack[mission - 1] = missionPassed ? MissionResult.Pass : MissionResult.Fail;
  };
  clearMissionResultTrack() {
    this.missionResultTrack = [
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None
    ];
  };

  getMissionHistory() {
    return this.missionHistory;
  };
  setMissionHistory(missionHistory) {
    this.missionHistory = missionHistory;
  };

  
  /* ===== OTHER GETTERS & SETTERS ===== */
  getNumSpies() {
    return this.capacity < 7 ? 2 
    : this.capacity < 10 ? 3 
    : 4;
  };

  getMissionTeamSizes() {
    const missionTeamSize1 = this.capacity <= 7 ? 2 : 3;
    const missionTeamSize2 = this.capacity <= 7 ? 3 : 4;
    const missionTeamSize3 = this.capacity === 5 ? 2 : (this.capacity === 7) ? 3 : 4;
    const missionTeamSize4 = this.capacity <= 6 ? 3 : (this.capacity === 7) ? 4 : 5;
    const missionTeamSize5 = this.capacity === 5 ? 3 : (this.capacity <= 7) ? 4 : 5;
    return [missionTeamSize1, missionTeamSize2, missionTeamSize3, missionTeamSize4, missionTeamSize5];
  };

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
  
  /* ===== HELPER FUNCTIONS ===== */
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

  startTimer(io) {
    let interval = setInterval(() => {
      if (this.leaderSelectedTeam) {
        clearInterval(interval);
        return;
      } else {
        if (this.timerSeconds > 0) {
          this.timerSeconds = this.timerSeconds - 1;
        } else {
          var randomSelection = [];
          var randomOrder = [...Array(this.capacity).keys()];
          this.shuffle(randomOrder);
  
          if (this.hasStarted) {
            for (let i = 0; i < this.missionTeamSizes[this.mission - 1]; i++) {
              randomSelection.push(this.players[randomOrder[i]]?.getUsername());
            }
    
            this.handleVote(this, io, randomSelection, this.roomCode, true);
          }
          clearInterval(interval);
        }
      } 
    }, 1000);
  };

  /* ===== EMITS TO CLIENT ===== */
  updateSeats(io) {
    // loop through players for info based on team
    var seats = [];
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      const playerTeam = player.getTeam();
      seats.push([
        player.getUsername(),
        player.getIsLeader(),
        player.getOnMission(),
        Team.Unknown,
      ]);
      if (playerTeam === Team.Bad) seats[i][3] = player.getTeam();
    };

    io.to(this.roomCode).emit("seats_update", seats);
  };

  updateChatMsg(io, msgData) {
    this.addMsgList(msgData);
    io.to(this.roomCode).emit("msg_list_update", this.msgList);
  };

  sendGameSettingsChanges (io) {
    io.to(this.roomCode).emit("game_settings_update", {
      roomCode: this.roomCode,
      roomAdminName: this.roomAdmin.getUsername(),
      capacity: this.capacity,
      selectionTimeSecs: this.selectionTimeSecs,
      privateRoom: this.privateRoom,
      numGames: this.numGames,
      missionTeamSizes: this.getMissionTeamSizes(),
    });
  };

  /* ===== GAME LOGIC FUNCTIONS ===== */
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
      this.addPlayerRevealArr([
        `${player.getUsername()} was ${player.getTeam() === "badTeam" ? "an evil spy" : "part of the rebellion"}`,
        player.getTeam()
      ]);
    }
  };

  letLeaderSelect(game, io, leaderId) { // 1
    game.setLeaderSelectedTeam(false);
    game.setTimerSeconds(game.getSelectionTimeSecs());
    for (let i = 0; i < game.getCapacity(); i++) {
      var playerId = game.getPlayers()[i].getId();
      io.to(playerId).emit("leader_is_selecting", { isSelecting: playerId === leaderId, secs: game.getSelectionTimeSecs()});
    }

    game.startTimer(io);
  };

  handleVote(game, io, selectedMembers, room, random=false) { // 2
    const cap = game.getCapacity();
    var seats = game.getSeats();

    for (let i = 0; i < cap; i++) { // assigns onMission to seats
      if (selectedMembers.includes(seats[i][0])) {
        seats[i][3] = true;
      } else {
        seats[i][3] = false;
      }
    }

    game.sendSeatingInfo(io);
    io.in(room).emit("vote_on_these_players", { selectedPlayers: selectedMembers });
    
    // send out msg
    const speech = !random ? `Very well, soldiers, please approve or disapprove ${selectedMembers.join(', ')} carrying \
    out mission ${game.mission}. ` : `Tsk tsk indecisive.. Allow me to randomly suggest members for this mission then. \
    Please approve or disapprove ${selectedMembers.join(', ')} for mission ${game.mission}. `;
    
    game.gameMasterSpeech(game, io, speech);
  };

  handleMission(game, io, selectedPlayers) { // 3
    const cap = game.getCapacity();
    var seats = game.getSeats();

    for (let i = 0; i < cap; i++) { // send pass/fail action to players onMissionTeam
      const onMissionTeam = seats[i][3];
      var playerId = game.getPlayers()[i].getId();
      io.to(playerId).emit("go_on_mission", onMissionTeam);
    }

    game.setCurMissionVoteDisapproves(0); // Reset vote count
    const startMissionSpeech = `The vote has been approved, we begin our mission.
    ${selectedPlayers.slice(0, -1).join(', ')} and ${selectedPlayers.slice(-1)} please
    make a decision, PASS or FAIL. (Rebellion members must pass, spies can choose either). `;
    game.gameMasterSpeech(game, io, startMissionSpeech);
  };

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
      sender: "PLAYER UPDATE",
      time: ""
    };
    io.to(socket.data.roomCode).emit("msg_list_update", adminTransferMsg);
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
  };

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
    game.randomizeSeatAndTeam();
    game.sendSeatingInfo(io);

    // randomize leader
    var leaderIndex = Math.floor(Math.random() * capacity); // range 0 to (cap - 1)
    game.setLeaderIndex(leaderIndex);
    
    var leader = game.getPlayers()[leaderIndex];
    game.setLeader(leader, leaderIndex, true); // also changes this.seats
    game.sendSeatingInfo(io);

    // start missions
    const welcomeMsg = `Welcome to the rebellion.
    We need 3 mission successes to overthrow the capital. However, there are ${game.getNumSpies()} spies among us,
    please be aware. We start our first mission. ${leader.getUsername()} will be the leader.
    ${leader.getUsername()}, choose ${game.getMissionTeamSizes()[game.getMission() - 1]} members for mission ${game.getMission()}. `;
    game.gameMasterSpeech(game, io, welcomeMsg);

    const randomizeMsg = {
      msg: "Teams & seats have been randomized",
      sender: "PLAYER UPDATE",
      time: ""
    };
    io.to(game.getRoomCode()).emit("msg_list_update", randomizeMsg);
    // set timer
    // give leader powers, assign it the start
    game.letLeaderSelect(game, io, leader.getId());
  };

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
    const message = win ? "The Rebellion Wins" : 
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