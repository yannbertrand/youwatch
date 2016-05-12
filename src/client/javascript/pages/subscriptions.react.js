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
