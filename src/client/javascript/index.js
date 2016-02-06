const Socket = io('http://localhost:9000');

const Video = React.createClass({
  render: function () {
    return (
      <article className="video col-md-3 col-sm-6 col-xs-12">
        <img className="thumbnail" src={this.props.thumbnail} />
        <header>{this.props.title} <small>{this.props.channel}</small></header>
      </article>
    );
  }
});

const VideoGrid = React.createClass({
  render: function () {
    let videoNodes = this.props.videos.map((video) => {
      return (
        <Video
          key={video.id}
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
});

const SubscriptionPage = React.createClass({
  loadSubscriptions: function () {
    // ToDo
    Socket.emit('subscriptions/list');
    Socket.on('subscriptions/list', (subscriptions) => {
      this.setState({ videos: subscriptions })
    });
  },
  getInitialState: function () { return { videos: [] }; },
  componentDidMount: function () {
    this.loadSubscriptions();
  },
  render: function () {
    if (this.state.videos.length) {
      return (
        <div>
          <h3>Your subscriptions</h3>
          <VideoGrid videos={this.state.videos} />
        </div>
      );
    }
    
    return (
      <div>
        <h1>You are connected</h1>
        <h3>Let us load your data...</h3>
      </div>
    );
  }
});


var openAuthWindow = function (_btn) {
  _btn.toElement.disabled = true;

  document.getElementById('status').innerHTML = 'Loading...';

  Socket.emit('youtube/auth');
}

Socket.on('youtube/notauthenticated', function () {
  ReactDOM.render(
    (
      <div>
        <button id="open-auth-window" class="btn btn-primary btn-lg" onclick="openAuthWindow()">Connect</button><br />
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


