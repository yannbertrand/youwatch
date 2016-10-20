const React = require('react');

const NoInternetPage = React.createClass({
  render() {
    return (
      <div className="text-page">
        <div className="jumbotron">
          <h1 className="display-3">{'You\'re not connected to the internet'}</h1>
          <p className="lead">Offline mode is not implemented yet</p>
          <p><i className="fa fa-spinner" /> Waiting for reconnection...</p>
        </div>
      </div>
    );
  },
});

module.exports = NoInternetPage;
