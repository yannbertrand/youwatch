const NoInternetPage = React.createClass({
  render: function () {
    return (
      <div className="jumbotron">
        <h1 className="display-3">You're not connected to the internet</h1>
        <p className="lead">Offline mode is not implemented yet</p>
        <p><i className="fa fa-spinner"></i> Waiting for reconnection...</p>
      </div>
    );
  }
});

module.exports = NoInternetPage;
