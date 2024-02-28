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
    this.seats = []; // arr[[player.username, team]]
    this.numSpies = this.capacity < 7 ? 2 :
                      this.capacity < 10 ? 3 : 4
  };

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

  getCapacity() {
    return this.capacity;
  };

  setNumSpies(numSpies) {
    this.numSpies = numSpies;
  }
  getNumSpies() {
    return this.numSpies;
  }

  getSelectionTime() {
    return this.selectionTime;
  }

  setHasStarted(hasStarted) {
    this.hasStarted = hasStarted;
  };
  getHasStarted() {
    return this.hasStarted;
  };

  getSeats() {
    return this.seats;
  }
  setSeat(player, team) { // username and team only
    this.seats.push([player.username, team]); // keeps order of players with team
  }
  clearSeats() {
    this.seats = [];
  }

  // Helpers
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

  // Step 1
  randomizeSeatAndTeam() {
    this.clearSeats();
    const goodTeamArr = this.fillArray(Team.Good, this.getCapacity() - this.getNumSpies());
    const badTeamArr = this.fillArray(Team.Bad, this.getNumSpies());
    var teamArr = goodTeamArr.concat(badTeamArr);
    this.shuffle(teamArr);
    this.shuffle(this.getPlayers());

    for (let i = 0; i < this.getCapacity(); i++) {
      this.setPlayerTeam(teamArr[i], i);
      this.setSeat(this.getPlayers()[i], teamArr[i]);
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

  startGame(game, io) {
    // start game
    game.setHasStarted(true);

    // randomize teams
    console.log("Game is starting, about to randomize seat and teams");
    game.randomizeSeatAndTeam();
    game.sendSeatingInfo(io);

    // randomize leader

    // start mission 1

    /*
    for (let index = 0; index < 5; index++) {
      const element = array[index];
      
    } */
  };
}

module.exports = Game;