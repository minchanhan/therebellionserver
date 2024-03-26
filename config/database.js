const mongoose = require('mongoose');

const connect = async() => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/therebellion", {
      userNewUrlParser: true,
      useUnifiedTopology: true,
      userCreateIndex: true
    });
    console.log("Connected to DB!");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = connect;