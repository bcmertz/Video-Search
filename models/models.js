var mongoose = require('mongoose')
var connect = process.env.MONGODB_URI
mongoose.connect(connect);

var Frame = new mongoose.Schema({
  predictions: Array
});


module.exports = {
  Frame : mongoose.model('Frame', Frame)
}
