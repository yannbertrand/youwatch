const React = require('react');

const Switch = React.createClass({

  propTypes: {
    beforeText: React.PropTypes.string,
    afterText: React.PropTypes.string,
    size: React.PropTypes.string,
    color: React.PropTypes.string,
    shape: React.PropTypes.string,
    isChecked: React.PropTypes.bool,
    onChange: React.PropTypes.func,
    textOn: React.PropTypes.string,
    textOff: React.PropTypes.string,
  },

  render() {
    // Space between switch & labels
    const beforeText = (this.props.beforeText) ? this.props.beforeText + ' ' : '';
    const afterText = (this.props.afterText) ? ' ' + this.props.afterText : '';

    // main classes to determine the switch shape, color, size
    let mainClasses = ['z-switch'];

    // size
    if (this.props.size === 'lg') mainClasses.push('z-switch-lg');
    if (this.props.size === 'sm') mainClasses.push('z-switch-sm');

    // color
    if (this.props.color === '1') mainClasses.push('z-switch-color1');
    if (this.props.color === '2') mainClasses.push('z-switch-color2');

    // shape
    if (this.props.shape === 'square') mainClasses.push('z-switch-square');
    if (this.props.shape === 'tictac') mainClasses.push('z-switch-tictac');

    mainClasses = mainClasses.join(' ');

    return (
      <label className={mainClasses}>

        {beforeText}

        <input type="checkbox" checked={this.props.isChecked} onChange={this.props.onChange} />

        <div className="z-switch--container">
          <div className="z-switch--slider" data-on={this.props.textOn} data-off={this.props.textOff} />
        </div>

        {afterText}

      </label>
    );
  },
});

module.exports = Switch;
