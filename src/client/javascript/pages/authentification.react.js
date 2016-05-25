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

module.exports = AuthentificationPage;
