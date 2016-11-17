# YouWatch
**Stability: 1 - Experimental**

<p align="center">
    <a href="./media/screenshot-mac.png"><img src="./media/screenshot-mac.png" width="100%"></a>
</p>

<p align="center">
    <a href="./media/screenshot-mac-overlay.png"><img src="./media/screenshot-mac-overlay.png" width="30%"></a>
    <a href="./media/screenshot-linux-dark-overlay.png"><img src="./media/screenshot-linux-dark-overlay.png" width="30%"></a>
    <a href="./media/screenshot-fullscreen.png"><img src="./media/screenshot-fullscreen.png" width="30%"></a>
</p>

## Description
YouWatch is a desktop app that improves the official YouTube webapp.

* Gridifcation of the youtube subscriptions page (/feed/subscriptions)
* Create a playlist on the go
* Float-on-top mode

### Still to do

* Monitor on site activity and keeps track of which videos you've watched.
* Save a playlist for future use
* Offline mode

## Stack

<p align="center">
    <a href="http://electron.atom.io/"><img src="http://svgporn.com/logos/electron.svg" width="75%"></a>
</p>

<p align="center">
    <a href="http://gulpjs.com/"><img src="http://svgporn.com/logos/gulp.svg" width="14%"></a>
    <a href="https://facebook.github.io/react/"><img src="http://svgporn.com/logos/react.svg" width="31%"></a>
    <a href="http://sass-lang.com/"><img src="http://svgporn.com/logos/sass.svg" width="31%"></a>
</p>

## Dev
**Replace the credentials in `src/config.js` with yours.**
Use this command to avoid commiting the file:

`$ git update-index --assume-unchanged src/config.js`

### Commands
* Init: `$ npm install`
* Clean data: `$ npm run clean`
* Run: `$ npm start`
* Build OS X: `$ npm run build:osx`
* Build Linux: `$ npm run build:linux`
* Build Windows: `$ npm run build:windows`
* Build all: `$ brew install wine` and `$ npm run build` *(OS X only)*

## License
MIT © [Yann Bertrand](http://yann-bertrand.fr)
