const Timer = React.createClass({
  getInitialState: function () {
    return { secondsToWait: this.props.secondsToWait };
  },
  runTimer: function () {
    this.setState({
      timer: setInterval(() => {
        if (this.state.secondsToWait === 0) clearInterval(timer);

        this.setState({ secondsToWait: this.state.secondsToWait - 1 });
      }, 1000)
    });
  },
  stopTimer: function () {
    clearInterval(this.state.timer);
  },
  componentDidMount: function () {
    this.runTimer();
  },
  componentWillUnmount: function () {
    this.stopTimer();
  },
  render: function () {
    if (this.state.secondsToWait > 0) {
      let unit = (this.state.secondsToWait > 1)? 'seconds': 'second';
      return <p><i className="fa fa-spinner"></i> Waiting {this.state.secondsToWait} {unit}...</p>;
    }

    return <p>Done!</p>;
  }
});
