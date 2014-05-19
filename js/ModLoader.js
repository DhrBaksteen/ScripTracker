/**
 * Load MOD file data as a Module so it can be played by ScripTracker.
 *
 * fileData - String contents of the MOD file.
 */
 /**
  * @expose
  */
function ModLoader (fileData) {
	var mod = new Module ();
	mod.type = ModTypes.mod;

	// Note period lookup table.
	var notePeriods = [1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960, 906,
	 				   856 , 808 , 762 , 720 , 678 , 640 , 604 , 570 , 538 , 508 , 480, 453,
	 				   428 , 404 , 381 , 360 , 339 , 320 , 302 , 285 , 269 , 254 , 240, 226,
	 				   214 , 202 , 190 , 180 , 170 , 160 , 151 , 143 , 135 , 127 , 120, 113,
	 				   107 , 101 , 95  , 90  , 85  , 80  , 75  , 71  , 67  , 63  , 60 , 56 ];

	// Find out the number of channels in this mod.
    switch (fileData.substring (1080, 1084)) {
    	case "6CHN":
			mod.channels = 6;
	 	    break;
		case "FLT8":
		case "8CHN":
		case "CD81":
		case "OKTA":
	 	    mod.channels = 8;
	 	    break;
		case "16CN":
			mod.channels = 16;
			break;
		case "32CN":
			mod.channels = 32;
			break;
		default:
		    mod.channels = 4;
			break;
	}

	// Load general module info.
	mod.name            = fileData.substring  (0, 20);
	mod.songLength      = fileData.charCodeAt (950);
	mod.restartPosition = fileData.charCodeAt (951);

	// Create samples and add them to the module.
    for (var i = 0; i < 31; i ++) {
		var sampleHeader = fileData.substring (20 + i * 30, 50 + i * 30);
		
		var instrument = new Instrument ();

		var sample = new Sample ();
		sample.name         = sampleHeader.substring (0, 22);
        sample.sampleLength = (sampleHeader.charCodeAt (22) * 256 + sampleHeader.charCodeAt (23)) * 2;
		sample.fineTune     = (sampleHeader.charCodeAt (24) & 0x0F);
		sample.volume       = (Math.min (sampleHeader.charCodeAt (25), 64.0)) / 64.0;
		sample.loopStart	= (sampleHeader.charCodeAt (26) * 256 + sampleHeader.charCodeAt (27)) * 2;
		sample.loopLength	= (sampleHeader.charCodeAt (28) * 256 + sampleHeader.charCodeAt (29)) * 2;
		sample.loopType     = (sample.loopLength > 1) ? SampleLoop.LOOP_FORWARD : SampleLoop.LOOP_NONE;
		
		if (sample.fineTune > 7) sample.fineTune -= 16;
		sample.fineTune *= 16;
		
		instrument.samples.push (sample);
		mod.instruments.push (instrument);
	}

	// Fill the order table and get the number of patterns in this mod
    var patternCount = 0;
    for (var i = 0; i < 128; i ++) {
		mod.orders[i] = fileData.charCodeAt (952 + i);
	    patternCount  = Math.max (patternCount, mod.orders[i] + 1);
	}

	// Load all patterns
    var patternLength = mod.channels * 256;
	for (var i = 0; i < patternCount; i ++) {
		var patternHeader = fileData.substring (1084 + i * patternLength, 1084 + i * patternLength + patternLength);

		// Create pattern and set number of rows and channels.
		var pattern = new Pattern (64, mod.channels);

		// Load pattern data.
        for (var r = 0; r < 64; r ++) {
		    for (var c = 0; c < mod.channels; c ++) {
		        var offset = r * mod.channels * 4 + c * 4;
				var byte1 = patternHeader.charCodeAt (offset);
				var byte2 = patternHeader.charCodeAt (offset + 1);
				var byte3 = patternHeader.charCodeAt (offset + 2);
				var byte4 = patternHeader.charCodeAt (offset + 3);

				// Find the note number corresponding to the period.
				var period = ((byte1 & 0x0F) * 256) | byte2;
				if (period == 0) {
					pattern.note[r][c] = 0;
				} else if (period > notePeriods[0]) {
					// Prevent notes that are too low.
                    pattern.note[r][c] = 1;
				} else if (period <= notePeriods[notePeriods.length - 1]) {
					// Prevent notes that are too high.
                    pattern.note[r][c] = 60;
				} else {
					// Find the note that closest matches the period.
					for (var p = 0; p < notePeriods.length - 1; p ++) {
						/*
						if (period <= notePeriods[p] && period > notePeriods[p + 1]) {
							var dLow = period - notePeriods[p];
							var dHi  = notePeriods[p + 1] - period;

	                    	pattern.note[r][c] = (dLow <= dHi) ? p + 1 : p + 2;
							break;
						}
						*/
						if (period == notePeriods[p]) {
							pattern.note[r][c] = p + 1;
							break;
						}
					}
				}

				pattern.instrument[r][c] = (byte1 & 0xF0) | ((byte3 & 0xF0) / 16);
				pattern.volume[r][c]     = -1;
				
                pattern.effectParam[r][c] = byte4;
				if ((byte3 & 0x0F) == 0 && byte4 != 0) {
					pattern.effect[r][c] = Effects.ARPEGGIO;
				} else if ((byte3 & 0x0F) == 1) {
					pattern.effect[r][c] = Effects.PORTA_UP;
                } else if ((byte3 & 0x0F) == 2) {
					pattern.effect[r][c] = Effects.PORTA_DOWN;
                } else if ((byte3 & 0x0F) == 3) {
					pattern.effect[r][c] = Effects.TONE_PORTA;
                } else if ((byte3 & 0x0F) == 4) {
					pattern.effect[r][c] = Effects.VIBRATO;
                } else if ((byte3 & 0x0F) == 5) {
					pattern.effect[r][c] = Effects.TONE_PORTA_VOL_SLIDE;
                } else if ((byte3 & 0x0F) == 6) {
					pattern.effect[r][c] = Effects.VIBRATO_VOL_SLIDE;
                } else if ((byte3 & 0x0F) == 7) {
					pattern.effect[r][c] = Effects.TREMOLO;
                } else if ((byte3 & 0x0F) == 8) {
					pattern.effect[r][c] = Effects.SET_PAN;
                } else if ((byte3 & 0x0F) == 9) {
					pattern.effect[r][c] = Effects.SAMPLE_OFFSET;
                } else if ((byte3 & 0x0F) == 10) {
					pattern.effect[r][c] = Effects.VOLUME_SLIDE;
                } else if ((byte3 & 0x0F) == 11) {
					pattern.effect[r][c] = Effects.POSITION_JUMP;
                } else if ((byte3 & 0x0F) == 12) {
					pattern.effect[r][c] = Effects.SET_VOLUME;
                } else if ((byte3 & 0x0F) == 13) {
					pattern.effect[r][c] = Effects.PATTERN_BREAK;
				} else if ((byte3 & 0x0F) == 14) {
					switch ((byte4 & 0xF0) >> 4) {
						case 0:
							pattern.effect[r][c] = Effects.SET_FILTER;
							break;
						case 1:
							pattern.effect[r][c] = Effects.FINE_PORTA_UP;
							break;
						case 2:
							pattern.effect[r][c] = Effects.FINE_PORTA_DOWN;
							break;
						case 3:
							pattern.effect[r][c] = Effects.SET_GLISANDO;
							break;
						case 4:
							pattern.effect[r][c] = Effects.SET_VIBRATO;
							break;
						case 5:
							pattern.effect[r][c] = Effects.SET_FINETUNE;
							break;
						case 6:
							pattern.effect[r][c] = Effects.SET_LOOP;
							break;
						case 7:
							pattern.effect[r][c] = Effects.SET_TREMOLO;
							break;
						case 8:
							pattern.effect[r][c] = Effects.SET_PAN_16;
							break;
						case 9:
							pattern.effect[r][c] = Effects.RETRIGGER;
							break;
						case 10:
							pattern.effect[r][c] = Effects.FINE_VOL_SLIDE_UP;
							break;
						case 11:
							pattern.effect[r][c] = Effects.FINE_VOL_SLIDE_DOWN;
							break;
						case 12:
							pattern.effect[r][c] = Effects.CUT_NOTE;
							break;
						case 13:
							pattern.effect[r][c] = Effects.DELAY_NOTE;
							break;
						case 14:
							pattern.effect[r][c] = Effects.DELAY_PATTERN;
							break;						
						default:
							pattern.effect[r][c] = Effects.NONE;
							break;
					}
                } else if ((byte3 & 0x0F) == 15) {
					pattern.effect[r][c] = Effects.SET_TEMPO_BPM;
    			} else {
					pattern.effect[r][c] = Effects.NONE;
				}
			}
		}

		mod.patterns.push (pattern);
	}

	// Load sample data.
    var filePos = patternCount * patternLength + 1084;
	for (var i = 0; i < mod.instruments.length; i ++) {
	    mod.instruments[i].samples[0].loadSample (fileData.substring (filePos, filePos + mod.instruments[i].samples[0].sampleLength), false, mod.signedSample);
        mod.instruments[i].samples[0].sample[0] = 0;
        mod.instruments[i].samples[0].sample[1] = 0;

	    filePos += mod.instruments[i].samples[0].sampleLength;
	}

	return mod;
}