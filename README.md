#ScripTracker

A module player in pure JavaScript that plays MOD, S3M and XM files in modern browsers.

The project comes with a stylish player interface for loading modules from your local machine and monitoring playback as you would expect from any tracker. Check out http://scriptracker.cheerful.nl for a working example. The player alows you to load module files from your local machine. However loading from a URL is supported in code the maximum size is limited to about 200kb.

Supported browsers are Chrome, Firefox, Safari and Opera.

##Usage

To load and play a module:
```javascript
var modPlayer = new ScripTracker();
modPlayer.load("http://mywebsite.com/awesome_tune.xm");
modPlayer.play();
```
