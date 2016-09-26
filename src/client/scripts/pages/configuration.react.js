const ConfigurationPage = React.createClass({
  toggleDarkTheme : function(event) {
    var darkTheme = document.body.classList.toggle('dark');

    this.setState({ darkTheme });
  },
  changeLayout: function(event) {
    let layout = event.target.value;

    if(layout == 'overlay') {
      document.body.classList.add('layout-overlay');
      document.body.classList.remove('layout-sticker');
    }
    else if(layout == 'sticker') {
      document.body.classList.remove('layout-overlay');
      document.body.classList.add('layout-sticker');
    }
    else {
      document.body.classList.remove('layout-overlay');
      document.body.classList.remove('layout-sticker');
    }

    this.setState({ layout: layout });
  },
  getInitialState: () => {
    return {
      showConsole: false,
      darkTheme : document.body.classList.contains('dark'),
      layout: document.body.classList.contains('layout-overlay') ? 'overlay' : (document.body.classList.contains('layout-sticker') ? 'sticker' : 'youtube'),
    };
  },
  render: function () {
    return (
      <div className="text-page">
        <h1>Configuration</h1>
        <form>
          <div className="form-group row">
            <label className="col-sm-4">Console</label>
            <div className="col-sm-8">
              <div className="checkbox">
                <label>
                  <input type="checkbox" checked={this.state.value} /> Show console
                </label>
              </div>
            </div>
          </div>
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
                <select className="form-control" value={this.state.layout} onChange={this.changeLayout} >
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
