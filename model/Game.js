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
    this.mission = 1; // int, the mission/round game is on
    this.curVoteTally = [[], []]; // [arr[username], arr[username]] *** [approvers[], disapprovers[]]
    this.missionResult = [0, 0]; // [int: passes, int: fails] ***
    this.seats = []; // arr[[player.username, team, isLeader, onMission]]
    this.numSpies = this.capacity < 7 ? 2 :
                      this.capacity < 10 ? 3 : 4;
    this.missionPasses = 0; // int
    this.missionFails = 0; // int
    this.missionTeamSizes = []; // arr[int]

    this.curMissionVoteDisapproves = 0; // int, ***
    this.missionResultTrack = [
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None, 
      MissionResult.None
    ];
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
  getPlayerByUsername(username, cap) {
    for (let i = 0; i < cap; i++) {
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

  getPrivateRoom() {
    return this.privateRoom;
  }

  getSelectionTime() {
    return this.selectionTime;
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
  setNumSpies(numSpies) {
    this.numSpies = numSpies;
  }

  getMissionPasses() {
    return this.missionPasses;
  }
  addMissionPasses() {
    this.missionPasses += 1;
  }

  getMissionFails() {
    return this.missionFails;
  }
  addMissionFails() {
    this.missionFails += 1;
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

  /* Game Logic */
  randomizeSeatAndTeam() {
    this.clearSeats();
    const goodTeamArr = this.fillArray(Team.Good, this.getCapacity() - this.getNumSpies());
    const badTeamArr = this.fillArray(Team.Bad, this.getNumSpies());
    var teamArr = goodTeamArr.concat(badTeamArr);
    this.shuffle(teamArr);
    this.shuffle(this.getPlayers());

    for (let i = 0; i < this.getCapacity(); i++) {
      this.setPlayerTeam(teamArr[i], i);
      this.setSeat(this.getPlayers()[i], teamArr[i], false, false);
    }
  };

  sendSeatingInfo(io) {
    const seats = this.getSeats();
    const cap = this.getCapacity();

    var coveredSeats = JSON.parse(JSON.stringify(seats)); // deep copy of seats, team will be covered
    for (let i = 0; i < cap; i++) {
      coveredSeats[i][1] = Team.Unknown;
    }

    for (let i = 0; i < cap; i++) {
      const player = this.getPlayerByUsername(seats[i][0], cap);
      if (player.getTeam() === Team.Bad) {
        io.to(player.getId()).emit("shuffled_seats", seats);
      } else {
        io.to(player.getId()).emit("shuffled_seats", coveredSeats);
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

    game.sendSeatingInfo(io);
    io.in(room).emit("vote_on_these_players", { selectedPlayers: selectedMembers });
    
    // send out msg
    const speech = `Very well, soldiers, please approve or disapprove ${selectedMembers.join(', ')} carrying \
    out mission ${game.mission}`;
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
    make a decision, PASS or FAIL this mission. (Resistance members must choose pass...)`;
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
    ${leader.getUsername()}, please choose ${game.getMissionTeamSizes()[game.getMission() - 1]} members for mission ${game.getMission()}`;

    game.gameMasterSpeech(game, io, resultSpeech + newLeaderSpeech);
    game.letLeaderSelect(game, io, leader.getId());
  };

  startGame(game, io) {
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
    const welcomeMsg = `Welcome soldiers, I am Captain X, thank you for joining the resistance. \
    We are well on our way to overthrow the capital. However, I am aware of ${game.getNumSpies()} spies among us.. \
    Please beware and smoke them out. For now, we start our first mission. I am appointing ${leader.getUsername()} as the leader. \
    ${leader.getUsername()}, please choose ${game.getMissionTeamSizes()[game.getMission() - 1]} members for mission ${game.getMission()}`;
    game.gameMasterSpeech(game, io, welcomeMsg);
    // set timer
    // give leader powers, assign it the start
    game.letLeaderSelect(game, io, leader.getId());
  };

  endGame(game, io, win=true, disconnect=false) {
    const roomCode = game.getRoomCode();
    const players = game.getPlayers();
    const message = win ? "The Resistance Wins" : 
                    !disconnect ? "The Spies Win" : 
                    disconnect ? "Game Aborted Due to User Disconnect >:(" :
                    "Game Over";
    
    game.gameMasterSpeech(game, io, message);
    
    var playerRevealArr = [];
    for (let i = 0; i < game.getCapacity(); i++) {
      const name = players[i].getUsername();
      const team = players[i].getTeam();
      playerRevealArr.push(`${name} was ${team === "badTeam" ? "an evil spy" : "part of the rebellion"}`);
    };

    io.to(roomCode).emit("set_game_end", { playerRevealArr: playerRevealArr, endMsg: "Game Over: " + message });
  };
}

module.exports = Game;