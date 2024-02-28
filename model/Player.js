class Player {
  constructor(
    username,
    id,
    team, 
    isLeader, 
    voteStatus, 
    onMission, 
    plotCards, 
    isRevealed
  ) {
    this.username = username; // string
    this.id = id; // string
    this.team = team; // enum: Good | Bad | Unknown
    this.isLeader = isLeader; // bool
    this.voteStatus = voteStatus; // enum: none | appr | notAppr
    this.onMission = onMission; // enum: none | yes | no
    this.plotCards = plotCards; // array[PlotCard]
    this.isRevealed = isRevealed; // bool
  }

  getUsername() {
    return this.username;
  }
  getId() {
    return this.id;
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
  setIsLeader() {
    this.isLeader = isLeader;
  }
  
  getVoteStatus() {
    return this.voteStatus;
  }
  setVoteStatus() {
    this.voteStatus = voteStatus;
  }
  
  getOnMission() {
    return this.onMission;
  }
  setOnMission() {
    this.onMission = onMission;
  }
  
  getPlotCards() {
    return this.PlotCards;
  }
  setPlotCards() {
    this.PlotCards = plotCards;
  }
  
  getIsRevealed() {
    return this.IsRevealed;
  }
  setIsRevealed() {
    this.IsRevealed = isRevealed;
  }
}

module.exports = Player;

/*
var player = new Player(
  username, // username
  "", // id
  Team.None, // team
  false, // isLeader
  VoteStatus.None, // voteStatus
  false, // onMission
  [], // plotCards
  false // isRevealed
);*/