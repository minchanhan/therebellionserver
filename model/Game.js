const Team = require("../Enums/Team.js");
const MissionResult = require("../Enums/MissionResult.js");

class Game {
  constructor(
    roomCode, 
    roomAdmin, 
    capacity, 
    privateRoom, 
    selectionSecs,
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
    this.selectionSecs = selectionSecs; // int (in seconds)
    this.numGames = numGames; // int

    // game states
    this.hasStarted = hasStarted; // bool
    this.teamSelectHappening = teamSelectHappening; // bool
    this.voteHappening = voteHappening; // bool
    this.missionHappening = missionHappening; // bool

    // game screen
    this.players = players; // arr[Player]

    this.msgList = msgList; // arr[msg]
    
    this.curMission = curMission; // int, the mission game is on *** (gameScreen)
    this.curSelectedPlayers = curSelectedPlayers; // arr[Player]

    this.curVoteTally = curVoteTally; // [arr[approve Player], arr[disapprove Player]] (per vote)
    this.curMissionVoteDisapproves = curMissionVoteDisapproves; // int (gameScreen)

    this.curMissionFails = curMissionFails; // int (per mission)
    this.missionResultTrack = missionResultTrack; // arr[MissionResult (None, Pass, Fail)] (gameScreen)
    
    this.missionHistory = missionHistory; // arr[curSelectedPlayers] (gameScreen)
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

  getSelectionSecs() {
    return this.selectionSecs;
  };
  setSelectionSecs(selectionSecs) {
    this.selectionSecs = selectionSecs;
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
  resetPlayers() {
    for (let i = 0; i < this.players; i++) {
      this.players[i].setTeam(Team.Unknown);
      this.players[i].setIsLeader(false);
      this.players[i].setOnMission(false);
    }
  }
  getPlayerByUsername(username) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].getUsername() === username) {
        return this.players[i];
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
  setCurMission(curMission) {
    this.curMission = curMission;
  }

  getCurSelectedPlayers() {
    return this.curSelectedPlayers;
  };
  setCurSelectedPlayers(curSelectedPlayers) {
    this.curSelectedPlayers = curSelectedPlayers;
  };

  getCurVoteTally() {
    return this.curVoteTally;
  };
  addCurVoteTally(approve, voter) {
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
  setCurMissionFails(curMissionFails) {
    this.curMissionFails = curMissionFails;
  }

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
  setMissionHistory(missionHistory, mission) {
    this.missionHistory[mission] = missionHistory;
  };
  clearMissionHistory() {
    this.missionHistory = [[],[],[],[],[]];
  }

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

  startTimer(io, timerSeconds) {
    let interval = setInterval(() => {
      if (!this.teamSelectHappening) {
        clearInterval(interval);
        return;
      } else {
        if (timerSeconds > 0) {
          timerSeconds = timerSeconds - 1;
        } else {
          var randomSelection = [];
          var randomOrder = [...Array(this.capacity).keys()];
          this.shuffle(randomOrder);
  
          if (this.hasStarted) {
            for (let i = 0; i < this.getMissionTeamSizes()[this.mission - 1]; i++) {
              randomSelection.push(this.players[randomOrder[i]]); // array of Players
            }
            this.handleVote(io, randomSelection, true);
          }
          clearInterval(interval);
        }
        console.log(timerSeconds);
      } 
    }, 1000);
  };

  randomizeTeams() {
    const goodTeamArr = this.fillArray(Team.Good, this.capacity - this.getNumSpies());
    const badTeamArr = this.fillArray(Team.Bad, this.getNumSpies());
    var teamArr = goodTeamArr.concat(badTeamArr);

    this.shuffle(teamArr);
    this.shuffle(this.players);

    for (let i = 0; i < this.capacity; i++) {
      const player = this.players[i];
      player.setTeam(teamArr[i]);
    }
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
    game.handleTeamSelect(game, io, leader.getId());
  };

  /* ===== EMITS TO CLIENT ===== */
  sendGameSettingsChanges (io) {
    io.to(this.roomCode).emit("game_settings_update", {
      roomCode: this.roomCode,
      roomAdminName: this.roomAdmin.getUsername(),
      capacity: this.capacity,
      selectionSecs: this.selectionSecs,
      privateRoom: this.privateRoom,
      numGames: this.numGames,
      missionTeamSizes: this.getMissionTeamSizes(),
    });
  };

  updateChatMsg(io, msgData) {
    this.addMsgList(msgData);
    io.to(this.roomCode).emit("msg_list_update", this.msgList);
  };

  updateSeats(io, gameStart=false, username="", socket=null) {
    // loop through players for info based on team
    var seats = [];
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      seats.push([
        player.getUsername(),
        player.getIsLeader(),
        player.getOnMission(),
        Team.Unknown,
      ]);

      if (gameStart) {
        if (
          player.getUsername() === username 
          || this.getPlayerByUsername(username).getTeam() === Team.Bad
        ) {
          seats[i][3] = player.getTeam();
        }
      }
    };

    if (gameStart) {
      socket.emit("seats_update", seats);
    } else {
      io.to(this.roomCode).emit("seats_update", seats);
    }
  };

  /* ===== GAME LOGIC FUNCTIONS ===== */
  handleTeamSelect(io, leaderIndex) { // 1
    this.teamSelectHappening = true;
    for (let i = 0; i < this.capacity; i++) {
      io.to(this.players[i].getId()).emit(
        "team_select_happening",
        {
          isLeader: i === leaderIndex,
          curMission: this.curMission,
          curMissionVoteDisapproves: this.curMissionVoteDisapproves,
          missionResultTrack: this.missionResultTrack,
          missionHistory: this.missionHistory
        }
      );
    }

    this.startTimer(io, this.selectionSecs);
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
    io.in(room).emit("vote_happening", { selectedPlayers: selectedMembers });
    
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
      io.to(playerId).emit("mission_happening", onMissionTeam);
    }

    game.setCurMissionVoteDisapproves(0); // Reset vote count
    const startMissionSpeech = `The vote has been approved, we begin our mission.
    ${selectedPlayers.slice(0, -1).join(', ')} and ${selectedPlayers.slice(-1)} please
    make a decision, PASS or FAIL. (Rebellion members must pass, spies can choose either). `;
    game.gameMasterSpeech(game, io, startMissionSpeech);
  };

  updateRoomAdmin(io, newAdminUsername, manualTransfer=true, timestamp="") {
    if (manualTransfer) {
      io.to(this.roomAdmin.getId()).emit("is_admin_update", false);
      this.roomAdmin.setIsAdmin(false);
    }

    const newAdmin = this.getPlayerByUsername(newAdminUsername);
    io.to(newAdmin.getId()).emit("is_admin_update", true);
    newAdmin.setIsAdmin(true);
    this.roomAdmin = newAdmin;

    this.sendGameSettingsChanges(io);
    const adminTransferMsg = {
      msg: `${newAdminUsername} has been made admin`,
      sender: "PLAYER UPDATE",
      time: timestamp
    };
    this.updateChatMsg(io, adminTransferMsg);
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

  startGame(io) {
    // start game
    this.setHasStarted(true);
    // randomize teams
    this.randomizeTeams();
    // randomize leader
    const leaderIndex = Math.floor(Math.random() * this.capacity); // range 0 to (cap - 1)
    this.players[leaderIndex].setIsLeader(true);

    // start missions
    this.handleTeamSelect(io, leaderIndex);
  };

  endGame(
    io, 
    win=true, 
    disconnect=false, 
    isAdmin=false, 
  ) {
    this.setHasStarted(false);
    const roomCode = this.roomCode;
    const message = win ? "The Rebellion Wins" : 
                    !disconnect ? "The Spies Win" : 
                    disconnect ? "Game Aborted Due to User Disconnect >:(" :
                    "Game Over";

    if (!disconnect) this.addGameRound();
    
    this.gameMasterSpeech(this, io, message);

    io.to(roomCode).emit("set_game_end", { 
      playerRevealArr: game.getPlayerRevealArr(), 
      endMsg: "Game Over: " + message, 
      kicked: false 
    });

    if (disconnect) {
      if (isAdmin) this.updateRoomAdmin(io, this.getPlayers()[0].getUsername(), "timestamp here");
    }

    this.sendSeatingInfo(io);
  };
}

module.exports = Game;