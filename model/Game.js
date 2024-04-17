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
    curMissionVoteDisapproves,
    missionResultTrack,
    missionHistory,
    curVoteTally,
    curMissionTally,
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
    
    this.curMission = curMission; // int, the mission game is on (gameScreen)
    this.curMissionVoteDisapproves = curMissionVoteDisapproves; // int (gameScreen)
    this.missionResultTrack = missionResultTrack; // arr[MissionResult (None, Pass, Fail)] (gameScreen)
    this.missionHistory = missionHistory; // arr[selectedPlayers] (gameScreen)

    this.curVoteTally = curVoteTally; // [arr[approve Player], arr[disapprove Player]] (used only in server)
    this.curMissionTally = curMissionTally; // int (used only in server)
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
  getPlayerByUsername(username) {
    for (const player of this.players) {
      if (player.getUsername() === username) {
        return player;
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

  getCurMissionVoteDisapproves() {
    return this.curMissionVoteDisapproves;
  };
  setCurMissionVoteDisapproves(newVal) {
    this.curMissionVoteDisapproves = newVal;
  };

  getMissionResultTrack() {
    return this.missionResultTrack;
  };
  setMissionResultTrack(mission, missionPassed) {
    this.missionResultTrack[mission - 1] = missionPassed ? MissionResult.Pass : MissionResult.Fail;
  };

  getMissionHistory() {
    return this.missionHistory;
  };
  setMissionHistory(mission, missionHistory) {
    this.missionHistory[mission - 1] = missionHistory;
  };

  getCurVoteTally() {
    return this.curVoteTally;
  };
  addCurVoteTally(voter, approve) {
    if (approve) {
      this.curVoteTally[0].push(voter)
    } else {
      this.curVoteTally[1].push(voter);
    }
  };

  getCurMissionTally() {
    return this.curMissionTally;
  };
  addCurMissionTally(pass) {
    if (pass) {
      this.curMissionTally[0] += 1
    } else {
      this.curMissionTally[1] += 1;
    }
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

  getCurSelectedPlayers() {
    var curSelectedPlayers = [];
    for (const player of this.players) {
      if (player.getOnMission()) {
        curSelectedPlayers.push(player.getUsername());
      }
    }
    console.log(curSelectedPlayers);
    return curSelectedPlayers;
  };

  getMissionPasses() {
    var passes = 0;
    for (const result of this.missionResultTrack) {
      if (result === MissionResult.Pass) {
        passes += 1;
      }
    }
    return passes;
  };
  getMissionFails() {
    var fails = 0;
    for (const result of this.missionResultTrack) {
      if (result === MissionResult.Fail) {
        fails += 1;
      }
    }
    return fails;
  };

  getPlayerRevealArr() {
    var reveal = [];
    for (const player of this.players) {
      const msg = player.getTeam() === Team.Bad ? "a Spy" : "on The Rebellion";
      reveal.push(`${player.getUsername()} was ${msg}`);
    }
    return reveal;
  };
  
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
      sender: "GAME MASTER",
      time: timestamp
    };
    this.updateChatMsg(io, adminTransferMsg);
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
          this.handleTeamSelect(io, this.changeAndGetNewLeader().getUsername());
          clearInterval(interval);
        }
      } 
    }, 1000);
  };

  randomizeTeams() {
    const goodTeamArr = this.fillArray(Team.Good, this.capacity - this.getNumSpies());
    const badTeamArr = this.fillArray(Team.Bad, this.getNumSpies());
    var teamArr = goodTeamArr.concat(badTeamArr);

    this.shuffle(teamArr);
    this.shuffle(this.players);

    for (let i = 0; i < this.players.length; i++) {
      this.players[i].setTeam(teamArr[i]);
    }
  };

  changeAndGetNewLeader() {
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      if (player.getIsLeader()) {
        player.setIsLeader(false);
        if ((i+1) === this.players.length) {
          this.players[0].setIsLeader(true);
          return this.players[0];
        } else {
          this.players[i+1].setIsLeader(true);
          return this.players[i+1];
        }
      }
    }
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

  sendGameMasterMsg(io, msg) {
    const msgData = {
      msg: msg,
      sender: "GAME MASTER",
      time: `Game ${this.numGames}, Mission ${this.curMission}, Team ${this.curMissionVoteDisapproves + 1}`
    };
    this.updateChatMsg(io, msgData);
  };

  /* ===== GAME LOGIC FUNCTIONS ===== */
  handleTeamSelect(io, leaderUsername) {
    this.teamSelectHappening = true;
    this.voteHappening = false;
    this.missionHappening = false;
    this.curVoteTally = [[],[]];
    this.curMissionTally = [0,0];
    for (const player of this.players) { // reset on mission
      player.setOnMission(false);
    }

    for (const player of this.players) {
      io.to(player.getId()).emit(
        "team_select_happening",
        {
          isLeader: player.getUsername() === leaderUsername,
          leaderUsername: leaderUsername,
          curMission: this.curMission,
          curMissionVoteDisapproves: this.curMissionVoteDisapproves,
          missionResultTrack: this.missionResultTrack,
          missionHistory: this.missionHistory
        }
      );
    }

    this.sendGameMasterMsg(io, `${leaderUsername} is selecting team for mission`);
    this.startTimer(io, this.selectionSecs);
  };

  handleVote(io, selectedPlayers) {
    this.teamSelectHappening = false;
    this.voteHappening = true;

    for (const player of this.players) { // assigns onMission to Players
      player.setOnMission(selectedPlayers.includes(player.getUsername()));
    }

    this.sendGameMasterMsg(io, `Approve or disapprove ${selectedPlayers.join(", ")} for this mission`);

    io.to(this.roomCode).emit("vote_happening", {
      selectedPlayers: selectedPlayers
    });
  };

  handleVoteEntries(io, voter, approve) {
    this.addCurVoteTally(voter, approve);

    const approvals = this.curVoteTally[0].length;
    const disapprovals = this.curVoteTally[1].length;

    if ((approvals + disapprovals) === this.capacity) {
      const voteApproved = (approvals - disapprovals) > 0;

      const voteResultMsg = `${approvals > 0 ? this.curVoteTally[0].join(', ') : "Nobody"} approved the team.
      ${disapprovals > 0 ? this.curVoteTally[1].join(', ') : "Nobody"} disapproved the team.`;
      this.sendGameMasterMsg(io, voteResultMsg);
    
      if (voteApproved) {
        this.handleMission(io);
      } else {
        this.curMissionVoteDisapproves += 1;

        if (this.curMissionVoteDisapproves > 4) {
          this.endGame(io, false);
          return;
        }

        this.handleTeamSelect(io, this.changeAndGetNewLeader().getUsername());
      }
      return;
    }
  }

  handleMission(io) {
    this.curMissionVoteDisapproves = 0;
    this.voteHappening = false;
    this.missionHappening = true;

    // send pass/fail action to players onMissionTeam
    for (const player of this.players) { 
      io.to(player.getId()).emit("mission_happening", player.getOnMission());
    }

    const selectedPlayers = this.getCurSelectedPlayers();
    const startMissionSpeech = `The mission team has been approved,
    ${selectedPlayers.slice(0, -1).join(', ')} and ${selectedPlayers.slice(-1)} please
    choose PASS or FAIL. (Rebellion members must pass, spies can choose either).`;
    this.sendGameMasterMsg(io, startMissionSpeech);
  };

  handleMissionEntries(io, pass) {
    this.addCurMissionTally(pass)

    const passes = this.curMissionTally[0];
    const fails = this.curMissionTally[1];
    const missionTeamSize = this.getMissionTeamSizes()[(this.curMission - 1)];

    console.log("passes: ", passes);
    console.log("fails: ", fails);
    console.log(missionTeamSize);

    if (passes + fails === missionTeamSize) {
      const missionResult = this.capacity >= 7 && this.curMission === 4 ? fails < 2 : fails === 0;
      this.setMissionResultTrack(this.curMission, missionResult);
      this.setMissionHistory(this.curMission, this.getCurSelectedPlayers());

      if (this.getMissionPasses() === 3) {
        this.endGame(io, true);
        return;
      } else if (this.getMissionFails() === 3) {
        this.endGame(io, false);
        return;
      }

      // game proceeds otherwise
      this.curMission += 1;
      this.handleTeamSelect(io, this.changeAndGetNewLeader().getUsername());
    }
  }

  startGame(io) {
    // start game
    this.setHasStarted(true);
    // randomize teams
    this.randomizeTeams();
    // randomize leader
    const leaderIndex = Math.floor(Math.random() * this.capacity); // range 0 to (cap - 1)
    const leader = this.players[leaderIndex];
    leader.setIsLeader(true);

    // start missions
    this.handleTeamSelect(io, leader.getUsername());
  };

  endGame(
    io, 
    win=true, 
    disconnect=false,
  ) {
    const message = win ? "The Rebellion Wins" : 
                    !disconnect ? "The Spies Win" : 
                    disconnect ? "Game Aborted Due to User Disconnect >:(" :
                    "Game Over";

    

    this.setHasStarted(false);
    this.numGames += 1;
    this.curMission = 1;
    this.curMissionVoteDisapproves = 0;
    this.missionResultTrack = [
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None
    ];
    this.missionHistory = [[],[],[],[],[]];
    for (const player of this.players) {
      player.setTeam(Team.Unknown);
      player.setIsLeader(false);
      player.setOnMission(false);
    }
    this.updateSeats(io);
    
    io.to(this.roomCode).emit("set_game_end", { 
      playerRevealArr: this.getPlayerRevealArr(), 
      endMsg: "Game Over: " + message, 
    });
  };
}

module.exports = Game;