const Socket = io('http://localhost:@@PORT');
const mainElement = document.getElementById('main');

/* Subscriptions Page */
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
      }
    })
    this.state.player.cueVideoById(id);
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
  },
  render: function () {
    return <div id="player"></div>;
  }
});

const PlaylistItem = React.createClass({
  watchVideo: function () {
    if (this.props.id) {
      Socket.emit('video/cue', this.props);
    }
  },
  render: function () {
    return (
      <div>
        <div className="playlist-item">
          <h5>
            <a onClick={this.watchVideo} title={this.props.title}>
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

const Video = React.createClass({
  watchVideo: function () {
    if (this.props.id) {
      Socket.emit('video/cue', this.props);
    }
  },
  render: function () {
    return (
      <article className="video col-md-3 col-sm-6 col-xs-12">
        <div className="ratio-container">
          <img className="thumbnail lazyload blur-up" data-sizes="auto" data-src={this.props.thumbnail} src="images/loader.gif" />
        </div>
        <header>
          <h5>
            <a onClick={this.watchVideo} title={this.props.title}>
              {this.props.title}
            </a>
          </h5>
          <h6>{this.props.channel}</h6>
        </header>
      </article>
    );
  }
});

const VideoGrid = React.createClass({
  render: function () {
    if (this.props.videos.length) {
      let videoNodes = this.props.videos.map((video) => {
        return (
          <Video
            key={video.id}
            id={video.id}
            thumbnail={video.thumbnail}
            title={video.title}
            channel={video.channel} />
        )
      });

      return (
        <section id="videos-grid" className="row">
          {videoNodes}
        </section>
      );
    }

    return <h4>Nothing to show at the moment</h4>;
  }
});

const SubscriptionsPage = React.createClass({
  getInitialState: function () { return { loading: true, videos: null }; },
  componentDidMount: function () {
    Socket.emit('subscriptions/list');
    Socket.on('subscriptions/list', (subscriptions) => {
      this.setState({ loading: false, videos: subscriptions })
    });
  },
  render: function () {
    if (this.state.loading) {
      return (
        <div className="jumbotron">
          <h1 className="display-3">Let us load your data</h1>
          <p className="lead">You are connected to the YouTube API</p>
          <p>It may take a while</p>
        </div>
      );
    }
    
    return (
      <div>
        <VideoGrid videos={this.state.videos} />
        <CurrentPlaylist />
      </div>
    );
  }
});

/* Subscriptions Page */

Socket.on('internet/notconnected', function () {
  ReactDOM.render(
    <NoInternetPage />,
    mainElement
  );
})

Socket.on('youtube/notauthenticated', function () {
  ReactDOM.render(
    <AuthentificationPage />,
    mainElement
  );
});

Socket.on('youtube/callback', function (token) {
  ReactDOM.render(
    <SubscriptionsPage />,
    mainElement
  );
});

Socket.on('app/reloading', function (page) {
  // ToDo go on page
});
