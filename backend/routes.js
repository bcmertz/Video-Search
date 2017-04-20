
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
var Frame = models.Frame;
var Clarifai = require('clarifai');

var s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

var clari = new Clarifai.App(
  process.env.id,
  process.env.password
);
clari.getToken();

router.get('/', function(req,res){
  res.sendFile(path.join(__dirname, '../index.html'))
});

var ready = false

//Steps 17,18, 19
router.get('/gameinfo', function(req, res){
  if (ready) {
    Frame.find(function(err, data){
      if(err){
        console.log('Error', err);
      } else{
        console.log('res', res)
        ready = false
        res.send({success: true, data:data[data.length-1]});
      }
    })
  } else {
    res.send({success : false})
  }
})

//Steps 9-15
router.post('/predict', function(req, res){
  var allKeys = req.body.source;
  console.log('classifying');
  var predictions = [];
  var idx = 0
  var counter = 0;
  allKeys.forEach(function(item){
    var time = item.time
    var image = item.url
    clari.models.predict(Clarifai.GENERAL_MODEL, image).then(
        function(response) {
          counter++;
          console.log('image ', counter, ' of ', allKeys.length);
          predictions.push({
            classification : response.outputs[0].data.concepts[0].name,
            time : time
          });
          if (counter === allKeys.length){
            console.log('predictions', predictions);
            var videodata = Frame({
              predictions: predictions
            })
            videodata.save(function(err){
              if(err){
                console.log('Error', err);
              } else{
                console.log('Data was saved')
                ready = true
                return 'done'
                // res.send('success : true')
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

router.post('/stream', function(req,res){
  var source = 's'+req.body.url
  console.log('source', source)
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

router.post('/uploadurl', function(req, res){
  // var source = req.body.url //this doesn't work yet
  // var source = {"type": "uploadedvideo", "data": req.body.url}
  var source = 'f'+req.body.url
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
  console.log('here1')
  res.redirect('/')
})

router.use('/s3', require('react-s3-uploader/s3router')({
    bucket: "mybucket-bennettmertz",
    // region: 'us-west-1', //optional
    // signatureVersion: 'v4', //optional (use for some amazon regions: frankfurt and others)
    headers: {'Access-Control-Allow-Origin': '*'}, // optional
    ACL: 'public-read'
  })
);

module.exports = router;
