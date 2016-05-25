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
          i: (state.i === 60000)? 60000: state.i+1000,
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

module.exports = NoInternetPage;
