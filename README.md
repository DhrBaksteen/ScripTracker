#ScripTracker

A module player in pure JavaScript that plays MOD, S3M and XM files in modern browsers. For a working example see http://scriptracker.cheerful.nl.

Currently the maximum size of a module you can load is about 200kb. The example is able to handle much larger files when loaded from your local machine.

Supported browsers are Chrome, Firefox, Safari and Opera.

##Demo
Check out my stylish player at http://scriptracker.cheerful.nl!

##Install
Download the latest ScripTracker build and include the script in your html file:
```html
<script type="text/javascript" src="scriptracker-0.9.8.min.js"></script>
```

##Usage
Here are some basic usage examples:

####Playing a song
```javascript
var modPlayer = new ScripTracker();
modPlayer.setOnSongLoaded(function() {
	modPlayer.play();
});
modPlayer.load("http://my.website.com/cool_song.xm");
```

####Stopping playback and rewind to beginning
```javascript
modPlayer.stop();
modPlayer.rewind();
```

####Fast forwarding and reversing
```javascript
modPlayer.nextOrder();
modPlayer.prevOrder();
```

####Handling player updates on each row
```javascript
modPlayer.setRowCallbackhandler(function(player) {
	console.log("Current song is " + player.getSongName());
	console.log("Order " + player.getCurrentOrder() + " of " + player.getSongLength());
	console.log("Row " + player.getCurrentRow());
});
```
