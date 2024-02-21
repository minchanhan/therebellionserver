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
    this.seatOrder = new Map();
    this.numSpies = this.capacity < 7 ? 2 :
                      this.capacity < 10 ? 3 : 4
  };

  addPlayer(player) {
    this.players.push(player);
  };
  getPlayers() {
    return this.players;
  };

  getPlayerId(index) {
    return this.players[index].getId();
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

  setSeatOrder(seatNum, player) {
    this.seatOrder.set(seatNum, player);
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
    this.shuffle(this.getPlayers());
    const goodTeamArr = this.fillArray(Team.Good, this.getCapacity() - this.getNumSpies());
    const badTeamArr = this.fillArray(Team.Bad, this.getNumSpies());
    var teamArr = goodTeamArr.concat(badTeamArr);
    this.shuffle(teamArr);

    for (let i = 0; i < 3; i++) { // just for testing, change to capacity later
      this.setPlayerTeam(teamArr[i], i);
      this.setSeatOrder(i, this.getPlayers()[i]);
    }
    console.log(this.seatOrder);
  }


  
  startGame() {
    // start game

    // randomize teams

    // randomize leader


    // start mission 1

    for (let index = 0; index < 5; index++) {
      const element = array[index];
      
    }
  };


}

module.exports = Game;