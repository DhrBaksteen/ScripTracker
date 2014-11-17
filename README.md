#ScripTracker

A module player in pure JavaScript that plays MOD, S3M and XM files in modern browsers.

The project comes with a stylish player interface for loading modules from your local machine and monitoring playback as you would expect from any tracker. Check out http://scriptracker.cheerful.nl for a working example. The player alows you to load module files from your local machine. However loading from a URL is supported in code the maximum size is limited to about 200kb.

Supported browsers are Chrome, Firefox, Safari and Opera.

##Usage

Required source files (until I minimize stuff):
```html
<script type="text/javascript" src="js/ScripTracker.js"></script>
<script type="text/javascript" src="js/Enums.js"></script>
<script type="text/javascript" src="js/Module.js"></script>
<script type="text/javascript" src="js/Pattern.js"></script>
<script type="text/javascript" src="js/Instrument.js"></script>
<script type="text/javascript" src="js/Sample.js"></script>
<script type="text/javascript" src="js/Effects.js"></script>
<script type="text/javascript" src="js/Envelope.js"></script>
<script type="text/javascript" src="js/ModLoader.js"></script>
<script type="text/javascript" src="js/S3mLoader.js"></script>
<script type="text/javascript" src="js/XmLoader.js"></script>
```

To load and play a module:
```javascript
var modPlayer = new ScripTracker();
modPlayer.load("http://mywebsite.com/awesome_tune.xm");
modPlayer.play();
```
