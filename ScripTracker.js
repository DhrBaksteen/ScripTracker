function ScripTracker () {
	var _this  = this;                  // Self reference for private functions.
	
	var registers = {
		orderIndex:     0,				// Index in the order table of the module.
		currentRow:     0,				// Current row in pattern.
		currentTick:    0,				// Current tick in row.
		
		sampleRate:     22050,			// Playback sample rate.
		bpm:            0,				// Current BPM.
		ticksPerRow:    0,				// Current number of ticks in one row (tempo).
		samplesPerTick: 0,				// Number of samples per tick.
		rowDelay:       0,				// Time in ms taken by each row given the current BPM and tempo.
		tickDuration:   0,				// Time in ms taken by eack tick.
		masterVolume:   0.9,			// The master volume multiplier.
		
		breakPattern: -1,				// Pattern break row to restart next order.
		orderJump:    -1,				// Order jump index of next order.
		rowJump:      -1,				// Row to jump to when looping
		patternDelay:  0,				// Pattern delay will keep the player at the current row until 0.

		channelMute:   [false, false, false, false, false, false, false, false,		// Channel muted flags.
						false, false, false, false, false, false, false, false,
						false, false, false, false, false, false, false, false,
						false, false, false, false, false, false, false, false],
		channelPeriod: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,    			// Current period of each channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		channelSample: [null, null, null, null, null, null, null, null,				// Reference to current sample of channels.
						null, null, null, null, null, null, null, null,
						null, null, null, null, null, null, null, null,
						null, null, null, null, null, null, null, null],
		channelPan:    [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,						// Panning of each channel.
						0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 
						0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 
						0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
		portaNote:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Note period to porta to for each channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		portaStep:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Note porta step per tick.
					    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		vibratoPos:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Vibrato position per channel.
					    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		vibratoStep:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Vibrato step per tick per channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		vibratoAmp:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Vibrato amplitude per channel
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		tremoloPos:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Tremolo position per channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		tremoloStep:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Tremolo step per tick per channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		tremoloAmp:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Tremolo amplitude per channel
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		tremolo:       [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,				// Tremolo volume delta per channel
						1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		volumeSlide:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,			// Volume slide per channel
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		sampleVolume:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,    		// Current volume of each channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		samplePos:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,			// Current sample data position.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		sampleStep:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,			// Sample data step for each channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		sampleRemain:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,			// Sample data remaining on each channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		noteDelay:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,			// Note delay per channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		loopMark:      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,			// Row to jump to when looping.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		loopCount:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,			// Loop counter per channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		envelopePos:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,			// Volume and panning envelope position per channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		noteDecay:     [false, false, false, false, false, false, false, false,	// Is the note on this channel decaying.
						false, false, false, false, false, false, false, false,
						false, false, false, false, false, false, false, false,
						false, false, false, false, false, false, false, false],
				
		/**
		 * Reset all registers to default. The unMute parameter dictates whether channel mute is also to be reset.
		 */
		reset: function (unMute) {
			this.orderIndex  = 0;
			this.currentRow  = 0;
			this.currentTick = 0;
			
			this.sampleRate     = 22050;
			this.bpm            = 0;
			this.ticksPerRow    = 0;
			this.samplesPerTick = 0;
			this.rowDelay       = 0;
			this.tickDuration   = 0;
			this.masterVolume   = 0.9;
			
			this.breakPattern = -1;
			this.orderJump    = -1;
			this.rowJump      = -1;
		
			for (var i = 0; i < 32; i ++) {
				if (unMute) {
					this.channelMute[i]  = false;
				}
				this.channelPeriod[i] = 0;
				this.channelSample[i] = null;
				this.channelPan[i]    = 0.5;
				this.portaNote[i]     = 0;
				this.portaStep[i]     = 0;
				this.vibratoPos[i]    = 0;
				this.vibratoStep[i]   = 0;
				this.vibratoAmp[i]    = 0;
				this.tremoloPos[i]    = 0;
				this.tremoloStep[i]   = 0;
				this.tremoloAmp[i]    = 0;
				this.tremolo[i]       = 1;
				this.volumeSlide[i]   = 0;
				this.sampleVolume[i]  = 0;
				this.samplePos[i]     = 0;
				this.sampleStep[i]    = 0;
				this.sampleRemain[i]  = 0;
				this.noteDelay[i]     = 0;
				this.loopMark[i]      = 0;
				this.loopCount[i]     = 0;
			}
		}
	};
	
	var module  = null;                 // Module file that is playing.
	var pattern = null;                 // The current pattern being played.

	var rowCallbackHandler = null;      // Callback function called when a new row is being processed.

	var isPlaying   = false;						// Is the player currently playing?
	var patternLoop = false;						// Do not jump to next order, but repeat current.
	var audioCtx    = new webkitAudioContext ();	
	var tPrev       = (new Date ()).getTime ();


	this.load = function (mod) {
		registers.reset (true);
		module = mod;
		
		if (module.type == "mod") {
			for (var i = 0; i < module.channels; i ++) {
				registers.channelPan[i] = (i % 2 == 0) ? 0.7 : 0.3;
			}
		}
		
		Effects.SET_TEMPO.handler (registers, 0, module.defaultBPM);
		Effects.SET_SPEED.handler (registers, 0, module.defaultTempo);
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
		if (registers.currentRow >= 8) {
			// Restart current order if we are after row 8.
			registers.currentRow = 0;
		} else {
			registers.currentRow = 0;
			
			// Only jump to previous order if it's safe.
			if (registers.orderIndex - 1 >= 0 && module.orders[registers.orderIndex] != 0xFE) {
				registers.orderIndex --;
				pattern = module.patterns[module.orders[registers.orderIndex]];
			}
		}
	}
	
	
	/**
	 * Jump to the top of the next order.
	 */
	this.nextOrder = function () {
		if (pattern != null) {
			registers.currentRow = pattern.rows - 1;
		}
	}
	
	
	/**
	 * Restart the current module.
	 */
	this.rewind = function () {
		registers.orderIndex = 0;
		registers.currentRow = 0;
		
		// Get first pattern if a module is loaded.
		if (module != null) {
			pattern = module.patterns[module.orders[registers.orderIndex]];
			
			if (rowCallbackHandler != null) {
				rowCallbackHandler (_this);
			}
		}
	};


	/**
	 * Is the given channel muted?
	 */
	this.isMuted = function (channel) {
		return registers.channelMute[channel];
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
		registers.channelMute[channel] = mute;
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
			"order": registers.orderIndex + 1,
			"length": module.songLength,
			"patternIndex": module.orders[registers.orderIndex],
			"pattern": pattern,
			"bpm": registers.bpm,
			"ticks": registers.ticksPerRow,
			"row": registers.currentRow,
			"channel": []
		};
		
		// Export data of current row.
		for (var i = 0; i < 32; i ++) {
			playerData.channel[i] = {};
			playerData.channel[i].rowData = pattern.toText (registers.currentRow, i);
			playerData.channel[i].instrument = (registers.channelSample[i] != null) ? registers.channelSample[i].name : "";
			playerData.channel[i].volume = registers.sampleVolume[i];
			
		}
		
		return playerData;
	};

	
	this.dump = function () {
		console.log (registers);
	}

	/**
	 * Main player 'thread' that calls itself every time a new row should be processed as long as the player is playing.
	 */
	function playerThread () {
		if (!isPlaying) return;
	
		setTimeout (function () {
			try {
				playerThread ();
			} catch (e) {
				console.log ("A player error occurred!");
				console.log (e);
				console.log (registers);
				isPlaying = false;
			}
		}, 1);
	
		var t = (new Date ()).getTime ();
		if (t - tPrev >= registers.rowDelay - 2) {						
			// Process new row.
			playRow ();

			// If a callback handler is registered call it now.
			if (rowCallbackHandler != null) {
				rowCallbackHandler (_this);
			}
		
			tPrev = t + (t - tPrev - registers.rowDelay);
		}
	};


	/**
	 *
	 */
	function playRow () {	
		var row = registers.currentRow;
		
		var samplesL = [];
		var samplesR = [];

		if (registers.patternDelay == 0) {
			for (var c = 0; c < module.channels; c ++) {			
				if (pattern.sample[row][c] != 0) {
					//if (channelSample[c] != module.samples[pattern.sample[row][c] - 1]) {
						registers.channelSample[c] = module.samples[pattern.sample[row][c] - 1];   	// Set current sample
						registers.sampleRemain[c]  = registers.channelSample[c].sampleLength;		// Repeat length of this sample
						registers.samplePos[c]     = 0;                                          	// Restart sample
						registers.envelopePos[c]   = 0;												// Reset volume envelope.
						registers.noteDecay[c]     = false;											// Reset decay.
					//}
					
					if (module.type != "mod") {
						registers.channelPan[c] = registers.channelSample[c].panning;				// Set default panning for sample
					}
					
					// Set default sample volume or row volume (this one also allows volumes of 0 comming from row)
					if (pattern.volume[row][c] > -1) {
						registers.sampleVolume[c] = pattern.volume[row][c];
					} else {
						registers.sampleVolume[c] = registers.channelSample[c].volume;	
					}
				}
				
				// If we do have a sample and the volume on the row > 0 then use this as sample volume.
				registers.tremolo[c] = 1.0;		// Also reset tremolo :)
				if (registers.channelSample[c] != null && pattern.volume[row][c] > 0) {
					registers.sampleVolume[c] = pattern.volume[row][c];
				}

				// This row contains a note and we are not doing a slide to note.
				if (pattern.note[row][c] != 0 && pattern.effect[row][c] != Effects.TONE_PORTA && pattern.effect[row][c] != Effects.TONE_PORTA_VOL_SLIDE) {
					if (pattern.note[row][c] == 97) {
						registers.noteDecay[c]    = true;
					} else if (registers.channelSample[c] != null) {
						registers.channelPeriod[c] = 7680 - (pattern.note[row][c] - 25 - registers.channelSample[c].basePeriod) * 64 - registers.channelSample[c].fineTune / 2;
						var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[c]) / 768);
						
						registers.samplePos[c]     = 0;														// Restart sample
						registers.noteDelay[c]     = 0;														// Reset note delay
						registers.sampleRemain[c]  = registers.channelSample[c].sampleLength;				// Repeat length of this sample
						registers.sampleStep[c]    = freq / (registers.samplesPerTick * 3);					// Samples per division
					}
				}
			}
		}
		
		for (var t = 0; t < registers.ticksPerRow; t ++) {
			for (var c = 0; c < module.channels; c ++) {
				// Process effects.
				var param = pattern.effectParam[registers.currentRow][c];
				pattern.effect[registers.currentRow][c].handler (registers, c, param, pattern);
				
				// Stop playback when ticks is set to 0.
				if (registers.ticksPerRow == 0) {
					isPlaying = false;
					
					if (module.defaultTempo > 0) {
						Effects.SET_TEMPO.handler (registers, 0, module.defaultBPM);
						Effects.SET_SPEED.handler (registers, 0, module.defaultTempo);
						pattern = module.patterns[module.orders[registers.orderIndex]];
			
						if (rowCallbackHandler != null) {
							rowCallbackHandler (_this);
						}
					}
					
					return;
				}

				var vEnvelopeValue = 1.0;
				var pEnvelopeValue = 0.5;
				
				// Generate samples for current tick and channel.
				var sIndex = registers.samplesPerTick * t;
				for (var s = 0; s < registers.samplesPerTick; s ++) {
					if (c == 0) {
						samplesL[sIndex] = 0.0;
						samplesR[sIndex] = 0.0;
					}

			        if (registers.channelSample[c] != null && registers.noteDelay[c] == 0 && !registers.channelMute[c]) {
						// Get envelope values and increment envelope position.
						if (s == 0) {
							vEnvelopeValue = registers.channelSample[c].volEnvelope.getValue (registers.envelopePos[c], registers.noteDecay[c], 1.0);
							pEnvelopeValue = registers.channelSample[c].panEnvelope.getValue (registers.envelopePos[c], registers.noteDecay[c], 0.5);
							registers.envelopePos[c] ++;
						}
					
			            var sample = registers.channelSample[c].sample[Math.floor (registers.samplePos[c])] * registers.sampleVolume[c] * vEnvelopeValue;						

						if (registers.channelPan[c] <= 1.0) {
							// Normal panning.
							samplesL[sIndex] += sample * (1.0 - registers.channelPan[c]) * (1.0 - pEnvelopeValue) * registers.tremolo[c];
                        	samplesR[sIndex] += sample *        registers.channelPan[c]  *        pEnvelopeValue  * registers.tremolo[c];
						} else {
							// Surround sound.
							samplesL[sIndex] += sample * 0.5 * registers.tremolo[c];
                        	samplesR[sIndex] -= sample * 0.5 * registers.tremolo[c];
						}

						registers.samplePos[c]    += registers.sampleStep[c];
						registers.sampleRemain[c] -= registers.sampleStep[c];

						// Loop or stop the sample when we reach its end.
						if (registers.sampleRemain[c] <= 0) {
						    if (registers.channelSample[c].loopType == registers.channelSample[c].LOOP_FORWARD) {
						    	registers.samplePos[c]    = registers.channelSample[c].loopStart  - registers.sampleRemain[c];
						    	registers.sampleRemain[c] = registers.channelSample[c].loopLength + registers.sampleRemain[c];
							} else if (registers.channelSample[c].loopType == registers.channelSample[c].LOOP_PINGPONG) {
						    	registers.samplePos[c]    = registers.channelSample[c].loopStart  - registers.sampleRemain[c];
						    	registers.sampleRemain[c] = registers.channelSample[c].loopLength + registers.sampleRemain[c];
							} else {
							    registers.samplePos[c]    = registers.channelSample[c].sampleLength - 1;
						    	registers.sampleStep[c]   = 0;
								registers.sampleVolume[c] = 0.0;
							}
						}
					}

                    sIndex ++;
				}
				
				// If a note delay is set decrease it.
				registers.noteDelay[c] = Math.max (0, registers.noteDelay[c] - 1);
			}
			
			registers.currentTick ++;
		}

		var audioBuffer = audioCtx.createBuffer (2, samplesL.length, registers.sampleRate);
		
		// Clip sample values [-1, 1] and apply master volume.
		for (var i = 0; i < samplesL.length; i ++) {
			samplesL[i] = Math.max (-1, Math.min (samplesL[i], 1)) * registers.masterVolume;
			samplesR[i] = Math.max (-1, Math.min (samplesR[i], 1)) * registers.masterVolume;
		}

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
		
		// If an order jump is encountered jump to row 1 of the order at the given index.
		if (registers.orderJump != -1 && !patternLoop) {
			registers.currentRow = -1;
			registers.orderIndex = Math.min (module.songLength - 1, registers.orderJump);
            pattern              = module.patterns[module.orders[registers.orderIndex]];
		}
		
		// Handle pattern break if there is one.
		if (registers.breakPattern != -1) {
			registers.currentRow = registers.breakPattern - 1;
			
			// Only handle pattern break when not looping a pattern.
			if (!this.repeatOrder && registers.orderJump == -1) {
				registers.orderIndex ++;

				// Handle the skip order marker.
				while (module.orders[registers.orderIndex] == 0xFE && registers.orderIndex < module.songLength) {
					registers.orderIndex ++
				}
				
				// When we reach the end of the song jump back to the restart position.
				if (registers.orderIndex == module.songLength || module.orders[registers.orderIndex] == 0xFF) {
					registers.orderIndex = module.restartPosition;
				}
				
				pattern = module.patterns[module.orders[registers.orderIndex]];
			}
		}
		
		// Jump to a particular row in the current pattern;
		if (registers.rowJump > -1) {
			registers.currentRow = registers.rowJump - 1;
			registers.rowJump = -1;
		}

		// Remain at the current row if pattern delay is active.
		if (registers.patternDelay < 2) {
			registers.orderJump    = -1;
			registers.breakPattern = -1;
			registers.currentRow ++;
			registers.currentTick  = 0;
			registers.patternDelay = 0;
		} else {
			registers.patternDelay --;
		}

		// When we reach the end of our current pattern jump to the next one.
		if (registers.currentRow == pattern.rows) {
			registers.currentRow = 0;
			if (!patternLoop) registers.orderIndex = (registers.orderIndex + 1) % module.orders.length;

			// Handle the skip order marker.
			while (module.orders[registers.orderIndex] == 0xFE && registers.orderIndex < module.songLength) {
				registers.orderIndex ++
			}
			
			// When we reach the end of the song jump back to the restart position.
			if (registers.orderIndex == module.songLength || module.orders[registers.orderIndex] == 0xFF) {
				registers.orderIndex = module.restartPosition;
			}
            pattern = module.patterns[module.orders[registers.orderIndex]];
		}
	};
}