const Timer = React.createClass({
  getInitialState: function () {
    return { secondsToWait: this.props.secondsToWait };
  },
  runTimer: function () {
    let timer = setInterval(() => {
      if (this.state.secondsToWait === 0) clearInterval(timer);

      this.setState({ secondsToWait: this.state.secondsToWait - 1 });
    }, 1000);
  },
  componentDidMount: function () {
    this.runTimer();
  },
  render: function () {
    if (this.state.secondsToWait > 0) {
      let unit = (this.state.secondsToWait > 1)? 'seconds': 'second';
      return <p><i className="fa fa-spinner"></i> Waiting {this.state.secondsToWait} {unit}...</p>;
    }

    return <p>Done!</p>;
  }
});
