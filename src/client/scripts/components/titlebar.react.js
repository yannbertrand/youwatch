const {remote} = require('electron');

const MacTitlebar = React.createClass({

  render() {

    return (

      <div id="titlebar" data-platform={this.props.platform}>
        <div className="titlebar--text">
          YouWatch
        </div>
      </div>

    );

  },

});

const WindowsTitlebar = React.createClass({

  minimize() {
    this.state.window.minimize();
  },

  maximize() {
    if (!this.state.window.isMaximized())
      this.state.window.maximize();
    else
      this.state.window.unmaximize();
  },

  quit() {
    this.state.window.close();
  },

  getInitialState() {
    return {
      window: remote.getCurrentWindow()
    };
  },

  render() {

    return (

      <div id="titlebar" data-platform={this.props.platform}>

        <div className="titlebar--text">
          <img className="titlebar--icon" src="images/icon.png" />
          YouWatch
        </div>

        <div className="titlebar--controls-wrapper">
          <div className="titlebar--controls-minimize" onClick={this.minimize()}>
            <span></span>
          </div>

          <div className="titlebar--controls-maximize" onClick={this.maximize()}>
            <span></span>
            <span className="bar2"></span>
          </div>

          <div className="titlebar--controls-close" onClick={this.quit()}>
            <span></span>
            <span className="bar2"></span>
          </div>
        </div>

      </div>

    );

  },

});

const Titlebar = React.createClass({

  render() {

    if (this.props.platform === 'darwin')
      return <MacTitlebar platform={this.props.platform} />;
    else
      return <WindowsTitlebar platform={this.props.platform} />;

  },

});

module.exports = Titlebar;