let isPlaylistPlaying = false;
const {remote} = require('electron');

const Player = React.createClass({
  onStateChange: function (event) {
    if (event.data === YT.PlayerState.UNSTARTED) return;
    if (event.data === YT.PlayerState.CUED) return;

    if (event.data === YT.PlayerState.ENDED) {
      // No more video to play
      // (1 because we will remove the played video)
      if (this.state.playlist.length === 1)
        isPlaylistPlaying = false;

      // Remove last played video
      window.dispatchEvent(new CustomEvent('playlist.removeVideo', { detail: { video: this.state.playlist[0] } }));

      // The video has changed
      // Seize the opportunity to update the playlist without interruption
      this.updatePlaylist();
    } else {
      isPlaylistPlaying = true;
    }
  },
  updatePlaylist: function () {
    if (!this.state.playlist.length) return;

    // Update playlist and start playing
    this.state.player.loadVideoById(this.state.playlist[0]);
  },
  componentWillReceiveProps(nextProps) {
    const statesThatNeedCue = [YT.PlayerState.ENDED, YT.PlayerState.CUED];
    
    if (!isPlaylistPlaying
      && this.state.player.cueVideoById // Player is loaded
      && nextProps.playlist.length
      && statesThatNeedCue.indexOf(this.state.player.getPlayerState()) > -1) {
        this.state.player.cueVideoById(nextProps.playlist[0]);
    }

    this.setState({
      playlist: nextProps.playlist,
    });
  },
  componentDidMount: function () {
    document.addEventListener("webkitfullscreenchange", function () {
      const currentWindow = remote.getCurrentWindow();
      let isFullScreen = !!document.querySelector("#player:-webkit-full-screen");

      if (isFullScreen) {
        document.body.classList.add('fullscreen');
        currentWindow.setMinimumSize(160, 90);
      }
      else {
        document.body.classList.remove('fullscreen');
        currentWindow.setMinimumSize(880, 370);

        // Resize window if too small
        const currentSize = currentWindow.getSize();
        let needResize = false;
        let newWidth = currentSize[0];
        let newHeight = currentSize[1];
        if (newWidth < 880) {
          needResize = true;
          newWidth = 880;
        }
        if (newHeight < 370) {
          needResize = true;
          newHeight = 370;
        }

        if (needResize) {
          currentWindow.setSize(newWidth, newHeight, true);
        }
      }

      currentWindow.setAlwaysOnTop(isFullScreen);
      currentWindow.setHasShadow(!isFullScreen);
      currentWindow.setVisibleOnAllWorkspaces(isFullScreen);
    }, false);

    this.setState({
      playlist: [],

      // YT may not be loaded at this time, need to find a solution...
      // That's probably why I can't put this in a getInitialState method
      player: new YT.Player('player', {
        events: {
          onStateChange: this.onStateChange
        }
      })
    });
  },
  render: function () {
    return <div id="player"></div>;
  }
});

const PlaylistItem = React.createClass({
  raise: function () {
    if (this.props.id) {
      window.dispatchEvent(new CustomEvent('playlist.raiseVideo', { detail: { video: this.props } }));
    }
  },
  remove: function () {
    if (this.props.id) {
      window.dispatchEvent(new CustomEvent('playlist.removeVideo', { detail: { video: this.props } }));
    }
  },
  render: function () {
    return (
        <div className="playlist-item">
          <a className="playlist-item--remove"
                  onClick={this.remove}
                  title="Remove this video from the list">
              &times;
          </a>

          <a className="playlist-item--title" onClick={this.raise} title={this.props.title}>
            {this.props.title}
          </a>

          <p className="playlist-item--channel">
            {this.props.channel}
          </p>
        </div>
    );
  }
});

const Playlist = React.createClass({
  render: function () {
    let videos = [];
    for (var index in this.props.videos) {
      videos.push(
        <PlaylistItem
          key={this.props.videos[index].id}
          id={this.props.videos[index].id}
          thumbnail={this.props.videos[index].thumbnail}
          title={this.props.videos[index].title}
          channel={this.props.videos[index].channel} />
        );
    }

    return (
      <div id="playlist">
        {videos}
      </div>
    );
  }
});

const Controls = React.createClass({
  togglePlaylistVisibility: function(e) {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('playlist.toggleVisibility'));
  },
  render: function () {
    return (
      <div id="playlist-controls">
        <button><i className="fa fa-backward"></i></button>
        <button><i className="fa fa-repeat"></i></button>
        <button><i className="fa fa-forward"></i></button>
        <button onClick={ this.togglePlaylistVisibility }><i className="fa fa-list"></i></button>
      </div>
    );
  }
});

const CurrentPlaylist = React.createClass({
  getInitialState: function () {
    return { 
      videos: [],
      playlistVisible: false,
    };
  },
  componentDidMount: function () {
    // ToDo - retrieve playlist from backend

    window.addEventListener('playlist.addVideo', this.addVideo);
    window.addEventListener('playlist.cueVideo', this.cueVideo);
    window.addEventListener('playlist.removeVideo', this.removeVideo);
    window.addEventListener('playlist.raiseVideo', this.raiseVideo);
    window.addEventListener('playlist.toggleVisibility', this.toggleVisibility);
  },
  componentWillUnmount: function () {
    window.removeEventListener('playlist.addVideo', this.addVideo, false);
    window.removeEventListener('playlist.cueVideo', this.cueVideo, false);
    window.removeEventListener('playlist.removeVideo', this.removeVideo, false);
    window.removeEventListener('playlist.raiseVideo', this.raiseVideo, false);
    window.removeEventListener('playlist.toggleVisibility', this.toggleVisibility, false);    
  },
  addVideo: function (event) {
    // Add the video in first position if no video playing
    // Else add it in second position

    let video = this.normalizeVideo(event.detail.video);

    if (this.isInPlaylist(video))
      return;

    this.setState(state => {
      if (isPlaylistPlaying) {
        state.videos.splice(1, 0, video);
      } else {
        state.videos.splice(0, 0, video);
      }

      return state;
    });
  },
  cueVideo: function (event) {
    // Add the video in last position
    let video = this.normalizeVideo(event.detail.video);

    if (this.isInPlaylist(video))
      return;

    this.setState(state => {
      state.videos.push(video);

      return state;
    });
  },
  removeVideo: function (event) {
    let video = this.normalizeVideo(event.detail.video);

    if (!this.isInPlaylist(video))
      return;

    this.setState(state => {
      state.videos = _.reject(state.videos, video);

      return state;
    });
  },
  raiseVideo: function (event) {
    let video = this.normalizeVideo(event.detail.video);

    if (!this.isInPlaylist(video))
      return;

    this.setState(state => {
      state.videos = _.reject(state.videos, video);
      if (isPlaylistPlaying) {
        state.videos.splice(1, 0, video);
      } else {
        state.videos.splice(0, 0, video);
      }

      return state;
    });
  },
  normalizeVideo: function (video) {
    if (_.isObject(video))
      return video;

    return { id: video };
  },
  isInPlaylist: function (video) {
    return _.some(this.state.videos, video);
  },

  toggleVisibility: function() {
    this.state.playlistVisible = document.querySelector('#playlist').classList.toggle('visible');
    
  },

  render: function () {
    return (
      <div id="current-playlist">
        <Playlist videos={ this.state.videos } />
        <Controls />
        <Player playlist={ _.map(this.state.videos, 'id') } />
      </div>
    );
  }
});

module.exports = CurrentPlaylist;
