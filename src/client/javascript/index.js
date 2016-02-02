var socket = io('http://localhost:9000');

var Video = React.createClass({
  render: function () {
    return (
      <article className="video col-md-3 col-sm-6 col-xs-12">
        <img className="thumbnail" src={this.props.thumbnail} />
        <header>{this.props.title} <small>{this.props.channel}</small></header>
      </article>
    );
  }
});

var VideoGrid = React.createClass({
  render: function () {
    var videoNodes = this.props.videos.map((video) => {
      return (
        <Video
          key={video.key}
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

var SubscriptionPage = React.createClass({
  loadSubscriptions: function () {
    // ToDo
  },
  getInitialState: function () { return { videos: [] }; },
  componentDidMount: function () {
    this.loadSubscriptions();

    setTimeout(() => {
      this.setState({
        videos: [{
          key: 'xfDX5AkMoyM',
          title: 'Practical Skills: The Smart Automatic Mining System [Vanilla Survival]',
          channel: 'Mumbo Jumbo',
          thumbnail: 'https://i.ytimg.com/vi_webp/xfDX5AkMoyM/mqdefault.webp'
        }, {
          key: 'V8tiGnCrc4g',
          title: '30 Protein Pancakes in 2 Minutes',
          channel: 'Furious Pete',
          thumbnail: 'https://i.ytimg.com/vi_webp/V8tiGnCrc4g/mqdefault.webp'
        }]
      });
    }, 1000);
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


socket.on('youtube/callback', function (token) {
  ReactDOM.render(
    <SubscriptionPage />,
    document.getElementById('main')
  );

  gapi.auth.setToken(token);
  gapi.client.load('youtube', 'v3');
});


