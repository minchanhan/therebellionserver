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

  getId() {
    return this.id;
  }

  setTeam(team) {
    this.team = team;
  }
  getTeam() {
    return this.team;
  }

  setIsLeader() {
    this.isLeader = isLeader;
  }
  getIsLeader() {
    return this.isLeader;
  }
  
  setVoteStatus() {
    this.voteStatus = voteStatus;
  }
  getVoteStatus() {
    return this.voteStatus;
  }

  setOnMission() {
    this.onMission = onMission;
  }
  getOnMission() {
    return this.onMission;
  }

  setPlotCards() {
    this.PlotCards = plotCards;
  }
  getPlotCards() {
    return this.PlotCards;
  }

  setIsRevealed() {
    this.IsRevealed = isRevealed;
  }
  getIsRevealed() {
    return this.IsRevealed;
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