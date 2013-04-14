function ModModule (fileData) {
	switch (fileData.substring (1080, 1084)) {
	    case "M.K.":
	    case "FLT4":
	    case "4CHN":
	        this.channels = 4;
	        break;
		case "FLT8":
		case "8CHN":
	 	    this.channels = 8;
	 	    break;
		case "6CHN":
			this.channels = 6;
	 	    break;
		default:
		    this.channels = 4;
	}
	
	this.samples         = [];
	this.patterns        = [];
	this.orderTable      = [];
	this.name            = fileData.substring (0, 20);
	this.orderCount      = fileData.charCodeAt (950);
	this.patternCount    = 0;
	this.restartPosition = fileData.charCodeAt (951);
	
	for (var i = 0; i < 31; i ++) {
	    this.samples[i] = new ModSample (fileData.substring (20 + i * 30, 50 + i * 30));
	}
	
	for (var i = 0; i < 128; i ++) {
	    this.orderTable[i] = fileData.charCodeAt (952 + i);
	    this.patternCount  = Math.max (this.patternCount, this.orderTable[i] + 1);
	}
	
	var patternLength = this.channels * 256;
	for (var i = 0; i < this.patternCount; i ++) {
	    this.patterns[i] = new ModPattern (fileData.substring (1084 + i * patternLength, 1084 + i * patternLength + patternLength));
	}
	
	var filePos = this.patternCount * patternLength + 1084;
	for (var i = 0; i < this.samples.length; i ++) {
	    this.samples[i].loadSample (fileData.substring (filePos, filePos + this.samples[i].dataLength));
	    filePos += this.samples[i].dataLength;
	}
	
	this.notes = {1712: "C-0", 1616: "C#0", 1525: "D-0", 1440: "D#0", 1357: "E-0", 1281: "F-0", 1209: "F#0", 1141: "G-0", 1077: "G#0", 1017: "A-0", 961: "A#0", 907: "B-0",
				   856: "C-1",  808: "C#1",  762: "D-1",  720: "D#1",  678: "E-1",  640: "F-1",  604: "F#1",  570: "G-1",  538: "G#1",  508: "A-1", 480: "A#1", 453: "B-1",
				   428: "C-2",  404: "C#2",  381: "D-2",  360: "D#2",  339: "E-2",  320: "F-2",  302: "F#2",  285: "G-2",  269: "G#2",  254: "A-2", 240: "A#2", 226: "B-2",
				   214: "C-3",  202: "C#3",  190: "D-3",  180: "D#3",  170: "E-3",  160: "F-3",  151: "F#3",  143: "G-3",  135: "G#3",  127: "A-3", 120: "A#3", 113: "B-3",
				   107: "C-4",  101: "C#4",   95: "D-4",   90: "D#4",   85: "E-4",   80: "F-4",   76: "F#4",   71: "G-4",   67: "G#4",   64: "A-4",  60: "A#4",  57: "B-4"};
}