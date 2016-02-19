const Socket = io('http://localhost:9000');

const CurrentVideo = React.createClass({
  render: function () {
    return (
      <iframe id="current-video"
              src={this.props.src}
              frameBorder="0" allowFullScreen>
      </iframe>
    );
  }
});

const PlaylistItem = React.createClass({
  render: function () {
    return (
      <div>
        <h5 className="title" onClick={this.watchVideo}>{this.props.title}</h5>
        <h6>{this.props.channel}</h6>
      </div>
    );
  }
});

const Playlist = React.createClass({
  render: function () {
    let videos = this.props.videos.map((video) => {
      return (
        <PlaylistItem
          key={video.id}
          id={video.id}
          thumbnail={video.thumbnail}
          title={video.title}
          channel={video.channel} />
      );
    });

    return (
      <div id="playlist">
        {videos}
      </div>
    );
  }
});

const CurrentPlaylist = React.createClass({
  getInitialState: () => { return { videos: [], currentVideoSrc: null }; },
  componentDidMount: function () {
    Socket.on('playlist/update', (playlist) => {
      this.setState((state) => {
        return {
          videos: playlist,
          currentVideoSrc: state.currentVideoSrc
        };
      });
    });

    Socket.on('video/watch', (id) => {
      this.setState((state) => {
        return {
          videos: state.videos,
          currentVideoSrc: 'https://www.youtube.com/embed/' + id
        };
      });
    });
  },
  render: function () {
    return (
      <div id="current-playlist">
        <Playlist videos={this.state.videos} />
        <CurrentVideo src={this.state.currentVideoSrc} />
      </div>
    );
  }
});

const Video = React.createClass({
  watchVideo: function () {
    if (this.props.id) {
      Socket.emit('video/watch', this.props)
    }
  },
  render: function () {
    return (
      <article className="video col-md-3 col-sm-6 col-xs-12">
        <img className="img-rounded" src={this.props.thumbnail} />
        <header>
          <h5 className="title" onClick={this.watchVideo}>{this.props.title}</h5>
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

    return <h4>Nothing to show at the moment</h4>
  }
});

const SubscriptionPage = React.createClass({
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
        <div>
          <h1>You are connected</h1>
          <h3>Let us load your data...</h3>
        </div>
      );
    }
    
    return (
      <div>
        <h3>Your subscriptions</h3>
        <VideoGrid videos={this.state.videos} />
        <CurrentPlaylist />
      </div>
    );
  }
});


Socket.on('youtube/notauthenticated', function () {
  function openAuthWindow() {
    // _btn.toElement.disabled = true;

    // document.getElementById('status').innerHTML = 'Loading...';

    Socket.emit('youtube/auth');
  };

  ReactDOM.render(
    (
      <div>
        <button id="open-auth-window" className="btn btn-primary btn-lg" onClick={openAuthWindow}>Connect</button><br />
        <span id="status"></span>
      </div>
    ),
    document.getElementById('main')
  );
});

Socket.on('youtube/callback', function (token) {
  ReactDOM.render(
    <SubscriptionPage />,
    document.getElementById('main')
  );

  gapi.auth.setToken(token);
  gapi.client.load('youtube', 'v3');
});


