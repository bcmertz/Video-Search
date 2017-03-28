
var express = require('express');
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser')
var PythonShell = require('python-shell');
var fileUpload = require('express-fileupload');
var http = require('http');
var aws = require('aws-sdk')
var mongoose = require('mongoose')
var models = require('../models/models.js')
var Game = models.Game;
var Clarifai = require('clarifai');

// aws.config.loadFromPath('./backend/config.json')
// var s3 = new aws.S3()

var app = express();


// var clari = new Clarifai.App(
//   //credentials
// );
// clari.getToken();

router.get('/', function(req,res){
  res.sendFile(path.join(__dirname, '../index.html'))
});

//Steps 17,18, 19
router.get('/gameinfo', function(req, res){
  Game.find(function(err, data){
    if(err){
      console.log('Error', err);
    } else{
      res.json(data[data.length-1]);
    }
  })
})

//Steps 9-15
router.post('/predict', function(req, res){
  console.log('req.body.source', req.body.source)
  var allKeys = req.body.source;
  var predictions = [];
  var idx = 0

  var counter = 0;
  allKeys.forEach(function(item){
    clari.models.predict(Clarifai.GENERAL_MODEL, item).then(
        function(response) {
          counter++;
          console.log(counter, allKeys.length);
          predictions.push(response.outputs[0].data.concepts[0]);
          if (counter === allKeys.length){
            console.log('predictions', predictions);
            var probability = 0;
            predictions.forEach(function(item){
              probability += item.value;
            })
            probability /= predictions.length;
            console.log(probability);
            var character = 'an unidentifiable character';
            if(probability > .95){
              character = 'Blitzcrank';
            }
            var gamedata = Game({
              character: character,
              probability: probability
            })
            gamedata.save(function(err){
              if(err){
                console.log('Error', err);
              } else{
                console.log(gamedata)
                console.log('Data was saved')
              }
            });
          }
        },
        function(err) {
          console.error('Error', err);
        }
      );
  })
})

router.post('/uploadurl', function(req, res){
  // var source = req.body.url //this doesn't work yet
  var source = req.body.url
  console.log('source',source)
  var options = {
    // host: 'whatever the fuck heroku is called',
    port: 8080,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(source)
    }
  };
  var httpreq = http.request(options, function (response) {
    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      console.log("body: " + chunk);
    }).on('error', function(err) {
      res.send('error');
    }).on('end', function() {
      res.send('ok');
    })
  }).on('error', function(e){
    console.log(e)
  });
  httpreq.write(source);
  httpreq.end();
  console.log('here')
  res.redirect('/')
})

// router.use('/s3', require('react-s3-uploader/s3router')({
//     bucket: "",
//     region: '', //optional
//     signatureVersion: '', //optional (use for some amazon regions: frankfurt and others)
//     headers: {'Access-Control-Allow-Origin': '*'}, // optional
//     ACL: 'private'
//   })
// );

module.exports = router;