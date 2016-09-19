const Video = React.createClass({
  getInitialState: function () {
    const isDarkTheme = document.body.classList.contains('dark');

    return {
      loaderUrl: isDarkTheme? 'images/loader_dark.gif' : 'images/loader_white.gif'
    };
  },
  addVideo: function () {
    if (this.props.id) {
      window.dispatchEvent(new CustomEvent('playlist.addVideo', { detail: { video: this.props } }));
      Socket.emit('video/next', this.props);
    }
  },
  markVideoAsWatched: function () {
    console.log('ToDo: markVideoAsWatched');
  },
  cueVideo: function () {
    if (this.props.id) {
      window.dispatchEvent(new CustomEvent('playlist.cueVideo', { detail: { video: this.props } }));
      Socket.emit('video/cue', this.props);
    }
  },
  render: function () {
    return (
      <article className="video col-xl-2 col-lg-3 col-md-4 col-sm-6 col-xs-12">
        <div className="ratio-container">
          <img className="thumbnail lazyload blur-up" data-sizes="auto" data-src={this.props.thumbnail} src={this.state.loaderUrl} />
        </div>
        <span className="duration">{this.props.duration}</span>
        <button className="mark-watched btn btn-secondary btn-sm cue"
                onClick={this.markVideoAsWatched}
                disabled
                title="Mark as watched">x</button>
        <button className="cue btn btn-secondary btn-sm cue"
                onClick={this.cueVideo}
                title="Cue this video">+</button>
        <header>
          <h5>
            <a onClick={this.addVideo} title={this.props.title}>
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
            duration={video.duration}
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
      this.setState({ loading: false, videos: subscriptions });
      window.addEventListener('paste', this.onPaste);
    });
  },
  componentWillUnmount: function () {
    Socket.removeAllListeners('subscriptions/list');
    window.removeEventListener('paste', this.onPaste);
  },
  onPaste: function (event) {
    if (!event.clipboardData.getData('text/plain')) return;

    Socket.emit('video/paste', event.clipboardData.getData('text/plain'));
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

module.exports = SubscriptionsPage;
