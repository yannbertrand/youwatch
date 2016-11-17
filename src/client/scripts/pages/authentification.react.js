const React = require('react');

const Utils = require('../utils');

const AuthentificationPage = React.createClass({
  propTypes: {
    error: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.object,
      React.PropTypes.array,
    ]),
  },
  getInitialState() { return { loading: false }; },
  openAuthWindow() {
    this.setState({ loading: true });
    Utils.Socket.emit('youtube/auth');
  },
  renderError() {
    if (this.props.error) {
      return (
        <div className="alert alert-danger" role="alert">
          <code>{this.props.error}</code>
        </div>
      );
    }
  },
  render() {
    if (this.state.loading) {
      return (
        <div className="text-page">
          <div className="jumbotron">
            <h1 className="display-3">YouWatch</h1>
            <p className="lead">Please fulfill the informations on the other window</p>
            <p className="lead">
              <button className="btn btn-primary btn-lg disabled"><i className="fa fa-spinner fa-pulse" /> Logging in...</button>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="text-page">
        <div className="jumbotron">
          <h1 className="display-3">YouWatch</h1>
          {this.renderError}
          <p className="lead">{'Let\'s connect to your YouTube Account'}</p>
          <p className="lead">
            <button className="btn btn-primary btn-lg" onClick={this.openAuthWindow}>Log in</button>
          </p>
        </div>
      </div>
    );
  },
});

module.exports = AuthentificationPage;
