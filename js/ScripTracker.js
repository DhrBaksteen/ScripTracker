/**
 * ScripTracker.js
 *
 * ScripTracker is a JavaScript mod player that can play MOD, S3M and XM music in a modern browser using the Audio API.
 *
 * Author:  		Maarten Janssen
 * Date:    		2013-02-14
 * Last updated:	2014-05-19
 */
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
		channelNote:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,    			// Current note of each channel.
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
		volumeSlide:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Volume slide per channel
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		sampleVolume:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,    			// Current volume of each channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		samplePos:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Current sample data position.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		sampleStep:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Sample data step for each channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		sampleRemain:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Sample data remaining on each channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		noteDelay:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Note delay per channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		loopMark:      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Row to jump to when looping.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		loopCount:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Loop counter per channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		volEnvelope:   [null, null, null, null, null, null, null, null,				// Reference to current sample of channels.
						null, null, null, null, null, null, null, null,
						null, null, null, null, null, null, null, null,
						null, null, null, null, null, null, null, null],
		panEnvelope:   [null, null, null, null, null, null, null, null,				// Reference to current sample of channels.
						null, null, null, null, null, null, null, null,
						null, null, null, null, null, null, null, null,
						null, null, null, null, null, null, null, null],
		envelopePos:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,				// Volume and panning envelope position per channel.
						0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		noteDecay:     [false, false, false, false, false, false, false, false,		// Is the note on this channel decaying.
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
				this.volEnvelope[i]   = null;
				this.panEnvelope[i]   = null;
				this.envelopePos[i]   = 0;
				this.noteDecay[i]     = false;
			}
		}
	};

	var module  = null;                 			// Module file that is playing.
	var pattern = null;                 			// The current pattern being played.

	var rowCallbackHandler = null;      			// Callback function called when a new row is being processed.

	var isPlaying   = false;						// Is the player currently playing?
	var patternLoop = false;						// Do not jump to next order, but repeat current.
	var audioCtx    = new webkitAudioContext ();	// AudioContext for output.
	var tNext       = 0								// Time of next player 'thread' update.


	/**
	 * Load the given ScripTracker Module object and start playback.
	 *
	 * mod - A ScripTacker Module object generated by any of the loaders (e.g. ModLoader, S3mLoader, XmLoader).
	 */
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
	 * Main player 'thread' that calls itself every time a new row should be processed as long as the player is playing.
	 */
	function playerThread () {
		if (!isPlaying) return;

		// Try updating the player if time interval has passed.
		try {
			var t = (new Date ()).getTime ();
			if (t >= tNext) {
				// Process new row.
				playRow ();

				// If a callback handler is registered call it now.
				if (rowCallbackHandler != null) {
					rowCallbackHandler (_this);
				}

				// Calculate time of next update.
				var dPlayer = (new Date ()).getTime () - t;
				tNext = ((new Date ()).getTime () + registers.rowDelay) - dPlayer;
			}
		// Notify user on error.
		} catch (e) {
			console.log (e);
			console.log (registers);
			_this.stop  ();

			if (errorHandler != null) {
				errorHandler (e.message);
			}
		}
		
		// Schedule next update of the player 'thread'.
		setTimeout (function () {
			playerThread ();			
		}, 1);
	};


	/**
	 * Convert the current row to sample data and send it to output.
	 */
	function playRow () {	
		var row = registers.currentRow;
		var samplesL = [];
		var samplesR = [];

		if (registers.patternDelay == 0) {
			for (var c = 0; c < module.channels; c ++) {			
			
				// Update current note if there is one.
				if (pattern.note[row][c] != 0) {
					registers.channelNote[c] = pattern.note[row][c] - 1;
				}
			
				// Change instrument.
				if (pattern.instrument[row][c] != 0) {
					var instrument = module.instruments[pattern.instrument[row][c] - 1];
					var sampleKey  = instrument.sampleKeyMap[registers.channelNote[c]];
					
					// Set sample and envelope registers.
					registers.channelSample[c] = instrument.samples[sampleKey];					// Set sample based on current note.
					registers.sampleVolume[c]  = registers.channelSample[c].volume;				// Set base sample volume.
					registers.sampleRemain[c]  = registers.channelSample[c].sampleLength;		// Repeat length of this sample.
					registers.samplePos[c]     = 0;                                          	// Restart sample.
					
					registers.volEnvelope[c]   = instrument.volumeEnvelope;						// Get volume envelope.
					registers.panEnvelope[c]   = instrument.panningEnvelope;					// Get panning envelope.
					registers.envelopePos[c]   = 0;												// Reset volume envelope.
					registers.noteDecay[c]     = false;											// Reset decay.

					// Set channel panning (for MOD use predefined panning).
					if (module.type != "mod") {
						registers.channelPan[c] = registers.channelSample[c].panning;
					}
				}

				// If we do have a sample and the volume on the row > 0 then use this as sample volume.
				registers.tremolo[c] = 1.0;														// Reset tremolo on each row.
				if (registers.channelSample[c] != null && pattern.volume[row][c] > -1) {
					registers.sampleVolume[c] = pattern.volume[row][c];
				}

				// This row contains a note and we are not doing a slide to note.
				if (pattern.note[row][c] != 0 && pattern.effect[row][c] != Effects.TONE_PORTA && pattern.effect[row][c] != Effects.TONE_PORTA_VOL_SLIDE) {
					// On stop note start the release part of the envelope.
					if (pattern.note[row][c] == 97) {
						registers.noteDecay[c] = true;											// Start release portion of envelopes.
						
					// Update sample frequencies if we have a sample loaded.
					} else if (registers.channelSample[c] != null) {
						registers.channelPeriod[c] = 7680 - (pattern.note[row][c] - 25 - registers.channelSample[c].basePeriod) * 64 - registers.channelSample[c].fineTune / 2;
						var freq = 8363 * Math.pow (2, (4608 - registers.channelPeriod[c]) / 768);

						registers.samplePos[c]     = 0;											// Restart sample.
						registers.noteDelay[c]     = 0;											// Reset note delay.
						registers.sampleRemain[c]  = registers.channelSample[c].sampleLength;	// Repeat length of this sample.
						registers.sampleStep[c]    = freq / (registers.samplesPerTick * 3);		// Samples per division.
					}
				}
			}
		}
		
		
		// Pre-process all BPM and Tick count altering effects to prevent uneven sample buffer lengths.
		for (var c = 0; c < module.channels; c ++) {
			if (pattern.effect[registers.currentRow][c] == Effects.SET_TEMPO_BPM ||
				pattern.effect[registers.currentRow][c] == Effects.SET_SPEED ||
				pattern.effect[registers.currentRow][c] == Effects.SET_TEMPO) {
				var param = pattern.effectParam[registers.currentRow][c];
				pattern.effect[registers.currentRow][c].handler (registers, c, param, pattern);
			}
		}
		

		// Create sample buffer for each tick in the current row.
		for (var t = 0; t < registers.ticksPerRow; t ++) {
			for (var c = 0; c < module.channels; c ++) {
				// Process effects.
				var param = pattern.effectParam[registers.currentRow][c];
				pattern.effect[registers.currentRow][c].handler (registers, c, param, pattern);

				// Stop and reset playback when ticks is set to 0.
				if (registers.ticksPerRow == 0) {
					isPlaying = false;
					registers.reset ();

					// Try to re-initialize to the first order.
					if (module.defaultTempo > 0) {
						Effects.SET_TEMPO.handler (registers, 0, module.defaultBPM);
						Effects.SET_SPEED.handler (registers, 0, module.defaultTempo);
						pattern = module.patterns[module.orders[registers.orderIndex]];						
					}
					
					// Send final update to the UI handler.
					if (rowCallbackHandler != null) {
						rowCallbackHandler (_this);
					}

					return;
				}

				// Generate samples for current tick and channel.
				var sIndex = registers.samplesPerTick * t;
				var vol    = 1.0;
				var pan    = 0.5;

				// Generate all samples for the current tick.
				for (var s = 0; s < registers.samplesPerTick; s ++) {
					if (c == 0) {
						samplesL[sIndex] = 0.0;
						samplesR[sIndex] = 0.0;
					}

			        if (registers.channelSample[c] != null && registers.noteDelay[c] == 0 && !registers.channelMute[c]) {
						// Get envelope values and calculate volume and pan for samples during this tick.
						if (s == 0) {
							var vEnvelopeValue = registers.volEnvelope[c].getValue (registers.envelopePos[c], registers.noteDecay[c], 1.0, (c > 4 && c < 8));
							var pEnvelopeValue = registers.panEnvelope[c].getValue (registers.envelopePos[c], registers.noteDecay[c], 0.5);
							registers.envelopePos[c] ++;

							vol = registers.sampleVolume[c] * vEnvelopeValue * registers.tremolo[c];
							pan = Math.max (0.0, Math.min (registers.channelPan[c] + ((pEnvelopeValue - 0.5) * ((2 - Math.abs (registers.channelPan[c] - 2)) / 0.5)), 1.0));
						}

			            var sample = registers.channelSample[c].sample[Math.floor (registers.samplePos[c])];						

						// Normal panning.
						if (registers.channelPan[c] <= 1.0) {							
							samplesL[sIndex] += sample * (1.0 - pan) * vol;
							samplesR[sIndex] += sample *        pan  * vol;
							
						// Surround sound.
						} else {							
							samplesL[sIndex] += sample * 0.5 * vol;
                        	samplesR[sIndex] -= sample * 0.5 * vol;
						}

						registers.samplePos[c]    += registers.sampleStep[c];
						registers.sampleRemain[c] -= registers.sampleStep[c];

						// Loop or stop the sample when we reach its end.
						if (registers.sampleRemain[c] <= 0) {
						    if (registers.channelSample[c].loopType == SampleLoop.LOOP_FORWARD) {
						    	registers.samplePos[c]    = registers.channelSample[c].loopStart  - registers.sampleRemain[c];
						    	registers.sampleRemain[c] = registers.channelSample[c].loopLength + registers.sampleRemain[c];
							} else if (registers.channelSample[c].loopType == SampleLoop.LOOP_PINGPONG) {
						    	registers.samplePos[c]    = registers.channelSample[c].loopStart  - registers.sampleRemain[c];
						    	registers.sampleRemain[c] = registers.channelSample[c].loopLength + registers.sampleRemain[c];
							} else {
							    registers.samplePos[c]  = registers.channelSample[c].sampleLength - 1;
						    	registers.sampleStep[c] = 0;
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
			if (!patternLoop) registers.orderIndex ++;

			// Handle the skip order marker.
			while (module.orders[registers.orderIndex] == 0xFE && registers.orderIndex < module.songLength) {
				registers.orderIndex ++
			}

			// When we reach the end of the song jump back to the restart position.
			if (registers.orderIndex >= module.songLength || module.orders[registers.orderIndex] == 0xFF) {
				registers.orderIndex = module.restartPosition;
			}

            pattern = module.patterns[module.orders[registers.orderIndex]];
		}
	};


	/**
	 * Start playback if player is stopped and a module is loaded.
	 */
	this.play = function () {
		if (!isPlaying && module != null) {	
			isPlaying = true;
			tPrev = (new Date ()).getTime ();
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
	 *
	 * channel - Index of the channel to check.
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
	 * 
	 * channel - Index of the channel to toggle mute.
	 * mute    - Mate state of the given channel.
	 */
	this.setMute = function (channel, mute) {
		registers.channelMute[channel] = mute;
	}


	/**
	 * Set the pattern loop flag.
	 *
	 * loop - Sets or clears the pattern loop.
	 */
	this.setPatternLoop = function (loop) {
		patternLoop = loop;
	}


	/**
	 * Register a function as callback handler called when a new row is being processed. This function is called with a
	 * reference to ScripTracker as its first parameter. Set the handler to null to remove the callback handler.
	 *
	 * handler - A function that serves as callback handler.
	 */
	this.setRowCallbackhandler = function (handler) {
		rowCallbackHandler = handler;
	}

	/**
	 * Get the name of the currently loaded module.
	 */
	this.getSongName = function () {
		return module.name;
	};


	/**
	 * Get the currently active order number .
	 */
	this.getCurrentOrder = function () {
		return registers.orderIndex + 1;
	};


	/**
	 * Get the index of the currently active pattern.
	 */
	this.getCurrentPattern = function () {
		return module.orders[registers.orderIndex];
	};


	/**
	 * Get the song length as the number of orders.
	 */
	this.getSongLength = function () {
		return module.songLength;
	};


	/**
	 * Get the current BPM of the song.
	 */
	this.getCurrentBPM = function () {
		return registers.bpm;
	};


	/**
	 * Get the current number of ticks per row.
	 */
	this.getCurrentTicks = function () {
		return registers.ticksPerRow;
	};


	/**
	 * Get the currently active row of the pattern.
	 */
	this.getCurrentRow = function () {
		return registers.currentRow;
	};


	/**
	 * Get the number of rows in the current pattern.
	 */
	this.getPatternRows = function () {
		return pattern.rows;
	};


	/**
	 * Get the volume [0.0, 1.0] of the given channel.
	 *
	 * channel - Channel index to get the volume.
	 */
	this.getChannelVolume = function (channel) {
		if (registers.channelSample[channel]) {
			return registers.sampleVolume[channel] * registers.volEnvelope[channel].getValue (registers.envelopePos[channel], registers.noteDecay[channel], 1.0);
		} else {
			return registers.sampleVolume[channel];
		}
	};


	/**
	 * Get the name of the instrument playing on the given channel. Actually returns the samples name, but this is the 
	 * same as the instrument name.
	 *
	 * channel - Channel index to get instrument name.
	 */
	this.getChannelInstrument = function (channel) {
		return (registers.channelSample[channel] != null) ? registers.channelSample[channel].name : "";
	};


	/**
	 * Get note info text for the given channel and row. e.g. 'C-5 01 .. ...'.
	 *
	 * channel - Channel index
	 * row     - Row number it get info of.
	 */
	this.getNoteInfo = function (channel, row) {
		return pattern.toText (row, channel, module.type);
	};


	/**
	 * Dump player registers and current pattern data to the console for debugging.
	 */
	this.dump = function () {
		console.log (registers);
		console.log (pattern);
	}
}