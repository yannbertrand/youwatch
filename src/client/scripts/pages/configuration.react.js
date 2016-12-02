const React = require('react');

const Switch = require('../components/switch.react.js');
const Utils = require('../utils');

const ConfigurationPage = React.createClass({
  toggleDarkTheme() {
    const darkTheme = document.body.classList.toggle('dark');

    localStorage.setItem('darkTheme', Utils.castBooleanToString(darkTheme));

    this.setState({ darkTheme });
  },
  togglePreferredMode() {
    Utils.togglePreferredMode();

    this.updatePreferredMode();
  },
  changeLayout(event) {
    const layout = event.target.value;

    switch (layout) {
      case 'overlay':
        document.body.classList.add('layout-overlay');
        document.body.classList.remove('layout-sticker');
        break;
      case 'sticker':
        document.body.classList.remove('layout-overlay');
        document.body.classList.add('layout-sticker');
        break;
      default:
        document.body.classList.remove('layout-overlay');
        document.body.classList.remove('layout-sticker');
    }

    localStorage.setItem('layout', layout);
    this.setState({ layout });
  },
  getInitialState() {
    return {
      showConsole: false,
      isDarkThemeActive : Utils.isDarkThemeActive(),
      layout: Utils.getActiveLayout(),
      isFloatOnTopPreferredMode: Utils.isFloatOnTopPreferredMode(),
    };
  },
  componentDidMount() {
    Utils.screen.on('display-added', this.updatePreferredMode);
    Utils.screen.on('display-removed', this.updatePreferredMode);
  },
  componentWillUnmout() {
    Utils.screen.removeAllListeners('display-added');
    Utils.screen.removeAllListeners('display-removed');
  },
  updatePreferredMode() {
    this.setState({ isFloatOnTopPreferredMode: Utils.isFloatOnTopPreferredMode() });
  },
  render() {
    return (
      <div className="text-page">
        <h1>Configuration</h1>
        <form>
          <div className="form-group row">
            <label className="col-sm-4 col-form-label">Dark Theme</label>
            <div className="col-sm-8 col-form-label">
              <Switch
                isChecked={this.state.isDarkThemeActive}
                onChange={this.toggleDarkTheme}
                size="lg"
                textOn="I"
                textOff="O"
                shape="square"
                />
            </div>
          </div>
          <div className="form-group row">
            <label className="col-sm-4 col-form-label">Layout</label>
            <div className="col-sm-8">
              <div className="select">
                <select className="form-control" value={this.state.layout} onChange={this.changeLayout}>
                  <option value="youtube">Youtube</option>
                  <option value="overlay">Overlay</option>
                  <option value="sticker">Sticker</option>
                </select>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <div className="col-sm-2 col-form-label">Preferred mode</div>
            <label className="col-sm-2 col-form-label">
              <span className="pull-right">Fullscreen</span>
            </label>
            <div className="col-sm-1 col-form-label">
              <Switch
                isChecked={this.state.isFloatOnTopPreferredMode}
                onChange={this.togglePreferredMode}
                color="1"
                size="lg"
                shape="square"
                />
            </div>
            <label className="col-sm-7 col-form-label">Float-on-top</label>
          </div>
        </form>
      </div>
    );
  },
});

module.exports = ConfigurationPage;
