
import React, {Component} from 'react'
import css from '../styles.css'
import ReactDOM from 'react-dom'
var ReactS3Uploader = require('react-s3-uploader');

// const io = require('socket.io-client')
// const socket = io()

class Main extends React.Component {
  constructor() {
    super();
    this.state = {
      query: '',
      time : null,
      loading : false,
      predictions: null,
      ready : false
    }
  }
  stream(evt) {
    evt.preventDefault();
    var self = this
    console.log('stream', self.state.url)
    fetch('http://localhost:3000/stream',{
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: self.state.url
      })
    })
  }
  componentDidUpdate() {
    //search in array of classified images for search term occurence
    var time = null
    var self = this
    if (this.state.predictions) {
      this.state.predictions.forEach(function(item){
        if (item.classification.toLowerCase() === self.state.query.toLowerCase()) {
          console.log('found search term, displaying results')
          time = item.time
          document.getElementById("uploadedvideo").currentTime=time
        }
      })
    }
  }
  onStart(file, next){
    var self = this
    self.setState({
      loading : true
    })
    next(file) //boilerplate keeps the uplaod going
  }
  onFinish(signResult){
    var self = this
    var tempUrl = signResult.publicUrl.slice(12,signResult.publicUrl.length)
    var url = 'https://s3-us-west-1.amazonaws.com/mybucket-bennettmertz/'+tempUrl
    console.log('url', url)
    fetch('http://localhost:3000/uploadurl',{
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: url
      })
    })
    .then(()=> {
      self.setState({
        url: url
      })
      console.log('looking for result')
      var check = setInterval(function(){
        fetch('http://localhost:3000/gameinfo')
        .then(function(response){
          return response.json()
        })
        .then(function(responseJson){
          if (responseJson.success === true) {
            console.log('got response', responseJson.data.predictions);
            var predictions = responseJson.data.predictions
            clearInterval(check)
            self.setState({loading : false, predictions: predictions, ready : true})
          } else {
            console.log('response not ready')
            return
          }
        })
        .catch(function(err){
          console.log(err);
        })
      }, 2000)
    })
    .catch(function(err){
      console.log(err);
    })
  }
  update(evt){
    var self = this
    this.setState({query:evt.target.value})
  }
  render(){
    return(
      <div style = {{flex: 1}}>
        <div style = {{flex: 1}}>
          <h2 style = {{width: "100%", textAlign: 'center', marginTop : '60px'}}> Upload a video to search within it</h2>
          <div style ={{textAlign: 'center', paddingBottom: 20}}>
            <ReactS3Uploader
            signingUrl="/s3/sign"
            signingUrlMethod="GET"
            accept="video/*"
            signingUrlWithCredentials={ true }      // in case when need to pass authentication credentials via CORS
            uploadRequestHeaders={{ 'x-amz-acl': 'public-read' }}  // this is the default
            contentDisposition="auto"
            onFinish = {this.onFinish.bind(this)}
            // onFinish = {this.onUploadFinish.bind(this)}
            preprocess = {this.onStart.bind(this)}
            scrubFilename={(filename) => filename.replace(/[^\w\d_\-\.]+/ig, '')}
            server="http://localhost:3000" />
          </div>
        </div>
        <div style ={{paddingBottom: 5}}></div>
        <div>{this.state.ready ?
          <div>
            <label style={{display: 'flex', justifyContent: 'center', marginTop: "30px"}}>
            Search Term Within Your Video  <input type="text" name="name" onChange={this.update.bind(this)} value={this.state.query} />
            </label>
            <ul>
              {this.state.predictions.map(function(item) {
                return <li key={item.time}>{item.classification}</li>
              })}
            </ul>
          </div>
          : <div>
              {this.state.loading ?
                <img style={{justifyContent: 'center', alignItems: 'center'}} src="https://media.giphy.com/media/TkXCbTx9gfUJi/giphy.gif" width="160" height="120" alt="Loading gif">
                </img>
              : <div></div>}
            </div>
          }
        </div>
        <div style={{textAlign: 'center'}}>
          <div>{
            this.state.url ?
              <video id="uploadedvideo" width="640" height="480" controls>
                <source src={this.state.url} type="video/mp4"></source>
                Your browser does not support the video tag.
              </video>
            : <div></div>
          }</div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <Main />, document.getElementById('root')
)
