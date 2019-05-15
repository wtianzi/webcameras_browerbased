/* eslint-env browser */
import React from 'react';

const videoType = 'video/webm';

export default class HomePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      recording: false,
      videos: [],
      cameras:[],
    };
  }

  async componentDidMount() {

    const video = document.getElementById('video1');
    const button = document.getElementById('button1');
    const select = document.getElementById('select1');
    const record = document.getElementById('record1');
    let currentStream;

    record.addEventListener('click',event => {

    });

    button.addEventListener('click', event => {
      if (typeof currentStream !== 'undefined') {
           stopMediaTracks(currentStream);
         }
      const videoConstraints = {};

      if (select.value === '') {
          videoConstraints.facingMode = 'environment';
      }
      else {
        videoConstraints.deviceId = { exact: select.value };
      }

      const constraints = {
        video: videoConstraints,
        audio: false
      };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(stream => {
          currentStream = stream;
          video.srcObject = stream;
          return navigator.mediaDevices.enumerateDevices();
        })
        .then(gotDevices)
        .catch(error => {
          console.error(error);
        });
    });

    function gotDevices(mediaDevices) {
      select.innerHTML = '';
      select.appendChild(document.createElement('option'));
      let count = 1;
      mediaDevices.forEach(mediaDevice => {
        if (mediaDevice.kind === 'videoinput') {
          const option = document.createElement('option');
          option.value = mediaDevice.deviceId;
          const label = mediaDevice.label || `Camera ${count++}`;
          const textNode = document.createTextNode(label);
          option.appendChild(textNode);
          select.appendChild(option);
        }
      });
    }

    function stopMediaTracks(stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }


    navigator.mediaDevices.enumerateDevices().then(gotDevices);

    const stream = await navigator.mediaDevices.getUserMedia({video: true});
    console.log(stream);
    // show it to user
    this.video.srcObject = stream;
    this.video.play();
    // init recording
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: videoType,
    });
    // init data storage for video chunks
    this.chunks = [];
    // listen for data from media recorder
    this.mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };
  }

  startRecording(e) {
    e.preventDefault();
    // wipe old data chunks
    this.chunks = [];
    // start recorder with 10ms buffer
    this.mediaRecorder.start(10);
    // say that we're recording
    this.setState({recording: true});
  }

  stopRecording(e) {
    e.preventDefault();
    // stop the recorder
    this.mediaRecorder.stop();
    // say that we're not recording
    this.setState({recording: false});
    // save the video to memory
    this.saveVideo();
  }

  saveVideo() {
    // convert saved chunks to blob
    const blob = new Blob(this.chunks, {type: videoType});
    // generate video url from blob
    const videoURL = window.URL.createObjectURL(blob);
    // append videoURL to list of saved videos for rendering
    const videos = this.state.videos.concat([videoURL]);
    this.setState({videos});
  }

  deleteVideo(videoURL) {
    // filter out current videoURL from the list of saved videos
    const videos = this.state.videos.filter(v => v !== videoURL);
    this.setState({videos});
  }

  render() {
    const {recording, videos} = this.state;

    return (
      <div className="camera">
        <video
          style={{width: 400}}
          ref={v => {
            this.video = v;
          }}>
          Video stream not available.
        </video>
        <div>
          {!recording && <button onClick={e => this.startRecording(e)}>Record</button>}
          {recording && <button onClick={e => this.stopRecording(e)}>Stop</button>}
        </div>

        <div>
          <h3>Testing multiple cameras</h3>
          <div className="controls">
            <button id="button1">Get camera</button>
            <select id="select1">
              <option></option>
            </select>
          </div>
          <video id="video1" autoPlay playsInline></video>
          <div><button id="record1">Record 1</button></div>
        </div>


        <div>
          <h3>Recorded videos:</h3>
          {videos.map((videoURL, i) => (
            <div key={`video_${i}`}>
              <video style={{width: 200}} src={videoURL} autoPlay loop />
              <div>
                <button onClick={() => this.deleteVideo(videoURL)}>Delete</button>
                <a href={videoURL}>Download</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
