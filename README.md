# YouWatch
**Stability: 1 - Experimental**

<p align="center">
    <a href="./media/screenshot-mac.png" title="macOS screenshot"><img src="./media/screenshot-mac.png" alt="macOS screenshot" width="100%"></a>
</p>

<p align="center">
    <a href="./media/screenshot-mac-overlay.png" title="macOS overlay mode screenshot"><img src="./media/screenshot-mac-overlay.png" alt="macOS overlay mode screenshot" width="30%"></a>
    <a href="./media/screenshot-linux-dark-overlay.png" title="Windows/Linux dark overlay mode screenshot"><img src="./media/screenshot-linux-dark-overlay.png" alt="Windows/Linux dark overlay mode screenshot" width="30%"></a>
    <a href="./media/screenshot-fullscreen.png" title="Fullscreen screenshot"><img src="./media/screenshot-fullscreen.png" alt="Fullscreen screenshot" width="30%"></a>
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
    <a href="http://electron.atom.io/" title="Electron website"><img src="http://yann-bertrand.fr/youwatch/electron.svg" alt="Electron icon" width="75%"></a>
</p>

<p align="center">
    <a href="http://gulpjs.com/" title="Gulp website"><img src="http://yann-bertrand.fr/youwatch/gulp.svg" alt="Gulp icon" width="14%"></a>
    <a href="https://facebook.github.io/react/" title="React website"><img src="http://yann-bertrand.fr/youwatch/react.svg" alt="React icon" width="31%"></a>
    <a href="http://sass-lang.com/" title="Sass website"><img src="http://yann-bertrand.fr/youwatch/sass.svg" alt="Sass icon" width="31%"></a>
</p>

## Dev
**Replace the credentials in `src/config.js` with yours.**
Use this command to avoid commiting the file:

`$ git update-index --assume-unchanged src/config.js`

### Commands
* Init: `$ yarn`
* Clean data: `$ yarn run clean`
* Run: `$ yarn start`
* Lint: `$ yarn run test`
* Build OS X: `$ yarn run build:osx`
* Build Linux: `$ yarn run build:linux`
* Build Windows: `$ yarn run build:windows`
* Build all: `$ brew install wine` and `$ yarn run build` *(OS X only)*

## License
MIT © [Yann Bertrand](http://yann-bertrand.fr)
