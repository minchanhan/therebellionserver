class Game {
  constructor(roomCode, players, capacity, hasStarted) {
    this.roomCode = roomCode; // string
    this.players = players; // arr[Player]

    // room settings
    this.capacity = capacity // int
    this.hasStarted = hasStarted // bool
  }

  addPlayer(player) {
    this.players.push(player);
  }
  getPlayers () {
    return this.players;
  }

  getCapacity () {
    return this.capacity;
  }

  setHasStarted(hasStarted) {
    this.hasStarted = hasStarted;
  }
  getHasStarted() {
    return this.hasStarted;
  }

  startGame() {
    // start game

    // randomize teams

    // randomize leader


    // start mission 1

    for (let index = 0; index < 5; index++) {
      const element = array[index];
      
    }
  }
}

module.exports = Game;