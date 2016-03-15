const Socket = io('http://localhost:@@PORT');
const mainElement = document.getElementById('main');

/* Subscriptions Page */
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
  watchVideo: function () {
    if (this.props.id) {
      Socket.emit('video/watch', this.props);
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
      Socket.emit('video/watch', this.props);
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

    return <h4>Nothing to show at the moment</h4>
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

/* Authentification */

const AuthentificationPage = React.createClass({
  getInitialState: function () { return { loading: false }; },
  openAuthWindow: function () {
    this.setState({ loading: true });
    Socket.emit('youtube/auth');
  },
  render: function () {
    if (this.state.loading) {
      return (
        <div className="jumbotron">
          <h1 className="display-3">YouWatch</h1>
          <p className="lead">Please fulfill the informations on the other window</p>
          <p className="lead">
            <button className="btn btn-primary btn-lg disabled">Logging in...</button>
          </p>
        </div>
      );
    }

    return (
      <div className="jumbotron">
        <h1 className="display-3">YouWatch</h1>
        <p className="lead">Let's connect to your YouTube Account</p>
        <p className="lead">
          <button className="btn btn-primary btn-lg" onClick={this.openAuthWindow}>Log in</button>
        </p>
      </div>
    );
  }
});

/* Authentification */

/* No Internet */

const NoInternetPage = React.createClass({
  getInitialState: function () {
    return { i: 1000, loading: false, connected: false };
  },
  tryToReconnect: function () {
    this.setState((state) => {
      return {
        i: state.i,
        loading: false,
        connected: false
      }
    });

    setTimeout(() => {
      this.setState((state) => {
        return {
          i: (state.i === 64000)? 64000: state.i*2,
          loading: true,
          connected: false
        };
      });
      Socket.emit('internet/reconnect');
    }, this.state.i);
  },
  reconnected: function () {
    this.setState({ i: 0, loading: false, connected: true });
  },
  componentDidMount: function () {
    this.tryToReconnect();

    Socket.on('internet/notconnected', this.tryToReconnect);
    Socket.on('internet/reconnected', this.reconnected);
  },
  render: function () {
    if (this.state.connected) {
      return (
        <div className="jumbotron">
          <h1 className="display-3">You're now connected to the internet</h1>
          <p className="lead"><i className="fa fa-spinner"></i> Reloading the app</p>
        </div>
      );
    }

    let loadingString = '';
    if (this.state.loading) {
      loadingString = <p><i className="fa fa-spinner"></i> Trying to reconnect...</p>;
    } else {
      loadingString = <Timer secondsToWait={this.state.i / 1000} />;
    }

    return (
      <div className="jumbotron">
        <h1 className="display-3">You're not connected to the internet</h1>
        <p className="lead">Offline mode is not implemented yet</p>
        {loadingString}
      </div>
    );
  }
});

/* No Internet */

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
