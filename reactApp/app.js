
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
  // getResult(evt){
  //   evt.preventDefault();
  //   var self = this;
  //   fetch('http://localhost:3000/gameinfo')
  //   .then(function(response){
  //     return response.json()
  //   })
  //   .then(function(responseJson){
  //     self.setState({
  //       character: responseJson.character,
  //       probability: responseJson.probability
  //     })
  //   })
  //   .catch(function(err){
  //     console.log(err);
  //   })
  // }
  onFinish(){
    var self = this
    self.setState({
      loading : true
    })
    fetch('http://localhost:3000/uploadurl',{
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: 'https://s3-us-west-1.amazonaws.com/code-testing/f44fd929-2585-49a2-a718-1327d1d84aff_blitzcrank.mp4'
      })
    })
    .then(()=> {
      self.setState({url:'https://s3-us-west-1.amazonaws.com/code-testing/f44fd929-2585-49a2-a718-1327d1d84aff_blitzcrank.mp4'})
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
      <div>
        <div>
          <h2 style = {{textAlign: 'center'}}> Upload a video to search within it</h2>
          <div style ={{textAlign: 'center', paddingBottom: 20}}>
          </div>
          <ReactS3Uploader
          signingUrl="/s3/sign"
          signingUrlMethod="GET"
          accept="video/*"
          signingUrlWithCredentials={ true }      // in case when need to pass authentication credentials via CORS
          uploadRequestHeaders={{ 'x-amz-acl': 'public-read' }}  // this is the default
          contentDisposition="auto"
          onFinish = {this.onFinish.bind(this)}
          scrubFilename={(filename) => filename.replace(/[^\w\d_\-\.]+/ig, '')}
          server="http://localhost:3000" />
        </div>
        <div style ={{paddingBottom: 5}}></div>
        <div>{this.state.ready ?
          <label>
          Search Term Within Video: <input type="text" name="name" onChange={this.update.bind(this)} value={this.state.query} />
          </label>
          : <div></div>
        }
        </div>
        <div style={{textAlign: 'center'}}>
        <div>{this.state.loading ?
            <img src="https://media.giphy.com/media/TkXCbTx9gfUJi/giphy.gif" width="160" height="120" alt="Loading gif">
            </img>
          : <div></div>}
        </div>
          <div>{
            this.state.url ?
              <video id="uploadedvideo" width="320" height="240" controls>
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
