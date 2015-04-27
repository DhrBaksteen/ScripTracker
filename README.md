#ScripTracker

A module player in pure JavaScript that plays MOD, S3M and XM files in modern browsers. For a working example see http://scriptracker.cheerful.nl.

Supported browsers are Chrome, Firefox, Safari and Opera.

Current version is 1.0.0

##Demo
Check out my stylish player at http://scriptracker.cheerful.nl!

##Install
Download the latest ScripTracker build and include the script in your html file:
```html
<script type="text/javascript" src="scriptracker-1.0.0.min.js"></script>
```

##Usage
Here are some basic usage examples. More API documentation will follow...

####Playing a song
```javascript
function onSongLoaded(player) {
    player.play();
}

var modPlayer = new ScripTracker();
modPlayer.on(ScripTracker.Events.playerReady, onSongLoaded);
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

####Event Handling
The following events are available...

#####Module loaded, player ready
The ```playerReady ``` event is dispatched whenever a new module is fully loaded and ScripTracker is ready to start playback. The event handler always receives the player instance on which the song can be played, song name and number of orders. Playback of a song can only be started after the ```playerReady``` event has been received.
```javascript
function onSongLoaded(player, songName, songLength) {
    console.log("Song '" + songName + "' ready to be played (" + songLength + " orders).");
    player.play();
}

var modPlayer = new ScripTracker();
modPlayer.on(ScripTracker.Events.playerReady, onSongLoaded);
modPlayer.load("http://my.website.com/cool_song.xm");
```

#####Playback started
ScripTracker dispatches the ```play``` event when song playback has started or resumed after it was stopped before.
```javascript
modPlayer.on(ScripTracker.Events.play, onPlay);
function onPlay(player) {
    console.log("Playback has started, enjoy the music! :)");
}
```

#####Playback stopped
When playback is stopped ScripTracker dispatches the ```stop``` event with the player instance that has stopped.
```javascript
modPlayer.on(ScripTracker.Events.stop, onStop);
function onStop(player) {
    console.log("Playback has stopped.");
}
```

#####Song end reached
When the end of a song is reached or the song repeats the ```songEnded``` event is dispatched.
```javascript
modPlayer.on(ScripTracker.Events.songEnded, onSongEnd);
function onSongEnd(player) {
    console.log("Song has ended.");
}
```

#####New order starts
The first tick of the irst row of a pattern triggers the ```order``` event. It can be used to detect song progress and receives the current order number, total number of orders in the song and pattern index as additional parameters to the player instance.
```javascript
modPlayer.on(ScripTracker.Events.order, onOrder);
function onOrder(player, currentOrder, songLength, patternIndex) {
    console.log("Playing order " + currentOrder + " of " + songLength + " (Pattern " + patternndex + ").");
}
```

#####Player row changes
To detect a new row being played ScripTracker dispatches the ```row``` event. It receives the current ScripTracker instance, current row index an the number of rows in the current pattern as parameters.
```javascript
modPlayer.on(ScripTracker.Events.row, onRow);
function onRow(player, currentRow, patternRows) {
    console.log("Row " + currentRow + " of " + patternRows + ".");
}
```

#####Instrument trigger detection
ScripTracker can dispatch an event when a certain instrument is triggered with the ```instrument``` event. Setting up this event requires one additional parameter to set the instrument number ScripTracker will listen to. When an ```instrument``` event is sent you will get the following parameters besides the ScripTracker instance: instrumentNumber, channel, note, effect, effectParameter.
```javascript
modPlayer.on(ScripTracker.Events.instrument, 3, onInstrument);
function onInstrument(player, instrument, channel, note, effect, effectParam) {
    console.log("Instrument " + instrument + " playing note " + note + " on channel " + channel + ".");
}
```

#####Effect trigger detection
Besides listening to instrument triggers ScripTracker can also listen for effects being triggered with the ```effect``` event. To set up this event an additional effect parameter is required to which ScripTracker will listen. Besides the ScripTracker instance you will receive the effect, effectParameter, channel, instrumentNumber and note parameters when the ```effect``` event is dispatched.
```javascript
modPlayer.on(ScripTracker.Events.effect, Effects.SET_VOLUME, onEffect);
function onEffect(player, effect, effectParam, channel, instrument, note) {
    console.log("Setting volume of instrument " + instrument + " on channel " + channel + " to " + effectParam + ".");
}
```

#####Removing an event handler
To remove an event handler use the ```off``` function with the event and handler to remove. If the handler is omitted all handlers of the given event are removed. The ```instrument``` and ```effect``` events also require the additional instrument number or effect to be defined.
```javascript
modPlayer.off(ScripTracker.Events.play, onPlay);
modPlayer.off(ScripTracker.Events.row);
modPlayer.off(ScripTracker.Events.instrument, 3, onInstrument);
modPlayer.off(ScripTracker.Events.effect, Effects.SET_VOLUME, onEffect);
```
