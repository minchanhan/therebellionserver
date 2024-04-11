class Player {
  constructor(
    username,
    isAdmin,
    team, 
    isLeader, 
    onMission, 
  ) {
    this.username = username; // string
    this.isAdmin = isAdmin;
    this.team = team; // enum: Good | Bad | Unknown
    this.isLeader = isLeader; // bool
    this.onMission = onMission; // enum: none | yes | no
  }

  getUsername() {
    return this.username;
  }
  setUsername(username) {
    this.username = username;
  }

  getIsAdmin() {
    return this.isAdmin;
  }
  setIsAdmin(isAdmin) {
    this.isAdmin = isAdmin;
  }

  getTeam() {
    return this.team;
  }
  setTeam(team) {
    this.team = team;
  }
  
  getIsLeader() {
    return this.isLeader;
  }
  setIsLeader(isLeader) {
    this.isLeader = isLeader;
  }
  
  getOnMission() {
    return this.onMission;
  }
  setOnMission() {
    this.onMission = onMission;
  }
}

module.exports = Player;
