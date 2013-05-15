function ScripTracker () {
	var _this  = this;                  // Self reference for private functions.
	
	var module  = null;                 // Module file that is playing.
	var pattern = null;                 // The current pattern being played.

	var orderIndex  = 0;                // Index in the order table of the module.
	var row         = 0;                // Current row in pattern.

	var sampleRate     = 22050			// Playback sample rate.
	var bpm            = 0;             // Current BPM.
	var ticksPerRow    = 0;             // Current number of ticks in one row (tempo).
	var samplesPerTick = 0;             // Number of samples per tick.
	var rowDelay       = 0;             // Time in ms taken by each row given the current BPM and tempo.
	var tickDuration   = 0;				// Time in ms taken by eack tick.
	var masterVolume   = 0.9			// The master volume multiplier.

	var rowCallbackHandler = null;      // Callback function called when a new row is being processed.

	var isPlaying = false;              // Is te player currently playing?
	var audioCtx = new webkitAudioContext ();

	var breakPattern = -1;				// Pattern break ro to restart next order.
	var orderJump    = -1;				// Order jump index of next order.
	var patternLoop  = false;			// Do not jump to next order, but repeat current.

	var channelMute   = [false, false, false, false, false, false, false, false,    // Chanel muted flags.
						 false, false, false, false, false, false, false, false,
						 false, false, false, false, false, false, false, false,
						 false, false, false, false, false, false, false, false];
	var channelPeriod = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,    // Current period of each channel.
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var channelSample = [null, null, null, null, null, null, null, null,    // Reference to current sample of channels.
						 null, null, null, null, null, null, null, null,
						 null, null, null, null, null, null, null, null,
						 null, null, null, null, null, null, null, null];
	var channelPan    = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 			// Panning of each channel.
						 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 
						 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 
						 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
	var portaNote     = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,    // Note period to porta to for each channel.
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var portaStep     = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,	// Note porta step per tick.
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var vibratoPos    = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,	// Vibrato position per channel.
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var vibratoStep   = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,	// Vibrato step per tick per channel.
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var vibratoAmp    = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,	// Vibrato amplitude per channel
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var volumeSlide   = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,	// Volume slide per channel
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var sampleVolume  = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,    // Current volume of each channel.
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var samplePos     = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,    // Current sample data position.
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var sampleStep    = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,    // Sample data step for each channel.
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var sampleRemain  = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,    // Sample data remaining on each channel.
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var noteDelay     = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,    // Note delay per channel.
						 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


	this.load = function (mod) {
		module = mod;
		setSpeed (module.defaultBPM, module.defaultTempo);
		this.rewind ();
	}
	

	/**
	 * Start playback if player is stopped and a module is loaded.
	 */
	this.play = function () {
		if (!isPlaying && module != null) {
			isPlaying = true;
			playerThread ();
		}
	};


	/**
	 * Stop playback after the current row has been processed.
	 */
	this.stop = function () {
		isPlaying = false;
	};


	/**
	 * Jump to the previous order or restart the current order if we are below row 8.
	 */
	this.prevOrder = function () {
		if (row >= 8) {
			// Restart current order if we are after row 8.
			row = 0;
		} else {
			row = 0;
			
			// Only jump to previous order if it's safe.
			if (orderIndex - 1 >= 0 && module.orders[orderIndex] != 0xFE) {
				orderIndex --;
				pattern = module.patterns[module.orders[orderIndex]];
			}
		}
	}
	
	
	/**
	 * Jump to the top of the next order.
	 */
	this.nextOrder = function () {
		if (pattern != null) {
			row = pattern.rows - 1;
		}
	}
	
	
	/**
	 * Restart the current module.
	 */
	this.rewind = function () {
		orderIndex = 0;
		row        = 0;
		
		// Get first pattern if a module is loaded.
		if (module != null) {
			pattern = module.patterns[module.orders[orderIndex]];
		}
	};


	/**
	 * Is the given channel muted?
	 */
	this.isMuted = function (channel) {
		return channelMute[channel];
	}
	
	
	/**
	 * Is pattern looping activated?
	 */
	this.isPatternLoop = function () {
		return patternLoop;
	}
	
	
	/**
	 * Is the player currently playing?
	 */
	this.isPlaying = function () {
		return isPlaying;
	}
	
	
	/**
	 * Set or reset the mute flag of the given channel.
	 */
	this.setMute = function (channel, mute) {
		channelMute[channel] = mute;
	}
	
	
	/**
	 * Set the pattern loop flag.
	 */
	this.setPatternLoop = function (loop) {
		patternLoop = loop;
	}
	

	/**
	 * Register a function as callback hendler called when a new row is being processed. This function is called with a
	 * reference to ScripTracker as its first parameter. Set the handler to null to remove the callback handler.
	 *
	 * handler - A function that s   erves as callback handler.
	 */
	this.setRowCallbackhandler = function (handler) {
		rowCallbackHandler = handler;
	}
	
	
	/**
	 * Get an object containing the current player status.
	 */
	this.getSongData = function () {
		var playerData = {
			"songName" : module.name,
			"order": orderIndex + 1,
			"length": module.songLength,
			"pattern": module.orders[orderIndex],
			"bpm": bpm,
			"ticks": ticksPerRow,
			"row": row,
			"channel": []
		};
		
		// Export data of current row.
		for (var i = 0; i < 32; i ++) {
			playerData.channel[i] = {};
			playerData.channel[i].rowData = pattern.toText (row, i);
			playerData.channel[i].instrument = (channelSample[i] != null) ? channelSample[i].name : "";
			playerData.channel[i].volume = sampleVolume[i];
			
		}
		
		return playerData;
	};


	/**
	 * Main player 'thread' that calls itself every time a new row should be processed as long as the player is playing.
	 */
	function playerThread () {
		var t1 = (new Date ()).getTime ();

		// Process new row.
		playRow ();

		// If a callback handler is registered call it now.
		if (rowCallbackHandler != null) {
			rowCallbackHandler (_this);
		}

		// Calculate time it took to process the current row so we can process the next row in time.
		var dTime = (new Date ()).getTime () - t1;
		if (isPlaying) {
			setTimeout (function () { playerThread (); }, rowDelay - dTime);
		}
	};


	/**
	 *
	 */
	function playRow () {
		var samplesL = [];
		var samplesR = [];

		for (var c = 0; c < module.channels; c ++) {
			
        	if (pattern.sample[row][c] != 0) {
				//if (channelSample[c] != module.samples[pattern.sample[row][c] - 1]) {
	            	channelSample[c] = module.samples[pattern.sample[row][c] - 1];   	// Set current sample
                    sampleRemain[c]  = channelSample[c].sampleLength;					// Repeat length of this sample
                    samplePos[c]     = 0;                                          		// Restart sample
				//}
				
				channelPan[c]    = channelSample[c].panning;							// Set default panning for sample
				// Set default sample volume or row volume (this one also allows volumes of 0 comming from row)
				if (pattern.volume[row][c] > -1) {
					sampleVolume[c] = pattern.volume[row][c];
				} else {
					sampleVolume[c] = channelSample[c].volume;	
				}
			}
			
			// If we do have a sample and the volume on the row > 0 then use this as sample volume.
			if (channelSample[c] != null && pattern.volume[row][c] > 0) {
				sampleVolume[c] = pattern.volume[row][c];
			}

		    if (pattern.note[row][c] != 0 && pattern.effect[row][c] != Effects.TONE_PORTA && pattern.effect[row][c] != Effects.TONE_PORTA_VOL_SLIDE) {
				if (pattern.note[row][c] == 97) {
					channelSample[c] = null;
					channelPeriod[c] = 0;
				} else if (channelSample[c] != null) {
					channelPeriod[c] = 7680 - (pattern.note[row][c] - 25 - channelSample[c].basePeriod) * 64 - channelSample[c].fineTune / 2;
					var freq = 8363 * Math.pow (2, (4608 - channelPeriod[c]) / 768);
					
					samplePos[c]     = 0;											// Restart sample
                    noteDelay[c]     = 0;											// Reset note delay
			    	sampleRemain[c]  = channelSample[c].sampleLength;				// Repeat length of this sample
					sampleStep[c]    = freq / (samplesPerTick * 3);					// Samples per division
				}
			}
		}
		
		for (var t = 0; t < ticksPerRow; t ++) {
			for (var c = 0; c < module.channels; c ++) {
				// Process effects.
				handleEffect (row, c, t);

				// Generate samples for current tick and channel.
				var sIndex = samplesPerTick * t;
				for (var s = 0; s < samplesPerTick; s ++) {
					if (c == 0) {
						samplesL[sIndex] = 0.0;
						samplesR[sIndex] = 0.0;
					}

			        if (channelSample[c] != null && noteDelay[c] == 0 && !channelMute[c]) {
			            var sample = channelSample[c].sample[Math.floor (samplePos[c])] * sampleVolume[c];

						if (channelPan[c] <= 1.0) {
							// Normal panning.
							samplesL[sIndex] = Math.max (-1.0, Math.min (samplesL[sIndex] + sample * (1.0 - channelPan[c]), 1.0)) * masterVolume;
                        	samplesR[sIndex] = Math.max (-1.0, Math.min (samplesR[sIndex] + sample * channelPan[c], 1.0)) * masterVolume;
						} else {
							// Surround sound.
							samplesL[sIndex] = Math.max (-1.0, Math.min (samplesL[sIndex] + sample * 0.5, 1.0)) * masterVolume;
                        	samplesR[sIndex] = Math.max (-1.0, Math.min (samplesR[sIndex] - sample * 0.5, 1.0)) * masterVolume;
						}

						samplePos[c]    += sampleStep[c];
						sampleRemain[c] -= sampleStep[c];

						// Loop or stop the sample when we reach its end.
						if (sampleRemain[c] <= 0) {
						    if (channelSample[c].loopType == channelSample[c].LOOP_FORWARD) {
						    	samplePos[c]    = channelSample[c].loopStart  - sampleRemain[c];
						    	sampleRemain[c] = channelSample[c].loopLength + sampleRemain[c];
							} else {
							    samplePos[c]    = channelSample[c].sampleLength - 1;
						    	sampleStep[c]   = 0;
								sampleVolume[c] = 0.0;
							}
						}
					}

                    sIndex ++;
				}
				
				// If a note delay is set decrease it.
				noteDelay[c] = Math.max (0, noteDelay[c] - 1);
			}
		}

		var audioBuffer = audioCtx.createBuffer (2, samplesL.length, sampleRate);

		var sourceL = audioCtx.createBufferSource (0);
		audioBuffer.getChannelData (0).set (samplesL);
		sourceL.buffer = audioBuffer;
  		sourceL.connect (audioCtx.destination);
  		sourceL.noteOn (0);

        var sourceR = audioCtx.createBufferSource (1);
		audioBuffer.getChannelData (1).set (samplesR);
        sourceR.buffer = audioBuffer;
  		sourceR.connect (audioCtx.destination);
  		sourceR.noteOn (0);

        // Handle pattern break if there is one.
		if (breakPattern != -1) {
			row = breakPattern - 1;
			breakPattern = -1;

			// Only handle pattern break when not looping a pattern.
			if (!this.repeatOrder) {
				orderIndex ++;

				// Handle the skip order marker.
				while (module.orders[orderIndex] == 0xFE && orderIndex < module.songLength) {
					orderIndex ++
				}
				
				// When we reach the end of the song jump back to the restart position.
				if (orderIndex == module.songLength || module.orders[orderIndex] == 0xFF) {
					orderIndex = module.restartPosition;
				}
				
				pattern = module.patterns[module.orders[orderIndex]];
			}
		}
		
		// If an order jump is encountered jump to row 1 of the order at the given index.
		if (orderJump != -1 && !patternLoop) {
			row        = -1;
			orderIndex = Math.min (module.songLength - 1, orderJump);
            pattern    = module.patterns[module.orders[orderIndex]];
			orderJump  = -1;
		}

		row ++;

		// When we reach the end of our current pattern jump to the next one.
		if (row == pattern.rows) {
			row = 0;
			if (!patternLoop) orderIndex ++;

			// Handle the skip order marker.
			while (module.orders[orderIndex] == 0xFE && orderIndex < module.songLength) {
				orderIndex ++
			}
			
			// When we reach the end of the song jump back to the restart position.
			if (orderIndex == module.songLength || module.orders[orderIndex] == 0xFF) {
				orderIndex = module.restartPosition;
			}
            pattern = module.patterns[module.orders[orderIndex]];
		}
	};
	

	/**
	 * Handle the effect at the given row and channel. Handling of the effect depends on what effect we encounter and
	 * at what tich we are in the current row.
	 *
	 * row     - Current row in the pattern
	 * channel - The channel we are evaluating
	 * tick    - Tick of the current row
	 */
	function handleEffect (row, channel, tick) {
		var param = pattern.effectParam[row][channel];

		switch (pattern.effect[row][channel]) {
			
			// Arpeggio varies the frequency of a note every tick depending on the parameters.
			case Effects.ARPEGGIO:
				var arpeggio;
			
				// Calculate periods to add depening on arpeggio parameters
				if (tick % 3 == 0) {
					arpeggio = 0;
				} else if (tick % 3 == 1) {
					arpeggio = ((param & 0xF0) >> 4) * 64;
				} else if (tick % 3 == 2) {
					arpeggio = (param & 0x0F) * 64;
				}
				
				// Calculate new frequency.
				var freq = 8363 * Math.pow (2, (4608 - channelPeriod[channel] + arpeggio) / 768);
				sampleStep[channel]    = freq / (samplesPerTick * 3);
			
				break;

			// Note porta up. The rate at which the period of the note is being slid up is quadruppled.
			case Effects.PORTA_UP:
				if (tick == 0 && param != 0) {
					portaStep[channel] = param * 4
				} else if (tick > 0) {
					channelPeriod[channel] -= portaStep[channel];
					var freq = 8363 * Math.pow (2, (4608 - channelPeriod[channel]) / 768);
					sampleStep[channel]    = freq / (samplesPerTick * 3);
				}	
						
				break;
				
			// Note porta down. The porta rate is being quadruppled.
			case Effects.PORTA_DOWN:
				if (tick == 0 && param != 0) {
					portaStep[channel] = param * 4;
				} else if (tick > 0) {
					channelPeriod[channel] += portaStep[channel];
					var freq = 8363 * Math.pow (2, (4608 - channelPeriod[channel]) / 768);
					sampleStep[channel]    = freq / (samplesPerTick * 3);
				}
				
				break;
				
			// Porta to the given note with the given porta speed on each tick. Once the target period is reached stop
			// the porta effct. Porta speed is quadruppled.
			case Effects.TONE_PORTA:
				// Set porta speed if param is present.
				if (tick == 0 && param != 0) {
					portaStep[channel] = param * 4;
				}
				
				// Set note to porta to if present.
				if (tick == 0 && pattern.note[row][channel] != 0) {
					portaNote[channel] = 7680 - (pattern.note[row][channel] - 25 - channelSample[channel].basePeriod) * 64 - channelSample[channel].fineTune / 2;
				}

				// Porta up or down depending on current note period and target period.
				if (channelPeriod[channel] < portaNote[channel]) {
					channelPeriod[channel] += portaStep[channel];
					
					// When the target period is reached stop porta.
					if (channelPeriod[channel] > portaNote[channel]) {
						channelPeriod[channel] = portaNote[channel];
					}
				} else if (channelPeriod[channel] > portaNote[channel]) {
					channelPeriod[channel] -= portaStep[channel];
					
					// When the target period is reached stop porta.
					if (channelPeriod[channel] < portaNote[channel]) {
						channelPeriod[channel] = portaNote[channel];
					}
				}

				// Calculate new sample step.
				var freq = 8363 * Math.pow (2, (4608 - channelPeriod[channel]) / 768);
				sampleStep[channel] = freq / (samplesPerTick * 3);
			
				break;
				
			// Note vibrato using a sine function with an amplitude of a given number of finetunes and a given speed.
			case Effects.VIBRATO:
				// At tick 0 and non zero parameter reset vibrato sine and set new parameters.
				if (tick == 0 && param != 0) {
					// Set vibrato step if parameter non zero.
					if ((param & 0xF0) != 0) {
						vibratoStep[channel] = (2 * Math.PI) * (((param & 0xF0) >> 4) * ticksPerRow) / 64.0;
					}
					
					// Set vibrato amplitude if parameter non zero.
					if ((param & 0x0F) != 0) {
						vibratoAmp[channel]  = (param & 0x0F) * 8;
					}
					
					vibratoPos[channel]  = 0;
				} 
											
				//  Calculate new note frequency and advance vibrato sine pos.
				var vibrato = Math.sin (vibratoPos[channel]) * vibratoAmp[channel];
				var freq = 8363 * Math.pow (2, (4608 - channelPeriod[channel] + vibrato) / 768);
				sampleStep[channel] = freq / (samplesPerTick * 3);
				
				vibratoPos[channel] += vibratoStep[channel];
			
				break;

				
			// Slide the volume up or down on every tick except the first and porta to the note that was set by the
			// tone porta effect. Parameter values > 127 will slide up, lower values slide down.
			case Effects.TONE_PORTA_VOL_SLIDE:
				// Set note to porta to if present.
				if (tick == 0 && pattern.note[row][channel] != 0) {
					portaNote[channel] = 7680 - (pattern.note[row][channel] - 25 - channelSample[channel].basePeriod) * 64 - channelSample[channel].fineTune / 2;
				}
			
				// Porta up or down depending on current note period and target period.
				if (channelPeriod[channel] < portaNote[channel]) {
					channelPeriod[channel] += portaStep[channel];
				
					// When the target period is reached stop porta.
					if (channelPeriod[channel] > portaNote[channel]) {
						channelPeriod[channel] = portaNote[channel];
					}
				} else if (channelPeriod[channel] > portaNote[channel]) {
					channelPeriod[channel] -= portaStep[channel];
				
					// When the target period is reached stop porta.
					if (channelPeriod[channel] < portaNote[channel]) {
						channelPeriod[channel] = portaNote[channel];
					}
				}
				
				// Calculate new sample step and set volume.
				var freq = 8363 * Math.pow (2, (4608 - channelPeriod[channel]) / 768);
				sampleStep[channel] = freq / (samplesPerTick * 3);
				
				var slide = (((param & 0xF0) != 0) ? (param & 0xF0) >> 4 : -(param & 0x0F)) / 64.0;
				sampleVolume[channel] = Math.max (0.0, Math.min (sampleVolume[channel] + slide, 1.0));
			
				break;
				
			// Note vibrato using previous vibrato parameters and do a volume slide using current parameter.
			case Effects.VIBRATO_VOL_SLIDE:
				// On tick 0 copy volume slide parameter if set.
				if (tick == 0 && param != 0) {
					volumeSlide[channel] = param;
				}
			
				//  Calculate new note frequency and advance vibrato sine pos.
				var vibrato = Math.sin (vibratoPos[channel]) * vibratoAmp[channel];
				var freq = 8363 * Math.pow (2, (4608 - channelPeriod[channel] + vibrato) / 768);
				sampleStep[channel] = freq / (samplesPerTick * 3);
				
				vibratoPos[channel] += vibratoStep[channel];
				
				// Set sample volume.
				var slide = (((volumeSlide[channel] & 0xF0) != 0) ? (volumeSlide[channel] & 0xF0) >> 4 : -(volumeSlide[channel] & 0x0F)) / 64.0;
				sampleVolume[channel] = Math.max (0.0, Math.min (sampleVolume[channel] + slide, 1.0));
			
				break;
				
			// Set panning for this channel. 0x00 - left, 0x40 - middle, 0x80 - right. Anything greater than 0x80 
			// couses surround sound on the current channel.
			case Effects.SET_PAN:
				if (tick == 0) {
					channelPan[channel] = param / 128.0;
				}
			
				break;

			// Set sample offset in words.
			case Effects.SAMPLE_OFFSET:
				if (tick == 0) {
					samplePos[channel]     = param * 256;
					sampleRemain[channel] -= param * 256;
				}

				break;
				
			// Slide the volume up or down on every tick except the first. Parameter values > 127 will slide up, lower
			// values slide down.
			case Effects.VOLUME_SLIDE:
    			if (tick > 0 && volumeSlide[channel] != 0) {
					if ((volumeSlide[channel] & 0xF0) == 0xF0 && (volumeSlide[channel] & 0x0F) != 0x00) {
						// Fine volume slide down only on tick 1.
						if (tick == 1) {
							var slide = (volumeSlide[channel] & 0x0F) / 64.0;
							sampleVolume[channel] = Math.max (0.0, sampleVolume[channel] - slide);
						}
					} else if ((volumeSlide[channel] & 0x0F) == 0x0F && (volumeSlide[channel] & 0xF0) != 0x00) {
						// Fine volume slide up only on tick 1.
						if (tick == 1) {
							var slide = ((volumeSlide[channel] & 0xF0) >> 4) / 64.0;
							sampleVolume[channel] = Math.min (1.0, sampleVolume[channel] + slide);
						}
					} else {
						// Normal volume slide.
						var slide = (((volumeSlide[channel] & 0xF0) != 0) ? (volumeSlide[channel] & 0xF0) >> 4 : -(volumeSlide[channel] & 0x0F)) / 64.0;
						sampleVolume[channel] = Math.max (0.0, Math.min (sampleVolume[channel] + slide, 1.0));
					}
				} else if (tick == 0 && param != 0) {
					// On tick 0 copy parameter if set.
					volumeSlide[channel] = param;
				}

				break;

			// After this row jump to row 1 of the given order.
			case Effects.POSITION_JUMP:
				if (tick == 0) {
					orderJump = param;
				}

				break;
				
            // Set the volume of a channel on the first tick according to the given parameter.
			case Effects.SET_VOLUME:
				if (tick == 0) {
					sampleVolume[channel] = Math.max (0.0, Math.min (param / 64.0, 1.0));
				}

				break;

			// At the end of this row jump to the next order and start playing at the row given in the parameter.
			case Effects.PATTERN_BREAK:
				if (tick == 0) {
                    breakPattern = ((param & 0xF0) >> 4) * 10 + (param & 0x0F);
				}

				break;
				
			// Slide note pitch up only on the first tick.
			case Effects.FINE_PORTA_UP:
				if (tick == 0) {
					// If param value present change porta step.
					if (param & 0x0F != 0) {
						portaStep[channel] = (param & 0x0F) * 4;
					}
					
					// Slide pitch up.
					channelPeriod[channel] -= portaStap[channel];
					var freq = 8363 * Math.pow (2, (4608 - channelPeriod[channel]) / 768);
					sampleStep[channel]    = freq / (samplesPerTick * 3);
				}
			
				break;
				
			// Slide note pitch down only on the first tick.
			case Effects.FINE_PORTA_DOWN:
				if (tick == 0) {
					// If param value present change porta step.
					if (param & 0x0F != 0) {
						portaStep[channel] = (param & 0x0F) * 4;
					}

					// Slide pitch down.
					channelPeriod[channel] += portaStap[channel];
					var freq = 8363 * Math.pow (2, (4608 - channelPeriod[channel]) / 768);
					sampleStep[channel]    = freq / (samplesPerTick * 3);
				}

				break;

			// Set the finetune of the sample playing on the current channel.
			case Effects.SET_FINETUNE:
				if (tick == 0 && channelSample[channel] != null) {
					channelSample[channel].fineTune = param & 0x0F;
				}
				
				break;
				
			// Retrigger the note ever param ticks.
			case Effects.RETRIGGER:
				if (tick % (param & 0x0F) == 0) {
					sampleRemain[channel]  = channelSample[channel].sampleLength;
                    samplePos[channel]     = 0;
				}
			
				break;
				
			// Cut the volume of the note to 0 if the current tick equals the parameter value.
			case Effects.CUT_NOTE:
				if (tick == (param & 0x0F)) {
					sampleVolume[channel] = 0.0;
				}
			
				break;
				
			// Set the number of ticks to wait before starting the note.
			case Effects.DELAY_NOTE:
				noteDelay[channel] = (param & 0x0F);
			
				break;

			// Set BMP or tempo on the first tick according to the parameter of the effect. A value greater than 32 will
			// change the BPM, other values change the tempo.
			case Effects.SET_TEMPO_BPM:
				if (tick == 0) {
					if (param <= 32) {
						setSpeed (bpm, param);
					} else {
					    setSpeed (param, ticksPerRow);
					}
				}

				break;

			// No effect or unknown effect.
			default:
				if (pattern.effect[row][channel] != ".") {
					//console.log (pattern.effect[row][channel] + " - " + param);
				}
				break;
		}
	};
	
	
	function setSpeed (beats, ticks) {
	    ticksPerRow = ticks;
	    bpm         = beats;

        var rpm = (24 * bpm) / ticksPerRow;
		var tpm = rpm * ticksPerRow;

		rowDelay  = 60000 / rpm;
		tickDuration = 60000 / tpm;

		samplesPerTick = Math.round (sampleRate / 1000 * tickDuration);
	};
}


/**
 * Load MOD file data as a Module so it can be played by ScripTracker.
 *
 * fileData - String contents of the MOD file.
 */
function ModLoader (fileData) {
	var mod = new Module ();

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

		var sample = new Sample ();
		sample.name         = sampleHeader.substring (0, 22);
        sample.sampleLength = (sampleHeader.charCodeAt (22) * 256 + sampleHeader.charCodeAt (23)) * 2;
		sample.fineTune     = (sampleHeader.charCodeAt (24) & 0x0F);
		sample.volume       = (Math.min (sampleHeader.charCodeAt (25), 64.0)) / 64.0;
		sample.loopStart	= (sampleHeader.charCodeAt (26) * 256 + sampleHeader.charCodeAt (27)) * 2;
		sample.loopLength	= (sampleHeader.charCodeAt (28) * 256 + sampleHeader.charCodeAt (29)) * 2;
		sample.loopType     = (sample.loopLength > 1) ? sample.LOOP_FORWARD : sample.LOOP_NONE;
		
		if (sample.fineTune > 7) sample.fineTune -= 16;
		sample.fineTune *= 16;
		mod.samples.push (sample);
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

				pattern.sample[r][c]      = (byte1 & 0xF0) | ((byte3 & 0xF0) / 16);
				pattern.volume[r][c]      = -1;
				
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
	for (var i = 0; i < mod.samples.length; i ++) {
	    mod.samples[i].loadSample (fileData.substring (filePos, filePos + mod.samples[i].sampleLength), false, mod.signedSample);
        mod.samples[i].sample[0] = 0;
        mod.samples[i].sample[1] = 0;

	    filePos += mod.samples[i].sampleLength;
	}

	return mod;
}


function S3mLoader (fileData) {
	mod = new Module ();
	mod.channels = 32;

	mod.name         = fileData.substring (0, 28);
	mod.songLength   = fileData.charCodeAt (32) + fileData.charCodeAt (33) * 256;
	mod.sampleCount  = fileData.charCodeAt (34) + fileData.charCodeAt (35) * 256;
	mod.patternCount = fileData.charCodeAt (36) + fileData.charCodeAt (37) * 256;
	mod.signedSample = (fileData.charCodeAt (42) == 1) ? true : false;

	this.volumeSlideFlag = (fileData.charCodeAt (38) & 0x40) != 0 || fileData.charCodeAt (40) == 0x00;
	mod.defaultVolume = fileData.charCodeAt (48) / 64.0;
	mod.defaultTempo  = fileData.charCodeAt (49) == 0 ?   6 : fileData.charCodeAt (49);
	mod.defaultBPM    = fileData.charCodeAt (50) < 33 ? 125 : fileData.charCodeAt (50);
	mod.defaultVolume = fileData.charCodeAt (51) / 64.0;

	// Load order table.
	for (var i = 0; i < mod.songLength; i ++) {
		mod.orders[i] = fileData.charCodeAt (96 + i);
	}

	var samplePtrOffset  = 96 + mod.songLength;
    var patternPtrOffset = 96 + mod.songLength + mod.sampleCount * 2;

	// Load samples.
	for (var i = 0; i < mod.sampleCount; i ++) {
		var sampleOffset = (fileData.charCodeAt (samplePtrOffset + i * 2) + fileData.charCodeAt (samplePtrOffset + i * 2 + 1) * 256) * 16;
		var sampleData   = fileData.substring (sampleOffset, sampleOffset + 80);
		var sample       = new Sample ();
		
		sample.sampleIndex  = i;
		sample.name         = sampleData.substring (48, 76);
		sample.sampleLength = sampleData.charCodeAt (16) + sampleData.charCodeAt (17) * 256;
		sample.loopStart    = sampleData.charCodeAt (20) + sampleData.charCodeAt (21) * 256;
		sample.loopLength   = (sampleData.charCodeAt (24) + sampleData.charCodeAt (25) * 256) - sample.loopStart;
		sample.volume       = sampleData.charCodeAt (28) / 64.0;
		sample.loopType     = ((sampleData.charCodeAt (31) & 0x01) != 0) ? sample.LOOP_FORWARD : sample.LOOP_NONE;

		// Calculate the base note from C4 frequency
		sample.basePeriod = (sampleData.charCodeAt (32) + sampleData.charCodeAt (33) * 256);
		sample.basePeriod = (sample.basePeriod) / 8363;
		sample.basePeriod = (Math.log (sample.basePeriod) / Math.log (2)) * 768 + 3072;
		sample.basePeriod = -(Math.round (sample.basePeriod / 64) - 72);
		
		var dataOffset = sampleData.charCodeAt (14) * 16 + sampleData.charCodeAt (15) * 4096;
		var is16Bit    = (sampleData.charCodeAt (31) & 0x04) != 0;
		var dataLength = sample.sampleLength * ((is16Bit) ? 2 : 1);

		if ((sampleData.charCodeAt (31) & 0x02) == 0) {
			// Load mono sample data.
			sample.loadSample (fileData.substring (dataOffset, dataOffset + dataLength), is16Bit, mod.signedSample);
		} else {
			// Load stereo sample data.
			sample.loadStereoSample (fileData.substring (dataOffset, dataOffset + dataLength), is16Bit, mod.signedSample);
		}
		
		mod.samples.push (sample);
	}
	
	// Load patterns.
	for (var p = 0; p < mod.patternCount; p ++) {
        var patternOffset = (fileData.charCodeAt (patternPtrOffset + p * 2) + fileData.charCodeAt (patternPtrOffset + p * 2 + 1) * 256) * 16;
		var patternLength = fileData.charCodeAt (patternOffset) + fileData.charCodeAt (patternOffset + 1) * 256;
		var patternData   = fileData.substring (patternOffset, patternOffset + patternLength);
		
		var pattern = new Pattern (64, mod.channels);
		
		var pos = 2;
		var i = 0;
		while (i != 64) {
			var data = patternData.charCodeAt (pos);

			if (data != 0x00) {
				var channel = data & 0x1F;

				if ((data & 0x20) != 0) {
					pos ++;
					if (patternData.charCodeAt (pos) == 0xFE) {
						// Stop note.
						pattern.note[i][channel] = 97;
					} else if (patternData.charCodeAt (pos) == 0xFF) {
						// Empty note.
						pattern.note[i][channel] = 0;
					} else {
						// Normal note.
						var octave = Math.floor (patternData.charCodeAt (pos) / 16) * 12;
	                	pattern.note[i][channel] = (patternData.charCodeAt (pos) % 16) + octave + 1;
					}

					pattern.sample[i][channel] = patternData.charCodeAt (++pos);
				}

				if ((data & 0x40) != 0) {
					pattern.volume[i][channel] = patternData.charCodeAt (++pos) / 64.0;
				} else {
					pattern.volume[i][channel] = -1;
				}

				if ((data & 0x80) != 0) {
					pos ++;
					
					if (patternData.charCodeAt (pos) == 1) {
						pattern.effect[i][channel] = Effects.SET_TEMPO_BPM;
						pattern.effectParam[i][channel] = patternData.charCodeAt (++pos);
					} else if (patternData.charCodeAt (pos) == 2) {
						pattern.effect[i][channel] = Effects.POSITION_JUMP;
						pattern.effectParam[i][channel] = patternData.charCodeAt (++pos);
					} else if (patternData.charCodeAt (pos) == 3) {
						pattern.effect[i][channel] = Effects.PATTERN_BREAK;
						pattern.effectParam[i][channel] = patternData.charCodeAt (++pos);
					} else if (patternData.charCodeAt (pos) == 4) {
						pattern.effect[i][channel] = Effects.VOLUME_SLIDE;
						pattern.effectParam[i][channel] = patternData.charCodeAt (++pos);
					} else if (patternData.charCodeAt (pos) == 5) {
						pattern.effect[i][channel] = Effects.PORTA_DOWN;
						pattern.effectParam[i][channel] = patternData.charCodeAt (++pos);
						
						if (pattern.effectParam[i][channel] >= 240) {
							pattern.effectParam[i][channel] = Math.round ((pattern.effectParam[i][channel] % 16) / 16.0);
						} else if (pattern.effectParam[i][channel] >= 224) {
							pattern.effectParam[i][channel] = Math.round ((pattern.effectParam[i][channel] % 16) / 4.0);
						}
					} else if (patternData.charCodeAt (pos) == 6) {
						pattern.effect[i][channel] = Effects.PORTA_UP;
						pattern.effectParam[i][channel] = patternData.charCodeAt (++pos);
						
						if (pattern.effectParam[i][channel] >= 240) {
							pattern.effectParam[i][channel] = Math.round ((pattern.effectParam[i][channel] % 16) / 16.0);
						} else if (pattern.effectParam[i][channel] >= 224) {
							pattern.effectParam[i][channel] = Math.round ((pattern.effectParam[i][channel] % 16) / 4.0);
						}
					} else if (patternData.charCodeAt (pos) == 7) {
						pattern.effect[i][channel] = Effects.TONE_PORTA;
						pattern.effectParam[i][channel] = patternData.charCodeAt (++pos);
					} else if (patternData.charCodeAt (pos) == 8) {
						pattern.effect[i][channel] = Effects.VIBRATO;
						pattern.effectParam[i][channel] = patternData.charCodeAt (++pos);
					} else if (patternData.charCodeAt (pos) == 11) {
						pattern.effect[i][channel] = Effects.VIBRATO_VOL_SLIDE;
						pattern.effectParam[i][channel] = patternData.charCodeAt (++pos);
	    			} else {
						pattern.effect[i][channel] = Effects.NONE;
						pattern.effectParam[i][channel] = patternData.charCodeAt (++pos);
					}
					
					//pattern.effect[i][channel] = patternData.charCodeAt (pos);
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


function ItLoader (fileData) {
	return null;
}


function XmLoader (fileData) {
	return null;
}