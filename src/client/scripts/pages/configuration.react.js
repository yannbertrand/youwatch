const ConfigurationPage = React.createClass({
  setWidth: function (event) {
    let width = event.target.value;

    this.setState(state => {
      return {
        width: width,
        height: state.height,
        showConsole: state.showConsole,
        darkTheme : state.darkTheme,
        layout: state.layout,
      };
    });
  },
  setHeight: function (event) {
    let height = event.target.value;

    this.setState(state => {
      return {
        width: state.width,
        height: height,
        showConsole: state.showConsole,
        darkTheme : state.darkTheme,
        layout: state.layout,
      };
    });
  },
  toggleDarkTheme : function(event) {
    var darkTheme = document.body.classList.toggle('dark')

    this.setState(state => {
      return {
        width: state.width,
        height: state.height,
        showConsole: state.showConsole,
        darkTheme : darkTheme,
        layout: state.layout,
      }
    })
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

    this.setState(state => {
      return {
        width: state.width,
        height: state.height,
        showConsole: state.showConsole,
        darkTheme : state.darkTheme,
        layout: layout,
      };
    })
  },
  getInitialState: () => {
    return {
      width: 1500,
      height: 900,
      showConsole: false,
      darkTheme : document.body.classList.contains('dark'),
      layout: document.body.classList.contains('layout-overlay') ? 'overlay' : (document.body.classList.contains('layout-sticker') ? 'sticker' : 'youtube'),
    };
  },
  render: function () {
    return (
      <div>
        <h1>Configuration</h1>
        <form>
          <div className="form-group row">
            <label htmlFor="width" className="col-sm-4 form-control-label">Width</label>
            <div className="col-sm-8">
              <input type="number" className="form-control" id="width" value={this.state.width} onChange={this.setWidth} />
            </div>
          </div>
          <div className="form-group row">
            <label htmlFor="height" className="col-sm-4 form-control-label">Height</label>
            <div className="col-sm-8">
              <input type="number" className="form-control" id="height" value={this.state.height} onChange={this.setHeight} />
            </div>
          </div>
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
          <div className="form-group row">
            <div className="col-sm-offset-4 col-sm-8">
              <button type="submit" className="btn btn-primary" disabled>Save</button>
            </div>
          </div>
        </form>
      </div>
    );
  }
});

module.exports = ConfigurationPage;
