const ConfigurationPage = React.createClass({
  toggleDarkTheme: function () {
    const darkTheme = document.body.classList.toggle('dark');

    localStorage.setItem('darkTheme', castBooleanToString(darkTheme));

    this.setState({ darkTheme });
  },
  changeLayout: function (event) {
    let layout = event.target.value;

    switch (layout) {
      case 'overlay':
        document.body.classList.add('layout-overlay');
        document.body.classList.remove('layout-sticker');
        localStorage.setItem('layout', 'overlay');
        break;
      case 'sticker':
        document.body.classList.remove('layout-overlay');
        document.body.classList.add('layout-sticker');
        localStorage.setItem('layout', 'sticker');
        break;
      default:
        document.body.classList.remove('layout-overlay');
        document.body.classList.remove('layout-sticker');
        localStorage.setItem('layout', 'youtube');
    };

    this.setState({ layout: layout });
  },
  getInitialState: () => {
    return {
      showConsole: false,
      darkTheme : isDarkThemeActive(),
      layout: getActiveLayout(),
    };
  },
  render: function () {
    return (
      <div className="text-page">
        <h1>Configuration</h1>
        <form>
          <div className="form-group row">
            <label className="col-sm-4">Dark Theme</label>
            <div className="col-sm-8">
              <div className="checkbox">
                <label>
                  <input type="checkbox" checked={this.state.darkTheme} onChange={this.toggleDarkTheme} /> Dark theme
                </label>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <label className="col-sm-4">Layout</label>
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
        </form>
      </div>
    );
  }
});

module.exports = ConfigurationPage;
