class Player {
  constructor(
    id,
    username,
    isAdmin,
    team, 
    isLeader, 
    onMission, 
  ) {
    this.id = id; // string, generated by socket, should always be the same as its socket
    this.username = username; // string
    this.isAdmin = isAdmin;
    this.team = team; // enum: Good | Bad | Unknown
    this.isLeader = isLeader; // bool
    this.onMission = onMission; // enum: none | yes | no
    this.isDisconnected = false; // bool
  }

  getId() {
    return this.id;
  };
  setId(id) {
    this.id = id;
  };

  getUsername() {
    return this.username;
  };
  setUsername(username) {
    this.username = username;
  };

  getIsAdmin() {
    return this.isAdmin;
  };
  setIsAdmin(isAdmin) {
    this.isAdmin = isAdmin;
  };

  getTeam() {
    return this.team;
  };
  setTeam(team) {
    this.team = team;
  };
  
  getIsLeader() {
    return this.isLeader;
  };
  setIsLeader(isLeader) {
    this.isLeader = isLeader;
  };
  
  getOnMission() {
    return this.onMission;
  };
  setOnMission(onMission) {
    this.onMission = onMission;
  };

  getIsDisconnected() {
    return this.isDisconnected;
  };
  setIsDisconnected(isDisconnected) {
    this.isDisconnected = isDisconnected;
  };
}

module.exports = Player;
