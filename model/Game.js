const Team = require("../Enums/Team.js");

class Game {
  constructor(roomCode, players, capacity, selectionTime, hasStarted) {
    this.roomCode = roomCode; // string
    this.players = players; // arr[Player]

    // room settings
    this.capacity = capacity // int
    this.selectionTime = selectionTime // int
    this.hasStarted = hasStarted // bool

    // game logic
    this.mission = 0; // int, the mission/round game is on
    this.seats = []; // arr[[player.username, team, isLeader, onMission]]
    this.numSpies = this.capacity < 7 ? 2 :
                      this.capacity < 10 ? 3 : 4
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
    console.log("new player list is: ", this.players);
    console.log("new seats list is: ", this.seats);
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

  setLeader(leader, leaderIndex, isLeader) {
    leader.setIsLeader(isLeader);
    this.seats[leaderIndex][2] = true;
  }

  getCapacity() {
    return this.capacity;
  };

  getSelectionTime() {
    return this.selectionTime;
  }

  getHasStarted() {
    return this.hasStarted;
  };
  setHasStarted(hasStarted) {
    this.hasStarted = hasStarted;
  };

  getMission() {
    return this.mission;
  }
  setMission(mission) {
    this.mission = mission;
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
  
  /* Helpers */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
  }

  fillArray(value, len) {
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(value);
    }
    return arr;
  }

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
  }

  sendSeatingInfo(io) { // this will be the socket of the last joined player
    const seats = this.getSeats();
    const cap = this.getCapacity();

    var coveredSeats = JSON.parse(JSON.stringify(seats)); ; // deep copy of seats, team will be covered
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
  }

  gameMasterSpeech(game, io, speech) {
    io.to(game.getRoomCode()).emit("game_master_speech", speech);
  }

  startGame(game, io) {
    // start game
    game.setHasStarted(true);

    // randomize teams
    console.log("Game is starting, about to randomize seat and teams");
    game.randomizeSeatAndTeam();
    game.sendSeatingInfo(io);

    // randomize leader
    var leaderIndex = Math.floor(Math.random() * game.getCapacity()); // range 0 to (cap - 1)
    console.log("leaderindex: ", leaderIndex);
    const leader = game.getPlayers()[leaderIndex];
    console.log("leader is: ", leader);
    game.setLeader(leader, leaderIndex, true); // also changes this.seats
    game.sendSeatingInfo(io);
    console.log("leader is: ", leader);
    console.log(game.seats[leaderIndex]);

    // start missions
    const welcomeMsg = `Welcome soldiers, I am Captain X, thank you for joining the resistance. \
    We are well on our way to overthrow the capital. However, I am aware of ${game.getNumSpies()} spies among us.. \
    Please beware and smoke them out. For now, we start our first mission. I am appointing ${leader.getUsername()} as the leader. \
    ${leader.getUsername()}, please choose the members for mission ${game.getMission()}`;
    game.gameMasterSpeech(game, io, welcomeMsg);

    // set timer
    // give leader powers, assign it the start

    /* assign new leader
    game.setLeader(oldLeader, true);
    game.setLeader(leader, true);
    game.sendSeatingInfo(io);
    */


  };
}

module.exports = Game;