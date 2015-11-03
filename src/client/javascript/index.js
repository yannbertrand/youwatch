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
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    var that = this;
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        that.setState({ data: xhr.response });
      }
    }

    xhr.open('GET', './fixtures.json');
    xhr.responseType = 'json';
    xhr.send();
  },
  render: function () {
    var videoNodes = this.state.data.map(function (video) {
      return (
        <Video
          key={video.key}
          thumbnail={'images/' + video.thumbnail + '.webp'}
          title={video.title}
          channel={video.channel} />
      );
    })
    
    return (
      <section id="videos-grid" className="row">
        {videoNodes}
      </section>
    );
  }
});

ReactDOM.render(
  <VideoGrid />,
  document.getElementById('main')
);