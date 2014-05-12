var Effects = {
    NONE: {
		representations: [ ".", ".", ".", "." ],
		handler: function (registers, channel, param, pattern) {
		}
	},
	
	// Arpeggio varies the frequency of a note every tick depending on the parameters.
	ARPEGGIO: {
		representations: [ "0", "J", "?", "0" ],
		handler: function (registers, channel, param, pattern) {
			// Calculate periods to add depening on arpeggio parameters
			var arpeggio;
			if (registers.currentTick % 3 == 0) {
				arpeggio = 0;
			} else if (registers.currentTick  % 3 == 1) {
				arpeggio = ((param & 0xF0) >> 4) * 64;
			} else if (registers.currentTick  % 3 == 2) {
				arpeggio = (param & 0x0F) * 64;
			}
			
			// Calculate new frequency.
			var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[channel] + arpeggio) / 768);
			registers.sampleStep[channel] = freq / (registers.samplesPerTick * 3);
		}
	},
	
	// Note porta up. The rate at which the period of the note is being slid up is quadruppled.
	PORTA_UP: {
		representations: [ "1", "F", "?", "1" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0 && param != 0) {
				registers.portaStep[channel] = param * 4
			} else if (registers.currentTick > 0) {
				registers.channelPeriod[channel] -= registers.portaStep[channel];
				var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[channel]) / 768);
				registers.sampleStep[channel] = freq / (registers.samplesPerTick * 3);
			}	
		}
	},
	
	// Note porta down. The porta rate is being quadruppled.
	PORTA_DOWN: {
		representations: [ "2", "E", "?", "2" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0 && param != 0) {
				registers.portaStep[channel] = param * 4;
			} else if (registers.currentTick > 0) {
				registers.channelPeriod[channel] += registers.portaStep[channel];
				var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[channel]) / 768);
				registers.sampleStep[channel] = freq / (registers.samplesPerTick * 3);
			}
		}
	},
	
	// Porta to the given note with the given porta speed on each tick. Once the target period is reached stop
	// the porta effect. Porta speed is quadruppled.
	TONE_PORTA: {
		representations: [ "3", "G", "?", "3" ],
		handler: function (registers, channel, param, pattern) {
			// Set porta speed if param is present.
			if (registers.currentTick == 0 && param != 0) {
				registers.portaStep[channel] = param * 4;
			}
				
			// Set note to porta to if present.
			if (registers.currentTick == 0 && pattern.note[registers.currentRow][channel] != 0) {
				registers.portaNote[channel] = 7680 - (pattern.note[registers.currentRow][channel] - 25 - registers.channelSample[channel].basePeriod) * 64 - registers.channelSample[channel].fineTune / 2;
			}

			// Porta up or down depending on current note period and target period.
			if (registers.channelPeriod[channel] < registers.portaNote[channel]) {
				registers.channelPeriod[channel] += registers.portaStep[channel];
				
				// When the target period is reached stop porta.
				if (registers.channelPeriod[channel] > registers.portaNote[channel]) {
					registers.channelPeriod[channel] = registers.portaNote[channel];
				}
			} else if (registers.channelPeriod[channel] > registers.portaNote[channel]) {
				registers.channelPeriod[channel] -= registers.portaStep[channel];
				
				// When the target period is reached stop porta.
				if (registers.channelPeriod[channel] < registers.portaNote[channel]) {
					registers.channelPeriod[channel] = registers.portaNote[channel];
				}
			}

			// Calculate new sample step.
			var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[channel]) / 768);
			registers.sampleStep[channel] = freq / (registers.samplesPerTick * 3);
		}
	},
	
	// Note vibrato using a sine function with an amplitude of a given number of finetunes and a given speed.
	VIBRATO: {
		representations: [ "4", "H", "?", "4" ],
		handler: function (registers, channel, param, pattern) {
			// At tick 0 and non zero parameter reset vibrato sine and set new parameters.
			if (registers.currentTick == 0 && param != 0) {
				// Set vibrato step if parameter non zero.
				if ((param & 0xF0) != 0) {
					registers.vibratoStep[channel] = (2 * Math.PI) * (((param & 0xF0) >> 4) * registers.ticksPerRow) / 64.0;
				}
				
				// Set vibrato amplitude if parameter non zero.
				if ((param & 0x0F) != 0) {
					registers.vibratoAmp[channel] = (param & 0x0F) * 8;
				}
				
				registers.vibratoPos[channel] = 0;
			} 
										
			//  Calculate new note frequency and advance vibrato sine pos.
			var vibrato = Math.sin (registers.vibratoPos[channel]) * registers.vibratoAmp[channel];
			var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[channel] + vibrato) / 768);
			
			registers.sampleStep[channel]  = freq / (registers.samplesPerTick * 3);
			registers.vibratoPos[channel] += registers.vibratoStep[channel];
		}
	},
	
	// Slide the volume up or down on every tick except the first and porta to the note that was set by the
	// tone porta effect. Parameter values > 127 will slide up, lower values slide down.
	TONE_PORTA_VOL_SLIDE: {
		representations: [ "5", "L", "?", "5" ],
		handler: function (registers, channel, param, pattern) {
			// Set note to porta to if present.
			if (registers.currentTick == 0 && pattern.note[registers.currentRow][channel] != 0) {
				registers.portaNote[channel] = 7680 - (pattern.note[registers.currentRow][channel] - 25 - registers.channelSample[channel].basePeriod) * 64 - registers.channelSample[channel].fineTune / 2;
			}
		
			// Porta up or down depending on current note period and target period.
			if (registers.channelPeriod[channel] < registers.portaNote[channel]) {
				registers.channelPeriod[channel] += registers.portaStep[channel];
			
				// When the target period is reached stop porta.
				if (registers.channelPeriod[channel] > registers.portaNote[channel]) {
					registers.channelPeriod[channel] = registers.portaNote[channel];
				}
			} else if (registers.channelPeriod[channel] > registers.portaNote[channel]) {
				registers.channelPeriod[channel] -= registers.portaStep[channel];
			
				// When the target period is reached stop porta.
				if (registers.channelPeriod[channel] < registers.portaNote[channel]) {
					registers.channelPeriod[channel] = registers.portaNote[channel];
				}
			}
			
			// Calculate new sample step and set volume.
			var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[channel]) / 768);
			registers.sampleStep[channel] = freq / (registers.samplesPerTick * 3);
			
			var slide = (((param & 0xF0) != 0) ? (param & 0xF0) >> 4 : -(param & 0x0F)) / 64.0;
			registers.sampleVolume[channel] = Math.max (0.0, Math.min (registers.sampleVolume[channel] + slide, 1.0));
		}
	},
	
	// Note vibrato using previous vibrato parameters and do a volume slide using current parameter.
	VIBRATO_VOL_SLIDE: {
		representations: [ "6", "K", "?", "6" ],
		handler: function (registers, channel, param, pattern) {
			// On tick 0 copy volume slide parameter if set.
			if (registers.currentTick == 0 && param != 0) {
				registers.volumeSlide[channel] = param;
			}
		
			//  Calculate new note frequency and advance vibrato sine pos.
			var vibrato = Math.sin (registers.vibratoPos[channel]) * registers.vibratoAmp[channel];
			var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[channel] + vibrato) / 768);
			registers.sampleStep[channel] = freq / (registers.samplesPerTick * 3);
			
			registers.vibratoPos[channel] += registers.vibratoStep[channel];
			
			// Set sample volume.
			var slide = (((registers.volumeSlide[channel] & 0xF0) != 0) ? (registers.volumeSlide[channel] & 0xF0) >> 4 : -(registers.volumeSlide[channel] & 0x0F)) / 64.0;
			registers.sampleVolume[channel] = Math.max (0.0, Math.min (registers.sampleVolume[channel] + slide, 1.0));
		}
	},
	
	// Tremolo vibrates the volume up and down.
	TREMOLO: {
		representations: [ "7", "R", "?", "7" ],
		handler: function (registers, channel, param, pattern) {
			// At tick 0 and non zero parameter reset tremolo sine and set new parameters.
			if (registers.currentTick == 0 && param != 0) {
				// Set tremolo step if parameter non zero.
				if ((param & 0xF0) != 0) {
					registers.tremoloStep[channel] = (2 * Math.PI) * (((param & 0xF0) >> 4) * registers.ticksPerRow) / 64.0;
				}
				
				// Set tremolo amplitude if parameter non zero.
				if ((param & 0x0F) != 0) {
					registers.tremoloAmp[channel]  = (param & 0x0F) / 15;
				}
				
				registers.tremoloPos[channel]  = 0;
			} 
										
			//  Calculate new volume delta and advance vibrato sine pos.
			registers.tremolo[channel]     = 1.0 - (Math.sin (registers.tremoloPos[channel]) * registers.tremoloAmp[channel]);
			registers.tremoloPos[channel] += registers.tremoloStep[channel];
		}
	},
	
	// Set panning for this channel. 0x00 - left, 0x40 - middle, 0x80 - right. Anything greater than 0x80 
	// causes surround sound on the current channel.
	SET_PAN: {
		representations: [ "8", "?", "?", "8" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				registers.channelPan[channel] = param / 128.0;
			}
		}
	},
	
	// Set sample offset in words.
	SAMPLE_OFFSET: {
		representations: [ "9", "O", "?", "9" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				registers.samplePos[channel]     = param * 256;
				registers.sampleRemain[channel] -= param * 256;
			}
		}
	},
	
	// Slide the volume up or down on every tick except the first. Parameter values > 127 will slide up, lower
	// values slide down.
	VOLUME_SLIDE: {
		representations: [ "A", "D", "?", "A" ],
		handler: function (registers, channel, param, pattern) {
			// On tick 0 copy parameter if set.
			if (registers.currentTick == 0 && param != 0) {
				registers.volumeSlide[channel] = param;
			}
			
			if (registers.currentTick > 0 && registers.volumeSlide[channel] != 0) {
				if ((registers.volumeSlide[channel] & 0xF0) == 0xF0 && (registers.volumeSlide[channel] & 0x0F) != 0x00) {
					// Fine volume slide down only on tick 1.
					if (registers.currentTick == 1) {
						var slide = (registers.volumeSlide[channel] & 0x0F) / 64.0;
						registers.sampleVolume[channel] = Math.max (0.0, registers.sampleVolume[channel] - slide);
					}
				} else if ((registers.volumeSlide[channel] & 0x0F) == 0x0F && (registers.volumeSlide[channel] & 0xF0) != 0x00) {
					// Fine volume slide up only on tick 1.
					if (registers.currentTick == 1) {
						var slide = ((registers.volumeSlide[channel] & 0xF0) >> 4) / 64.0;
						registers.sampleVolume[channel] = Math.min (1.0, registers.sampleVolume[channel] + slide);
					}
				} else {
					// Normal volume slide.
					var slide = (((registers.volumeSlide[channel] & 0xF0) != 0) ? (registers.volumeSlide[channel] & 0xF0) >> 4 : -(registers.volumeSlide[channel] & 0x0F)) / 64.0;
					registers.sampleVolume[channel] = Math.max (0.0, Math.min (registers.sampleVolume[channel] + slide, 1.0));
				}
			}
		}
	},
	
	// After this row jump to row 1 of the given order.
	POSITION_JUMP: {
		representations: [ "B", "B", "?", "B" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				registers.orderJump = param;
			}
		}
	},
	
	// Set the volume of a channel on the first tick according to the given parameter.
	SET_VOLUME: {
		representations: [ "C", "?", "?", "C" ],
		handler: function (registers, channel, param, pattern) {		
			if (registers.currentTick == 0) {
				registers.sampleVolume[channel] = Math.max (0.0, Math.min (param / 64.0, 1.0));
			}
		}
	},
	
	// At the end of this row jump to the next order and start playing at the row given in the parameter.
	PATTERN_BREAK: {
		representations: [ "D", "C", "?", "D" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				registers.breakPattern = ((param & 0xF0) >> 4) * 10 + (param & 0x0F);
			}
		}
	},
	
	SET_FILTER: {
		representations: [ "E", "S", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
		}
	},
	
	// Slide note pitch up only on the first tick.
	FINE_PORTA_UP: {
		representations: [ "E", "?", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				// If param value present change porta step.
				if (param & 0x0F != 0) {
					registers.portaStep[channel] = (param & 0x0F) * 4;
				}
				
				// Slide pitch up.
				registers.channelPeriod[channel] -= registers.portaStep[channel];
				var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[channel]) / 768);
				registers.sampleStep[channel] = freq / (registers.samplesPerTick * 3);
			}
		}
	},
	
	// Slide note pitch down only on the first tick.
	FINE_PORTA_DOWN: {
		representations: [ "E", "?", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				// If param value present change porta step.
				if (param & 0x0F != 0) {
					registers.portaStep[channel] = (param & 0x0F) * 4;
				}

				// Slide pitch down.
				registers.channelPeriod[channel] += registers.portaStep[channel];
				var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[channel]) / 768);
				registers.sampleStep[channel] = freq / (registers.samplesPerTick * 3);
			}
		}
	},
	
	SET_GLISANDO: {
		representations: [ "E", "S", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
		}
	},
	
	SET_VIBRATO: {
		representations: [ "E", "S", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
		}
	},
	
	// Set the finetune of the sample playing on the current channel.
	SET_FINETUNE: {
		representations: [ "E", "S", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0 && registers.channelSample[channel] != null) {
				registers.channelSample[channel].fineTune = param & 0x0F;
			}
		}
	},
	
	// Pattern section loop.
	SET_LOOP: {
		representations: [ "E", "S", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				if ((param & 0x0F) == 0) {
					registers.loopMark[channel] = registers.currentRow;
				} else {
					if (registers.loopCount[channel] == 0) {
						registers.loopCount[channel] = (param & 0x0F);
					} else {
						registers.loopCount[channel] --;
					}
					
					if (registers.loopCount[channel] > 0) {
						registers.rowJump = registers.loopMark[channel];
					}
				}
			}
		}
	},
	
	SET_TREMOLO: {
		representations: [ "E", "S", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
		}
	},
	
	// Set panning for this channel. 0x00 - left --> 0x0F - right.
	SET_PAN_16: {
		representations: [ "E", "S", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				registers.channelPan[channel] = (param & 0x0F) / 15.0;
			}
		}
	},
	
	// Retrigger the note every param ticks.
	RETRIGGER:{
		representations: [ "E", "?", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick % (param & 0x0F) == 0) {
				registers.sampleRemain[channel]  = registers.channelSample[channel].sampleLength;
				registers.samplePos[channel]     = 0;
			}
		}
	},
	
	// At the first tick of the row add x to the volume.
	FINE_VOL_SLIDE_UP: {
		representations: [ "E", "?", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				registers.sampleVolume[channel] = Math.min (registers.sampleVolume[channel] + (param & 0x0F) / 15.0, 1.0);
			}
		}
	},
	
	// At the first tick of the row subtract x from the volume.
	FINE_VOL_SLIDE_DOWN: {
		representations: [ "E", "?", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				registers.sampleVolume[channel] = Math.max (0.0, registers.sampleVolume[channel] - (param & 0x0F) / 15.0);
			}
		}
	},
	
	// Cut the volume of the note to 0 if the current tick equals the parameter value.
	CUT_NOTE: {
		representations: [ "E", "S", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == (param & 0x0F)) {
				registers.sampleVolume[channel] = 0.0;
			}
		}
	},
	
	// Set the number of ticks to wait before starting the note.
	DELAY_NOTE: {
		representations: [ "E", "S", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				registers.noteDelay[channel] = (param & 0x0F);
			}
		}
	},
	
	DELAY_PATTERN: {
		representations: [ "E", "S", "?", "E" ],
		handler: function (registers, channel, param, pattern) {
			console.log ("I was too lazy to implement this :)");
		}
	},
	
	// Set BMP or tempo on the first tick according to the parameter of the effect. A value greater than 32 will
	// change the BPM, other values change the tempo.
	SET_TEMPO_BPM: {
		representations: [ "F", "?", "?", "F" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				if (param <= 32) {
					Effects.SET_SPEED.handler (registers, channel, param, pattern);
				} else {
					Effects.SET_TEMPO.handler (registers, channel, param, pattern);
				}
			}
		}
	},
	
	// Set speed as defined by the number of ticks per row.
	SET_SPEED: {
		representations: [ "?", "A", "?", "?" ],
		handler: function (registers, channel, param, pattern) {
			registers.ticksPerRow = param;
			
			var rpm = (24 * registers.bpm) / registers.ticksPerRow;		// Yes, this is using a base of 6 ticks per row and it's correct!
			var tpm = rpm * registers.ticksPerRow;
			
			registers.rowDelay       = 60000 / rpm;						// Number of milliseconds in one row.
			registers.samplesPerTick = Math.round (registers.sampleRate / (tpm / 60));
		}
	},
	
	// Set tempo as the number of beats per minute.
	SET_TEMPO: {
		representations: [ "?", "T", "?", "?" ],
		handler: function (registers, channel, param, pattern) {
			registers.bpm = param;
			
			var rpm = (24 * registers.bpm) / registers.ticksPerRow;		// Yes, this is using a base of 6 ticks per row and it's correct!
			var tpm = rpm * registers.ticksPerRow;
			
			registers.rowDelay       = 60000 / rpm;						// Number of milliseconds in one row.
			registers.samplesPerTick = Math.round (registers.sampleRate / (tpm / 60));
		}
	},
	
	// Retrigger note if the current tick is equal to param Y and perform a volume slide using
	// param X.
	RETRIG_VOL_SLIDE: {
		representations: [ "?", "Q", "?", "?" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick % (param & 0x0F) == 0) {
				registers.sampleRemain[channel]  = registers.channelSample[channel].sampleLength;
				registers.samplePos[channel]     = 0;
				
				switch ((param & 0xF0) >> 4) {
					case 1:
						registers.sampleVolume[channel] -= (1 / 64);
						break;
					case 2:
						registers.sampleVolume[channel] -= (2 / 64);
						break;
					case 3:
						registers.sampleVolume[channel] -= (4 / 64);
						break;
					case 4:
						registers.sampleVolume[channel] -= (8 / 64);
						break;
					case 5:
						registers.sampleVolume[channel] -= (16 / 64);
						break;
					case 6:
						registers.sampleVolume[channel] *= 0.67;
						break;
					case 7:
						registers.sampleVolume[channel] *= 0.5;
						break;
					case 9:
						registers.sampleVolume[channel] += (1 / 64);
						break;
					case 10:
						registers.sampleVolume[channel] += (2 / 64);
						break;
					case 11:
						registers.sampleVolume[channel] += (4 / 64);
						break;
					case 12:
						registers.sampleVolume[channel] += (8 / 64);
						break;
					case 13:
						registers.sampleVolume[channel] += (16 / 64);
						break;
					case 14:
						registers.sampleVolume[channel] *= 1.5;
						break;
					case 15:
						registers.sampleVolume[channel] *= 2.0;
						break;
					default:
						break;
				}
				
				registers.sampleVolume[channel] = Math.max (0.0, Math.min (registers.sampleVolume[channel], 1.0));
			}
		}
	},
	
	// Set the global volume.
	SET_GLOBAL_VOLUME: {
		representations: [ "?", "V", "?", "G" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				registers.masterVolume = Math.max (0.0, Math.min (param / 64.0, 1.0));
			}
		}
	},
	
	GLOBAL_VOLUME_SLIDE: {
		representations: [ "?", "?", "?", "H" ],
		handler: function (registers, channel, param, pattern) {
		}
	},
	
	ENVELOPE_POSITION: {
		representations: [ "?", "?", "?", "L" ],
		handler: function (registers, channel, param, pattern) {
		}
	},
	
	PAN_SLIDE: {
		representations: [ "?", "?", "?", "P" ],
		handler: function (registers, channel, param, pattern) {
		}
	},
	
	MULTI_RETRIGGER:{
		representations: [ "?", "?", "?", "R" ],
		handler: function (registers, channel, param, pattern) {
		}
	},
	
	// Tremor turns a note on for X tick and then switches it off for Y frames.
	TREMOR: {
		representations: [ "?", "I", "?", "T" ],
		handler: function (registers, channel, param, pattern) {
			if (registers.currentTick == 0) {
				if (pattern.volume[registers.currentRow][channel] > -1) {
					registers.sampleVolume[channel] = pattern.volume[registers.currentRow][channel];
				} else {
					registers.sampleVolume[channel] = registers.channelSample[channel].volume;	
				}
			} else if (registers.currentTick >= (param & 0xF0) >> 4	) {
				registers.sampleVolume[channel] = 0;
			}
		}
	},
	
	// Fine vibrato is the same as regular vibrato, except that it only triggers every 4th tick.
	FINE_VIBRATO: {
		representations: [ "?", "U", "?", "?" ],
		handler: function (registers, channel, param, pattern) {
			// At tick 0 and non zero parameter reset vibrato sine and set new parameters.
			if (registers.currentTick == 0 && param != 0) {
				// Set vibrato step if parameter non zero.
				if ((param & 0xF0) != 0) {
					registers.vibratoStep[channel] = (2 * Math.PI) * (((param & 0xF0) >> 4) * registers.ticksPerRow) / 64.0;
				}
				
				// Set vibrato amplitude if parameter non zero.
				if ((param & 0x0F) != 0) {
					registers.vibratoAmp[channel] = (param & 0x0F) * 8;
				}
				
				registers.vibratoPos[channel] = 0;
			} 
										
			//  Calculate new note frequency and advance vibrato sine pos.
			if (registers.currentTick % 4 == 0) {
				var vibrato = Math.sin (registers.vibratoPos[channel]) * registers.vibratoAmp[channel];
				var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[channel] + vibrato) / 768);
				
				registers.sampleStep[channel]  = freq / (registers.samplesPerTick * 3);
				registers.vibratoPos[channel] += registers.vibratoStep[channel];
			}
		}
	},
	
	EXTRA_FINE_PORTA_UP: {
		representations: [ "?", "?", "?", "X" ],
		handler: function (registers, channel, param, pattern) {
		}
	},
	
	EXTRA_FINE_PORTA_DOWN: {
		representations: [ "?", "?", "?", "X" ],
		handler: function (registers, channel, param, pattern) {
		}
	}
}