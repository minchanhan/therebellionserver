const mongoose = require('mongoose');

const Player = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },

})

module.exports = mongoose.model('Player', Player);