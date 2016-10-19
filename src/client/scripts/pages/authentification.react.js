const AuthentificationPage = React.createClass({
  getInitialState() { return { loading: false }; },
  openAuthWindow() {
    this.setState({ loading: true });
    Socket.emit('youtube/auth');
  },
  render() {
    if (this.state.loading) {
      return (
        <div className="text-page">
          <div className="jumbotron">
            <h1 className="display-3">YouWatch</h1>
            <p className="lead">Please fulfill the informations on the other window</p>
            <p className="lead">
              <button className="btn btn-primary btn-lg disabled">Logging in...</button>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="text-page">
        <div className="jumbotron">
          <h1 className="display-3">YouWatch</h1>
          <p className="lead">Let's connect to your YouTube Account</p>
          <p className="lead">
            <button className="btn btn-primary btn-lg" onClick={this.openAuthWindow}>Log in</button>
          </p>
        </div>
      </div>
    );
  },
});

module.exports = AuthentificationPage;
