function S3mModule (fileData) {
	if (fileData.substring (44, 48) != "SCRM") {
		throw ("This is not a Scream Tracker III module!");
	}

	this.name         = fileData.substring (0, 28);
	this.orderCount   = fileData.charCodeAt (32) + fileData.charCodeAt (33) * 256;
	this.sampleCount  = fileData.charCodeAt (34) + fileData.charCodeAt (35) * 256;
	this.patternCount = fileData.charCodeAt (36) + fileData.charCodeAt (37) * 256;

	this.volumeSlideFlag = (fileData.charCodeAt (38) & 0x40) != 0 || fileData.charCodeAt (40) == 0x00;
	this.globalVolume = fileData.charCodeAt (48) / 64.0;
	this.initialSpeed = fileData.charCodeAt (49) == 0 ?   6 : fileData.charCodeAt (49);
	this.initialTempo = fileData.charCodeAt (50) < 33 ? 125 : fileData.charCodeAt (50);
	this.masterVolume = fileData.charCodeAt (51) / 64.0;

	// Load order table.
	this.orderTable = [];
	for (var i = 0; i < this.orderCount; i ++) {
		this.orderTable[i] = fileData.charCodeAt (96 + i);
	}

	var samplePtrOffset  = 96 + this.orderCount;
    var patternPtrOffset = 96 + this.orderCount + this.sampleCount * 2;

	// Load samples.
	this.samples = [];
	for (var i = 0; i < this.sampleCount; i ++) {
		var sampleOffset = (fileData.charCodeAt (samplePtrOffset + i * 2) + fileData.charCodeAt (samplePtrOffset + i * 2 + 1) * 256) * 16;
		this.samples[i] = new S3mSample (fileData.substring (sampleOffset, sampleOffset + 80));
	}

	// Load patterns.
	this.patterns = [];
	for (var i = 0; i < this.patternCount; i ++) {
        var patternOffset = (fileData.charCodeAt (patternPtrOffset + i * 2) + fileData.charCodeAt (patternPtrOffset + i * 2 + 1) * 256) * 16;
		var patternLength = fileData.charCodeAt (patternOffset) + fileData.charCodeAt (patternOffset + 1) * 256;
		this.patterns[i] = new S3mPattern (fileData.substring (patternOffset, patternOffset + patternLength));
	}
}


function S3mSample (sampleData) {
	if (sampleData.charCodeAt (0) != 0x01) return;

	this.dataOffset = sampleData.charCodeAt (13) + sampleData.charCodeAt (14) * 256 + sampleData.charCodeAt (15) * 65536;
	this.dataLength = sampleData.charCodeAt (16) + sampleData.charCodeAt (17) * 256;
	this.loopBegin  = sampleData.charCodeAt (20) + sampleData.charCodeAt (21) * 256;
	this.loopEnd    = sampleData.charCodeAt (24) + sampleData.charCodeAt (25) * 256;
	this.volume     = sampleData.charCodeAt (28) / 64.0;
	this.isLooped   = (sampleData.charCodeAt (31) & 0x01) != 0;
	this.isStereo   = (sampleData.charCodeAt (31) & 0x02) != 0;
	this.is16Bit    = (sampleData.charCodeAt (31) & 0x04) != 0;
	this.cPeriod    = sampleData.charCodeAt (32) + sampleData.charCodeAt (33) * 256;
	this.name       = sampleData.substring (48, 76);

	this.sampleLeft  = [];
	this.sampleRight = [];
}


function S3mPattern (patternData) {
	this.note        = [];
	this.octave      = [];
	this.sample      = [];
	this.volume      = [];
	this.command     = [];
	this.commandData = [];

	for (var i = 0; i < 32; i ++) {
		this.note[i]        = [];
		this.octave[i]      = [];
		this.sample[i]      = [];
		this.volume[i]      = [];
		this.command[i]     = [];
		this.commandData[i] = [];

		for (var j = 0; j < 64; j ++) {
			this.note[i][j]        = 255;
			this.octave[i][j]      = 255;
			this.sample[i][j]      = 0;
			this.volume[i][j]      = 255;
			this.command[i][j]     = 255;
			this.commandData[i][j] = 0;
		}
	}

	// Decompress pattern data.
	var pos = 2;
	for (var i = 0; i < 64; i ++) {
		var data = patternData.charCodeAt (pos);

		if (data != 0x00) {
			var channel = data & 0x1F;

			if ((data & 0x20) != 0) {
				pos ++;
				if (patternData.charCodeAt (pos) != 0xFF) {
					this.octave[channel][i] = Math.floor (patternData.charCodeAt (pos) / 16);
                	this.note[channel][i]   = patternData.charCodeAt (pos) % 16;
				} else {
                    this.octave[channel][i] = 255;
                	this.note[channel][i]   = 255;
				}

				pos ++;
				this.sample[channel][i] = patternData.charCodeAt (pos);
			}

			if ((data & 0x40) != 0) {
				pos ++;
				this.volume[channel][i] = patternData.charCodeAt (pos) / 64.0;
				if (this.volume[channel][i] > 1.0) {
                    this.volume[channel][i] = 255;
				}
			}

			if ((data & 0x80) != 0) {
				pos ++;
				this.command[channel][i] = patternData.charCodeAt (pos);
				pos ++;
                this.commandData[channel][i] = patternData.charCodeAt (pos);
			}
		}

		notes = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
		notes[254] = "==";
		/*
		console.log (i + " " +
			((this.note[0][i] != 255) ? notes[this.note[0][i]] + "" + this.octave[0][i] + " " + this.sample[0][i] : "... ..") + " " +
			((this.volume[0][i] != 255) ? Math.round (this.volume[0][i] * 64) : "..") + " " +
			((this.command[0][i] != 255) ? this.command[0][i] + " " + this.commandData[0][i] : ". .."));
		*/
		pos ++;
	}
}