const Player = React.createClass({
  onStateChange: function (event) {
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        Socket.emit('video/start', this.state.player.getVideoData()['video_id']);
        break;
      case YT.PlayerState.PAUSED:
        Socket.emit('video/pause', this.state.player.getVideoData()['video_id']);
        break;
      case YT.PlayerState.BUFFERING:
        Socket.emit('video/buffer', this.state.player.getVideoData()['video_id']);
        break;
      case YT.PlayerState.ENDED:
        Socket.emit('video/end', this.state.player.getVideoData()['video_id']);
        break;
    };
  },
  updateVideo: function (id) {
    this.setState((state) => {
      return {
        id: id,
        player: state.player
      };
    });

    console.log(this.state.player);

    this.state.player.cueVideoById(id);
  },
  playVideo: function (id) {
    this.setState((state) => {
      return {
        id: id,
        player: state.player
      };
    });

    this.state.player.loadVideoById(id);
  },
  removeVideo: function () {
    this.state.player.stopVideo();
  },
  componentDidMount: function () {
    this.setState({
      id: null,
      // YT may not be loaded at this time, need to find a solution...
      // That's probably why I can't put this in a getInitialState method
      player: new YT.Player('player', {
          events: {
            onStateChange: this.onStateChange
          }
        })
    });

    Socket.on('video/cue', this.updateVideo);
    Socket.on('video/play', this.playVideo);
    Socket.on('video/remove', this.removeVideo);
  },
  render: function () {
    return <div id="player"></div>;
  }
});

const PlaylistItem = React.createClass({
  play: function () {
    if (this.props.id) {
      Socket.emit('video/play', this.props);
    }
  },
  remove: function () {
    if (this.props.id) {
      Socket.emit('video/remove', this.props.id);
    }
  },
  render: function () {
    return (
      <div>
        <div className="playlist-item">
          <button className="btn btn-secondary btn-sm remove"
                  onClick={this.remove}
                  title="Remove this video">x</button>
          <h5>
            <a onClick={this.play} title={this.props.title}>
              {this.props.title}
            </a>
          </h5>
          <h6>{this.props.channel}</h6>
        </div>
        <hr />
      </div>
    );
  }
});

const Playlist = React.createClass({
  getInitialState: function () {
    return { videos: [] };
  },
  componentDidMount: function () {
    Socket.on('playlist/update', (playlist) => {
      this.setState({ videos: playlist });
    });
  },
  render: function () {
    let videos = [];
    for (var index in this.state.videos) {
      videos.push(
        <PlaylistItem
          key={this.state.videos[index].id}
          id={this.state.videos[index].id}
          thumbnail={this.state.videos[index].thumbnail}
          title={this.state.videos[index].title}
          channel={this.state.videos[index].channel} />
        );
    }

    return (
      <div id="playlist">
        {videos}
      </div>
    );
  }
});

const CurrentPlaylist = React.createClass({
  render: function () {
    return (
      <div id="current-playlist">
        <Playlist />
        <Player />
      </div>
    );
  }
});

module.exports = CurrentPlaylist;
