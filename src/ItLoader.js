function ItLoader (fileData) {
/*
	var mod  = new Module ();
	mod.type = ModTypes.it;
	
	mod.name          = fileData.substring (4, 30);
	mod.songLength    = readWord (fileData, 32);
	mod.sampleCount   = readWord (fileData, 36);
	mod.patternCount  = readWord (fileData, 38);
	mod.defaultVolume = fileData.charCodeAt (48) / 128;
	mod.defaultTempo  = fileData.charCodeAt (50);
	mod.defaultBPM    = fileData.charCodeAt (51);
	
	var nInstruments  = readWord (fileData, 34);
	var formatVersion = readWord (fileData, 42);
	var offset        = 192 + mod.songLength;
	
	// Load default volumes and panning of all channels.
	var channelVolumes = [];
	var channelPans    = [];
	for (var i = 0; i < 64; i ++) {
		channelVolumes.push (fileData.charCodeAt (i + 128) / 64);
		channelPans.push    (fileData.charCodeAt (i + 64)  / 64);
	}
	
	// Load order table and correct song length
	for (var i = 0; i < mod.songLength; i ++) {
		var orderIndex = fileData.charCodeAt (i + 192);
		
		// 0xFE and 0xFF are special order markers, so they will not be included. 
		// This is also why we need to recalculate the song length after reading the order table.
		if (orderIndex < 200) {
			mod.orders.push (orderIndex);
		}
	}
	mod.songLength = mod.orders.length;
	
	var instrumentOffset = readDWord (fileData, offset);
	var sampleOffset     = readDWord (fileData, offset + 4);
	var patternOffset    = readDWord (fileData, offset + 8);
	
	console.log (mod);
	console.log ("Format version is " + formatVersion);
	console.log ("Instrument header located at " + instrumentOffset);
	console.log ("Sample header located at " + sampleOffset);
	console.log ("Pattern header located at " + patternOffset);
	
	if (formatVersion < 512) {
	} else {
		
	}
	
	return mod;
*/
}