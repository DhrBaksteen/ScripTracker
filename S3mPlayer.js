function S3mPlayer (mod) {
	this.mod = mod;
	this.playing     = false;
	this.repeatOrder = false;
	this.divisionCallback = null;

	this.order    = 0;
	this.division = 0;
	this.ticksPerDiv = 6;
	this.bpm = 125;

	this.pattern  = mod.patterns[mod.orderTable[this.order]];
	this.sampleRate  = 22050;
	this.sampleRatio = this.sampleRate / 3546895;

	this.divDuration    = 0;        // Time spent in 1 division in ms.
	this.tickDuration   = 0;        // Time spent in 1 tick in ms.
	this.samplesPerTick = 0;        // Number of actual playback samples in 1 tick.
	this.divBufferSize  = 0;        // Number of actual playback samples in 1 division.

	this.channelMute   = [];
	this.channelPeriod = [];
	this.channelOctave = [];
	this.channelSample = [];
	this.samplePos     = [];
	this.sampleStep    = [];
	this.sampleRepeat  = [];
	this.sampleVolume  = [];

    this.audioCtx = new webkitAudioContext ();


    for (var i = 0; i < this.mod.channels; i ++) {
		this.channelMute[i]   = false;
	    this.channelPeriod[i] = 0;
		this.channelOctave[i] = 0;
		this.channelSample[i] = null;
		this.samplePos[i]     = 0;
		this.sampleStep[i]    = 0;
		this.sampleRepeat[i]  = 0;
		this.sampleVolume[i]  = 0;
	}


	/**
	 * Player thread.
	 */
	this.run = function () {
        var time = (new Date ()).getTime ();
		var _this = this;

		// Generate sound for one division.
		this.renderDivision ();

		// Callback function for player feedback.
		if (this.divisionCallback != null) {
			this.divisionCallback (this);
		}

		// Wait until the next division starts.
        var dTime = ((new Date ()).getTime () - time);
		if (this.playing) {
	    	setTimeout (function () {
				_this.run ()
			}, _this.divDuration - dTime);
		}
	};


	/**
	 * Start playback if the player is not playing already.
	 */
	this.play = function () {
		if (!this.playing) {
			this.playing = true;
			this.run ();
		}
	}


	/**
	 * Stop playback.
	 */
	this.stop = function () {
  		this.playing = false;
	}


	/**
	 * Jump to the previous order.
	 */
    this.prevOrder = function () {
        this.division = 0;
		this.order = Math.max (0, this.order - 1);
		this.pattern = mod.patterns[mod.orderTable[this.order]];
	};


	/**
	 * Jump to the next order.
	 */
	this.nextOrder = function () {
        this.division = 0;
		this.order ++;
		this.pattern = mod.patterns[mod.orderTable[this.order]];
	};


	/**
	 * Is the player currently playing?
	 */
 	this.isPlaying = function () {
		return this.playing;
	};


	/**
	 * Set the function that is colled on every line to update player status view. Set to NULL if no callback function
	 * should be called.
	 */
	this.setDivisionCallback = function (callback) {
		this.divisionCallback = callback;
	};


	this.renderDivision = function () {
		for (var c = 0; c < 32; c ++) {
        	if (this.pattern.sample[c][this.division] != 0) {
				if (this.channelSample[c] != this.mod.samples[this.pattern.sample[c][this.division] - 1]) {
	            	this.channelSample[c] = this.mod.samples[this.pattern.sample[c][this.division] - 1];   	// Set current sample
                    this.sampleRepeat[c]  = this.channelSample[c].dataLength;								// Repeat length of this sample
                    this.samplePos[c]     = 0;                                          					// Restart sample

					console.log ("Set sample on channel " + c);
				}
			    this.sampleVolume[c]  = this.channelSample[c].volume;                                   	// Set default sample volume
			}

		    if (this.pattern.note[c][this.division] != 255) {
		        this.channelPeriod[c] = this.pattern.note[c][this.division];
				this.channelOctave[c] = this.pattern.octave[c][this.division];

				if (this.channelSample[c]) {
				    var rate = this.sampleRatio * (133808 * (this.channelPeriod[c] >> this.channelOctave[c])) / (this.channelSample[c].cPeriod * 4);

					this.samplePos[c]     = 0;                                          // Restart sample
			    	this.sampleRepeat[c]  = this.channelSample[c].dataLength;			// Repeat length of this sample
					this.sampleStep[c]    = 1 / (rate);									// Samples per division
					console.log ("Set period on channel " + c);
				}
			}
		}

		// Generate all samples for this division...
		var divSamples = [];
		var bIndex = 0;

		for (var t = 0; t < this.ticksPerDiv; t ++) {
		    for (var c = 0; c < 32; c ++) {
				bIndex = this.samplesPerTick * t;
				for (var s = 0; s < this.samplesPerTick; s ++) {
					if (c == 0) divSamples[bIndex] = 0.0;

			        if (this.channelSample[c] != null && !this.channelMute[c]) {
			            var sample = this.channelSample[c].sample[Math.floor (this.samplePos[c])] * 1.0; //this.sampleVolume[c];
						divSamples[bIndex] += sample;

						this.samplePos[c]    += this.sampleStep[c];
						this.sampleRepeat[c] -= this.sampleStep[c];

						if (this.sampleRepeat[c] <= 0) {
						    if (this.channelSample[c].isRepeat) {
						    	this.samplePos[c]    = this.channelSample[c].repeatOffset - this.sampleRepeat[c];
						    	this.sampleRepeat[c] = this.channelSample[c].repeatLength + this.sampleRepeat[c];
							} else {
							    this.samplePos[c]  = this.channelSample[c].dataLength - 1;
						    	this.sampleStep[c] = 0;
							}
						}
					}

                    bIndex ++;
				}
			}
		}

		console.log (divSamples.length);
		console.log (this.sampleRate);
		this.audioBuffer = this.audioCtx.createBuffer (1, divSamples.length, this.sampleRate);
		this.source = this.audioCtx.createBufferSource (0);
		this.audioBuffer.getChannelData (0).set (divSamples);
		this.source.buffer = this.audioBuffer;
  		this.source.connect (this.audioCtx.destination);
  		this.source.noteOn (0);

		this.division ++;
		if (this.division == 64) {
		    this.division = 0;
			if (!this.repeatOrder) {
		    	this.order ++;
                if (this.order == mod.orderCount) {
					this.playing = false;
				} else {
		    		this.pattern = mod.patterns[mod.orderTable[this.order]];
				}
			}
		}
	}


	this.setSpeed = function (bpm, ticks) {
	    this.ticksPerDiv = ticks;
	    this.bpm = bpm;

        var dpm = (24 * this.bpm) / this.ticksPerDiv;
		var tpm = dpm * this.ticksPerDiv;

		this.divDuration  = 60000 / dpm;
		this.tickDuration = 60000 / tpm;

		this.samplesPerTick = Math.round (this.sampleRate / 1000 * this.tickDuration);
		this.divBufferSize  = this.samplesPerTick * this.ticksPerDiv;
	};


	/**
	 * Get player data.
	 */
	this.getSongData = function () {
		return {
			songName: (this.mod != null) ? this.mod.name : "",
			bpm:      this.bpm,
			ticks:    this.ticksPerDiv,
			order:    (this.mod != null) ? this.order + 1 : 0,
			length:   (this.mod != null) ? this.mod.orderCount : 0,
			pattern:  (this.mod != null) ? this.mod.orderTable[this.order] : 0,
			division: this.division,
			patData:  this.pattern
		}
	};

	this.setSpeed (125, 6);

}