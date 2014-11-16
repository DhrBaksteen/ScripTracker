"use strict";

/**
 * S3mLoader.js
 *
 * Loader for S3M modules. Returns a generic ScripTracker Module object for playback.
 *
 * Author:  		Maarten Janssen
 * Date:    		2013-04-14
 * Last updated:	2014-11-10
 */
function S3mLoader (fileData) {
	mod = new Module ();
	mod.type     = ModTypes.S3M;
	mod.channels = 32;

	mod.name         = fileData.substring (0, 28);
	mod.songLength   = fileData.charCodeAt (32) + fileData.charCodeAt (33) * 256;
	mod.sampleCount  = fileData.charCodeAt (34) + fileData.charCodeAt (35) * 256;
	mod.patternCount = fileData.charCodeAt (36) + fileData.charCodeAt (37) * 256;
	mod.signedSample = (fileData.charCodeAt (42) === 1) ? true : false;

	mod.volumeSlideFlag = (fileData.charCodeAt (38) & 0x40) !== 0 || fileData.charCodeAt (40) === 0x00;
	mod.defaultVolume   = fileData.charCodeAt (48) / 64.0;
	mod.defaultTempo    = fileData.charCodeAt (49) === 0 ?   6 : fileData.charCodeAt (49);
	mod.defaultBPM      = fileData.charCodeAt (50) < 33 ? 125 : fileData.charCodeAt (50);
	mod.defaultVolume   = fileData.charCodeAt (51) / 64.0;

	// Load order table.
	for (var i = 0; i < mod.songLength; i ++) {
		mod.orders[i] = fileData.charCodeAt (96 + i);
	}

	var samplePtrOffset  = 96 + mod.songLength;
    var patternPtrOffset = 96 + mod.songLength + mod.sampleCount * 2;

	// Load samples.
	for (var i = 0; i < mod.sampleCount; i ++) {
		var instrument = new Instrument ();
	
		var sampleOffset = (fileData.charCodeAt (samplePtrOffset + i * 2) + fileData.charCodeAt (samplePtrOffset + i * 2 + 1) * 256) * 16;
		var sampleData   = fileData.substring (sampleOffset, sampleOffset + 80);
		var sample       = new Sample ();
		
		sample.sampleIndex  = i;
		sample.name         = sampleData.substring (48, 76);
		sample.sampleLength = sampleData.charCodeAt (16) + sampleData.charCodeAt (17) * 256;
		sample.loopStart    = sampleData.charCodeAt (20) + sampleData.charCodeAt (21) * 256;
		sample.loopLength   = (sampleData.charCodeAt (24) + sampleData.charCodeAt (25) * 256) - sample.loopStart;
		sample.volume       = sampleData.charCodeAt (28) / 64;
		sample.loopType     = ((sampleData.charCodeAt (31) & 0x01) !== 0) ? SampleLoop.LOOP_FORWARD : SampleLoop.LOOP_NONE;

		// Calculate the base note from C4 frequency
		sample.basePeriod = (sampleData.charCodeAt (32) + sampleData.charCodeAt (33) * 256);
		sample.basePeriod = (sample.basePeriod) / 8363;
		sample.basePeriod = (Math.log (sample.basePeriod) / Math.log (2)) * 768 + 3168;			// Was 3072...
		sample.basePeriod = -(Math.floor (sample.basePeriod / 64) - 72);
		
		var dataOffset = sampleData.charCodeAt (14) * 16 + sampleData.charCodeAt (15) * 4096;
		var is16Bit    = (sampleData.charCodeAt (31) & 0x04) !== 0;
		var dataLength = sample.sampleLength * ((is16Bit) ? 2 : 1);

		if ((sampleData.charCodeAt (31) & 0x02) === 0) {
			// Load mono sample data.
			sample.loadSample (fileData.substring (dataOffset, dataOffset + dataLength), is16Bit, mod.signedSample);
		} else {
			// Load stereo sample data.
			sample.loadStereoSample (fileData.substring (dataOffset, dataOffset + dataLength), is16Bit, mod.signedSample);
		}
		
		instrument.name = sample.name;
		instrument.samples.push (sample);
		mod.instruments.push (instrument);
	}
	
	// Load patterns.
	for (var p = 0; p < mod.patternCount; p ++) {
        var patternOffset = (fileData.charCodeAt (patternPtrOffset + p * 2) + fileData.charCodeAt (patternPtrOffset + p * 2 + 1) * 256) * 16;
		var patternLength = fileData.charCodeAt (patternOffset) + fileData.charCodeAt (patternOffset + 1) * 256;
		var patternData   = fileData.substring (patternOffset, patternOffset + patternLength);
		
		var pattern = new Pattern (64, mod.channels);
		
		var pos = 2;
		var i = 0;
		
		while (i !== 64 && patternData.length - pos > 0) {
			var data = patternData.charCodeAt (pos);

			if (data !== 0x00) {
				var channel = data & 0x1F;					

				if ((data & 0x20) !== 0) {
					pos ++;
					if (patternData.charCodeAt (pos) === 0xFE) {
						// Stop note.
						pattern.note[i][channel] = 97;
					} else if (patternData.charCodeAt (pos) === 0xFF) {
						// Empty note.
						pattern.note[i][channel] = 0;
					} else {
						// Normal note.
						var octave = Math.floor (patternData.charCodeAt (pos) / 16) * 12;
	                	pattern.note[i][channel] = (patternData.charCodeAt (pos) % 16) + octave + 1;
					}

					pattern.instrument[i][channel] = patternData.charCodeAt (++pos);
				}

				if ((data & 0x40) !== 0) {
					pattern.volume[i][channel] = patternData.charCodeAt (++pos);
				} else {
					pattern.volume[i][channel] = -1;
				}

				if ((data & 0x80) !== 0) {
					var effect = patternData.charCodeAt (++pos);
					var param  = patternData.charCodeAt (++pos);
					
					pattern.effectParam[i][channel] = param;
					
					switch (effect) {
					    case 1:
    						pattern.effect[i][channel] = Effects.SET_SPEED;
	    					break;
                        case 2:
    						pattern.effect[i][channel] = Effects.POSITION_JUMP;
	    					break;
	    				case 3:
    						pattern.effect[i][channel] = Effects.PATTERN_BREAK;
	    					break;
	    				case 4:
    						pattern.effect[i][channel] = Effects.VOLUME_SLIDE;
	    					break;
	    				case 5:
    						pattern.effect[i][channel] = Effects.PORTA_DOWN;
    						if (param >= 240) {
	    						pattern.effectParam[i][channel] = Math.round ((param % 16) / 16.0);
		    				} else if (param >= 224) {
			    				pattern.effectParam[i][channel] = Math.round ((param % 16) / 4.0);
				    		}
                            break;
                        case 6:
                            pattern.effect[i][channel] = Effects.PORTA_UP;						
                            if (param >= 240) {
                                pattern.effectParam[i][channel] = Math.round ((param % 16) / 16.0);
                            } else if (param >= 224) {
                                pattern.effectParam[i][channel] = Math.round ((param % 16) / 4.0);
                            }
						    break;
						case 7:
    						pattern.effect[i][channel] = Effects.TONE_PORTA;
    						break;
                        case 8:
    						pattern.effect[i][channel] = Effects.VIBRATO;
    						break;
						case 9:
							pattern.effect[i][channel] = Effects.TREMOR;
    						break;
    					case 10:
    					    pattern.effect[i][channel] = Effects.ARPEGGIO;
    						break;
                        case 11:
    						pattern.effect[i][channel] = Effects.VIBRATO_VOL_SLIDE;
                            break;
						case 12:
							pattern.effect[i][channel] = Effects.TONE_PORTA_VOL_SLIDE;
							break;
                        case 15:
    					    pattern.effect[i][channel] = Effects.SAMPLE_OFFSET;
    					    break;
						case 17:
							pattern.effect[i][channel] = Effects.RETRIG_VOL_SLIDE;
    					    break;
    					case 18:
    					    pattern.effect[i][channel] = Effects.TREMOLO;
    					    break;
                        case 19:
    					    var extend = (param & 0xF0) >> 4;
    					    
	    				    switch (extend) {
								case 0:
									pattern.effect[i][channel] = Effects.SET_FILTER;        
			    		            break;
								case 1:
									pattern.effect[i][channel] = Effects.SET_GLISANDO;        
			    		            break;
								case 2:
									pattern.effect[i][channel] = Effects.SET_FINETUNE;
									break;
								case 3:
									pattern.effect[i][channel] = Effects.SET_VIBRATO;
									break;
								case 4:
									pattern.effect[i][channel] = Effects.SET_TREMOLO;
									break;
		    			        case 8:
								case 10:
					                pattern.effect[i][channel] = Effects.SET_PAN_16;        
			    		            break;
								case 11:
									pattern.effect[i][channel] = Effects.SET_LOOP;        
			    		            break;
								case 12:
									pattern.effect[i][channel] = Effects.CUT_NOTE;        
			    		            break;
								case 13:
									pattern.effect[i][channel] = Effects.DELAY_NOTE;        
			    		            break;
								case 14:
									pattern.effect[i][channel] = Effects.DELAY_PATTERN;        
			    		            break;
								default:
									console.log ("Unknown effect: " + effect + ", " + param);
									pattern.effect[i][channel] = Effects.NONE;
									break;
				    	    }
				    	    break;
				    	case 20:
				    	    pattern.effect[i][channel] = Effects.SET_TEMPO;
				    	    break;
						case 21:
							break;
				    	case 22:
				    	    pattern.effect[i][channel] = Effects.SET_GLOBAL_VOLUME;
				    	    break;
                        default:
    						console.log ("Unknown effect: " + effect + ", " + param);
	    					pattern.effect[i][channel] = Effects.NONE;
		    				break;
					}
				}
			} else {			
				i ++;				
			}			
			
			pos ++;
		}
		
		mod.patterns.push (pattern);
	}
	
	return mod;
}