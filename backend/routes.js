
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
var youtubedl = require('youtube-dl')
var fs = require('fs')

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
router.get('/results', function(req, res){
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
  var url = req.body.url;
  console.log('Classifying');
  var predictions = [];
  var idx = 0;
  var counter = 0;
  var start = Date.now();
  var timer = 110;
  var startOfClassification = Date.now();
  var predictionArray = []

  allKeys.forEach(function(item){
    var time = item.time
    var image = item.url
    predictionArray.push({"url": image})
  })
  console.log('predictionArray', predictionArray)
  clari.models.predict(Clarifai.GENERAL_MODEL, predictionArray).then(
    function(response) {
      console.log('Number of outputs', response.outputs.length)
      response.outputs.forEach(function(item){
        predictions.push({classification : item.data.concepts[0].name, time: allKeys[counter].time})
        console.log('Classification', item.data.concepts[0].name, 'Time', allKeys[counter].time);
        counter++
      })
      var videodata = Frame({
        predictions: predictions,
        url: url
      })
      videodata.save(function(err){
        if(err){
          console.log('Error', err);
        } else{
          console.log('Data was saved')
          predictionsArray = []
          ready = true
          return 'done'
          // res.send('success : true')
        }
      });
    },
    function(err) {
      console.error('Error', err);
    }
  );

  // (function classify () {
  //   let rateLimiter = new Promise((resolve, reject)=>{
  //     timer = Date.now()-start
  //     if (timer<110) {
  //       var wait = 110-timer
  //       console.log('wait', wait)
  //       setTimeout(function(){
  //         resolve('success')
  //       }, wait)
  //     } else {
  //       console.log('no setTimeout')
  //       resolve('success')
  //     }
  //   })
  //   .then((success)=>{
  //     var item = allKeys[counter]
  //     var time = item.time
  //     var image = item.url
  //     start = Date.now()
  //     clari.models.predict(Clarifai.GENERAL_MODEL, image).then(
  //       function(response) {
  //         counter++
  //         var test = Date.now() - start
  //         console.log('Clarifai took', test, 'ms');
  //         console.log('image ', counter, ' of ', allKeys.length, 'took', timer, 'ms');
  //         // console.log('image ', counter, ' of ', allKeys.length, response.outputs[0].data.concepts[0].name, time, 'took', timer, 'ms');
  //         predictions.push({
  //           classification : response.outputs[0].data.concepts[0].name,
  //           time : time
  //         });
  //         if (counter === allKeys.length){
  //           console.log('predictions', predictions);
  //           var videodata = Frame({
  //             predictions: predictions
  //           })
  //           console.log('s/image:', (Date.now()-startOfClassification)/(1000*allKeys.length))
  //           videodata.save(function(err){
  //             if(err){
  //               console.log('Error', err);
  //             } else{
  //               console.log('Data was saved')
  //               ready = true
  //               return 'done'
  //             }
  //           });
  //           res.send('successful')
  //         } else {
  //           classify()
  //         }
  //       },
  //       function(err) {
  //         console.error('Error', err);
  //       }
  //     )
  //   })
  //   .catch((err)=>{
  //     console.log('err', err)
  //   })
  // })(); this is good except its slower than it needs to be, bc you can send more than one image at a time and you don't need to limit yourself to one image a request


  // var slow = setInterval(function(){
  //   var item = allKeys[counter]
  //   var time = item.time
  //   var image = item.url
  //   clari.models.predict(Clarifai.GENERAL_MODEL, image).then(
  //     function(response) {
  //       counter++
  //       console.log('image ', counter, ' of ', allKeys.length, response.outputs[0].data.concepts[0].name, time);
  //       predictions.push({
  //         classification : response.outputs[0].data.concepts[0].name,
  //         time : time
  //       });
  //       if (counter === allKeys.length){
  //         clearInterval(slow)
  //         console.log('predictions', predictions);
  //         var videodata = Frame({
  //           predictions: predictions
  //         })
  //         videodata.save(function(err){
  //           if(err){
  //             console.log('Error', err);
  //           } else{
  //             console.log('Data was saved')
  //             ready = true
  //             return 'done'
  //             // res.send('success : true')
  //           }
  //         });
  //         res.send('successful')
  //       }
  //     },
  //     function(err) {
  //       console.error('Error', err);
  //     }
  //   );
  // }, 110)

})

router.post('/stream', function(req,res){
  var source = 's'+req.body.url
  console.log('source', source)
  var options = {
    // host: 'whatever the heroku is called',
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
  res.redirect('/')
})

router.post('/uploadurl', function(req, res){
  // var source = req.body.url //this doesn't work yet
  // var source = {"type": "uploadedvideo", "data": req.body.url}
  var source = 'f'+req.body.url
  console.log('source',source)
  var options = {
    // host: 'whatever the heroku is called',
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
  res.redirect('/')
})

router.post('/youtube', function(req, res){
  //need to download video, upload to aws, get link back
  console.log('in youtubedl, url:', req.body.url)

  var postToPython = function (url) {
    var source = 'f'+url
    console.log('source',source)
    var options = {
      // host: 'whatever the heroku is called',
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
    res.redirect('/')
  }

  var uploadVideo = function () {
    fs.readFile('myvideo.mp4', function(err, data){
      if (err) {
        throw err
      }
      console.log('data', data);
      var base64data = new Buffer(data, 'binary')
      var params = {
        Bucket: 'mybucket-bennettmertz', Key: 'myvideo.mp4', Body: base64data, ACL:"public-read-write"
      };
      s3.putObject(params, function(resp){
        var url = 'https://s3-us-west-1.amazonaws.com/'+'mybucket-bennettmertz'+'/'+'myvideo.mp4'
        postToPython(url)
      })
    })
  }

  var video = youtubedl(req.body.url,
    ['--format=18'],
    { cwd: __dirname }
  );
  // Will be called when the download starts.
  video.on('info', function(info) {
    console.log('Download started');
    console.log('filename: ' + info.__filename);
    console.log('size: ' + info.size);
  });
  video.pipe(fs.createWriteStream('myvideo.mp4'));
  video.on('end', function() {
    console.log('finished downloading, uploading to aws-s3');
    uploadVideo()
  });
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
