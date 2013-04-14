function ModPlayer (mod) {
	this.EFFECT_ARPEGGIO = 0;
	this.EFFECT_PORTA_UP = 1;
	this.EFFECT_PORTA_DOWN = 2;
	this.EFFECT_PORTA_TO_NOTE = 3;
	this.EFFECT_VIBRATO = 4;
	this.EFFECT_PROTA_VOL = 5;
	this.EFFECT_VIBRATO_VOL = 6;
	this.EFFECT_TREMOLO = 7;
	this.EFFECT_PAN = 8;
	this.EFFECT_SAMPLE_OFFSET = 9;
	this.EFFECT_VOLUME_SLIDE = 10;
	this.EFFECT_JUMP_TO = 11;
	this.EFFECT_SET_VOLUME = 12;
	this.EFFECT_PATTERN_BREAK = 13;
	this.EFFECT_EXTENDED = 14;
	this.EFFECT_SET_FINE_TUNE = 5;
	this.EFFECT_FINE_VOLUME_UP = 10;
	this.EFFECT_FINE_VOLUME_DOWN = 11;
	this.EFFECT_NOTE_DELAY = 13;
	this.EFFECT_SET_SPEED = 15;

	this.mod = mod;
	this.playing     = false;
	this.repeatOrder = false;
	this.divisionCallback = null;

	this.order    = 0;
	this.division = 0;
	this.ticksPerDiv = 6;
	this.bpm = 125;
	this.vibratoPos = Math.PI / 32;

	this.pattern  = mod.patterns[mod.orderTable[this.order]];
	this.sampleRate  = 22050;
	this.sampleRatio = this.sampleRate / 3546895;

	this.divDuration    = 0;        // Time spent in 1 division in ms.
	this.tickDuration   = 0;        // Time spent in 1 tick in ms.
	this.samplesPerTick = 0;        // Number of actual playback samples in 1 tick.
	this.divBufferSize  = 0;        // Number of actual playback samples in 1 division.

	this.breakPattern  = -1;
	this.orderJump     = -1;
	this.channelMute   = [];
	this.channelPeriod = [];
	this.channelSample = [];
	this.samplePos     = [];
	this.sampleStep    = [];
	this.sampleRepeat  = [];
	this.sampleVolume  = [];
	this.volumeSlide   = [];
	this.effect        = [];
	this.porta         = [];
	this.vibrato       = [];
	this.effectParam   = [];
	this.noteDelay     = [];

	this.periods = [[1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960 , 906,
					 856 , 808 , 762 , 720 , 678 , 640 , 604 , 570 , 538 , 508 , 480 , 453,
					 428 , 404 , 381 , 360 , 339 , 320 , 302 , 285 , 269 , 254 , 240 , 226,
					 214 , 202 , 190 , 180 , 170 , 160 , 151 , 143 , 135 , 127 , 120 , 113,
					 107 , 101 , 95  , 90  , 85  , 80  , 75  , 71  , 67  , 63  , 60  , 56 ],
					[1700, 1604, 1514, 1430, 1348, 1274, 1202, 1134, 1070, 1010, 954 , 900,
					 850 , 802 , 757 , 715 , 674 , 637 , 601 , 567 , 535 , 505 , 477 , 450,
					 425 , 401 , 379 , 357 , 337 , 318 , 300 , 284 , 268 , 253 , 239 , 225,
					 213 , 201 , 189 , 179 , 169 , 159 , 150 , 142 , 134 , 126 , 119 , 113,
					 106 , 100 , 94  , 89  , 84  , 79  , 75  , 71  , 67  , 63  , 59  , 56 ],
					[1688, 1592, 1504, 1418, 1340, 1264, 1194, 1126, 1064, 1004, 948 , 894,
					 844 , 796 , 752 , 709 , 670 , 632 , 597 , 563 , 532 , 502 , 474 , 447,
					 422 , 398 , 376 , 355 , 335 , 316 , 298 , 282 , 266 , 251 , 237 , 224,
					 211 , 199 , 188 , 177 , 167 , 158 , 149 , 141 , 133 , 125 , 118 , 112,
					 105 , 99  , 94  , 88  , 83  , 79  , 74  , 70  , 66  , 62  , 59  , 56 ],
					[1676, 1582, 1492, 1408, 1330, 1256, 1184, 1118, 1056, 996 , 940 , 888,
					 838 , 791 , 746 , 704 , 665 , 628 , 592 , 559 , 528 , 498 , 470 , 444,
					 419 , 395 , 373 , 352 , 332 , 314 , 296 , 280 , 264 , 249 , 235 , 222,
					 209 , 198 , 187 , 176 , 166 , 157 , 148 , 140 , 132 , 125 , 118 , 111,
					 104 , 99  , 93  , 88  , 83  , 78  , 74  , 70  , 66  , 62  , 59  , 55 ],
					[1664, 1570, 1482, 1398, 1320, 1246, 1176, 1110, 1048, 990 , 934 , 882,
					 832 , 785 , 741 , 699 , 660 , 623 , 588 , 555 , 524 , 495 , 467 , 441,
					 416 , 392 , 370 , 350 , 330 , 312 , 294 , 278 , 262 , 247 , 233 , 220,
					 208 , 196 , 185 , 175 , 165 , 156 , 147 , 139 , 131 , 124 , 117 , 110,
					 104 , 98  , 92  , 87  , 82  , 78  , 73  , 69  , 65  , 62  , 58  , 55 ],
					[1652, 1558, 1472, 1388, 1310, 1238, 1168, 1102, 1040, 982 , 926 , 874,
					 826 , 779 , 736 , 694 , 655 , 619 , 584 , 551 , 520 , 491 , 463 , 437,
					 413 , 390 , 368 , 347 , 328 , 309 , 292 , 276 , 260 , 245 , 232 , 219,
					 206 , 195 , 184 , 174 , 164 , 155 , 146 , 138 , 130 , 123 , 116 , 109,
					 103 , 97  , 92  , 87  , 82  , 77  , 73  , 69  , 65  , 61  , 58  , 54 ],
					[1640, 1548, 1460, 1378, 1302, 1228, 1160, 1094, 1032, 974 , 920 , 868,
					 820 , 774 , 730 , 689 , 651 , 614 , 580 , 547 , 516 , 487 , 460 , 434,
					 410 , 387 , 365 , 345 , 325 , 307 , 290 , 274 , 258 , 244 , 230 , 217,
					 205 , 193 , 183 , 172 , 163 , 154 , 145 , 137 , 129 , 122 , 115 , 109,
					 102 , 96  , 91  , 86  , 81  , 77  , 72  , 68  , 64  , 61  , 57  , 54 ],
					[1628, 1536, 1450, 1368, 1292, 1220, 1150, 1086, 1026, 968 , 914 , 862,
					 814 , 768 , 725 , 684 , 646 , 610 , 575 , 543 , 513 , 484 , 457 , 431,
					 407 , 384 , 363 , 342 , 323 , 305 , 288 , 272 , 256 , 242 , 228 , 216,
					 204 , 192 , 181 , 171 , 161 , 152 , 144 , 136 , 128 , 121 , 114 , 108,
					 102 , 96  , 90  , 85  , 80  , 76  , 72  , 68  , 64  , 60  , 57  , 54 ],
					[1814, 1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960,
					 907 , 856 , 808 , 762 , 720 , 678 , 640 , 604 , 570 , 538 , 508 , 480,
					 453 , 428 , 404 , 381 , 360 , 339 , 320 , 302 , 285 , 269 , 254 , 240,
					 226 , 214 , 202 , 190 , 180 , 170 , 160 , 151 , 143 , 135 , 127 , 120,
					 113 , 107 , 101 , 95  , 90  , 85  , 80  , 75  , 71  , 67  , 63  , 60 ],
					[1800, 1700, 1604, 1514, 1430, 1350, 1272, 1202, 1134, 1070, 1010, 954,
					 900 , 850 , 802 , 757 , 715 , 675 , 636 , 601 , 567 , 535 , 505 , 477,
					 450 , 425 , 401 , 379 , 357 , 337 , 318 , 300 , 284 , 268 , 253 , 238,
					 225 , 212 , 200 , 189 , 179 , 169 , 159 , 150 , 142 , 134 , 126 , 119,
					 112 , 106 , 100 , 94  , 89  , 84  , 79  , 75  , 71  , 67  , 63  , 59 ],
					[1788, 1688, 1592, 1504, 1418, 1340, 1264, 1194, 1126, 1064, 1004, 948,
					 894 , 844 , 796 , 752 , 709 , 670 , 632 , 597 , 563 , 532 , 502 , 474,
					 447 , 422 , 398 , 376 , 355 , 335 , 316 , 298 , 282 , 266 , 251 , 237,
					 223 , 211 , 199 , 188 , 177 , 167 , 158 , 149 , 141 , 133 , 125 , 118,
					 111 , 105 , 99  , 94  , 88  , 83  , 79  , 74  , 70  , 66  , 62  , 59 ],
					[1774, 1676, 1582, 1492, 1408, 1330, 1256, 1184, 1118, 1056, 996 , 940,
					 887 , 838 , 791 , 746 , 704 , 665 , 628 , 592 , 559 , 528 , 498 , 470,
					 444 , 419 , 395 , 373 , 352 , 332 , 314 , 296 , 280 , 264 , 249 , 235,
					 222 , 209 , 198 , 187 , 176 , 166 , 157 , 148 , 140 , 132 , 125 , 118,
					 111 , 104 , 99  , 93  , 88  , 83  , 78  , 74  , 70  , 66  , 62  , 59 ],
					[1762, 1664, 1570, 1482, 1398, 1320, 1246, 1176, 1110, 1048, 988 , 934,
					 881 , 832 , 785 , 741 , 699 , 660 , 623 , 588 , 555 , 524 , 494 , 467,
					 441 , 416 , 392 , 370 , 350 , 330 , 312 , 294 , 278 , 262 , 247 , 233,
					 220 , 208 , 196 , 185 , 175 , 165 , 156 , 147 , 139 , 131 , 123 , 117,
					 110 , 104 , 98  , 92  , 87  , 82  , 78  , 73  , 69  , 65  , 61  , 58 ],
					[1750, 1652, 1558, 1472, 1388, 1310, 1238, 1168, 1102, 1040, 982 , 926,
					 875 , 826 , 779 , 736 , 694 , 655 , 619 , 584 , 551 , 520 , 491 , 463,
					 437 , 413 , 390 , 368 , 347 , 328 , 309 , 292 , 276 , 260 , 245 , 232,
					 219 , 206 , 195 , 184 , 174 , 164 , 155 , 146 , 138 , 130 , 123 , 116,
					 109 , 103 , 97  , 92  , 87  , 82  , 77  , 73  , 69  , 65  , 61  , 58 ],
					[1736, 1640, 1548, 1460, 1378, 1302, 1228, 1160, 1094, 1032, 974 , 920,
					 868 , 820 , 774 , 730 , 689 , 651 , 614 , 580 , 547 , 516 , 487 , 460,
					 434 , 410 , 387 , 365 , 345 , 325 , 307 , 290 , 274 , 258 , 244 , 230,
					 217 , 205 , 193 , 183 , 172 , 163 , 154 , 145 , 137 , 129 , 122 , 115,
					 108 , 102 , 96  , 91  , 86  , 81  , 77  , 72  , 68  , 64  , 61  , 57 ],
					[1724, 1628, 1536, 1450, 1368, 1292, 1220, 1150, 1086, 1026, 968 , 914,
					 862 , 814 , 768 , 725 , 684 , 646 , 610 , 575 , 543 , 513 , 484 , 457,
					 431 , 407 , 384 , 363 , 342 , 323 , 305 , 288 , 272 , 256 , 242 , 228,
					 216 , 203 , 192 , 181 , 171 , 161 , 152 , 144 , 136 , 128 , 121 , 114,
					 108 , 101 , 96  , 90  , 85  , 80  , 76  , 72  , 68  , 64  , 60  , 57 ]];

	this.vibratoSine = [  0,  24,  49,  74,  97, 120, 141, 161,
	 					180, 197, 212, 224, 235, 244, 250, 253,
	 					255, 253, 250, 244, 235, 224, 212, 197,
	 					180, 161, 141, 120,  97,  74,  49,  24];

    this.audioCtx = new webkitAudioContext ();
    
    
    for (var i = 0; i < this.mod.channels; i ++) {
		this.channelMute[i]   = false;
	    this.channelPeriod[i] = 0;
		this.channelSample[i] = undefined;
		this.samplePos[i]     = 0;
		this.sampleStep[i]    = 0;
		this.sampleRepeat[i]  = 0;
		this.sampleVolume[i]  = 0;
        this.volumeSlide[i]   = 0;
		this.effect[i]        = -1;
		this.effectParam[i]   = [];
		this.porta[i]         = [];
		this.vibrato[i]       = [];
		this.noteDelay[i]     = 0;
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
		for (var c = 0; c < this.mod.channels; c ++) {
        	if (this.pattern.sample[c][this.division] != 0) {
				if (this.channelSample[c] != this.mod.samples[this.pattern.sample[c][this.division] - 1]) {
	            	this.channelSample[c] = this.mod.samples[this.pattern.sample[c][this.division] - 1];   	// Set current sample
                    this.sampleRepeat[c]  = this.channelSample[c].dataLength;								// Repeat length of this sample
                    this.samplePos[c]     = 0;                                          					// Restart sample
				}
			    this.sampleVolume[c]  = this.channelSample[c].volume;                                   	// Set default sample volume
			}

		    if (this.pattern.period[c][this.division] != 0 && this.pattern.effect[c][this.division] != this.EFFECT_PORTA_TO_NOTE && this.pattern.effect[c][this.division] != this.EFFECT_PROTA_VOL) {
		        this.channelPeriod[c] = this.pattern.period[c][this.division];

				if (this.channelSample[c]) {
				    var rate = this.sampleRatio * this.findPeriod (this.channelPeriod[c], this.channelSample[c].fineTune);
				    
					this.samplePos[c]     = 0;                                          // Restart sample
                    this.noteDelay[c]     = 0;                                          // Reset note delay
			    	this.sampleRepeat[c]  = this.channelSample[c].dataLength;			// Repeat length of this sample
					this.sampleStep[c]    = 1 / (rate);									// Samples per division
                    this.effect[c]        = -1;                        					// Reset the current effect
				}
			}
		}

		// Generate all samples for this division...
		var divSamples = [];
		var bIndex = 0;

		for (var t = 0; t < this.ticksPerDiv; t ++) {
		    for (var c = 0; c < this.mod.channels; c ++) {
                if (t == 0) {
                    // On t0 reset the current effect and search for new a one.
                	this.effect[c] = -1;
                    this.handleEffect (c, this.pattern.effect[c][this.division], this.pattern.effectX[c][this.division], this.pattern.effectY[c][this.division]);
				 } else {
					switch (this.effect[c]) {
						case this.EFFECT_ARPEGGIO:
							var rate     = 0;

							if (t % 3 == 0) {
	       						rate = this.sampleRatio * this.findPeriod (this.channelPeriod[c], this.channelSample[c].fineTune);
							} else if (t % 3 == 1) {
								var arp = 0;
								for (var i = 0; i < this.periods[0].length; i ++) {
									if (this.periods[0][i] == this.channelPeriod[c]) {
										arp = this.periods[0][i + this.effectParam[c][0]] - this.channelPeriod[c];
										break;
									}
								}

	                        	rate = this.sampleRatio * this.findPeriod (this.channelPeriod[c] + arp, this.channelSample[c].fineTune);
							} else if (t % 3 == 2) {
              					var arp = 0;
								for (var i = 0; i < this.periods[0].length; i ++) {
									if (this.periods[0][i] == this.channelPeriod[c]) {
										arp = this.periods[0][i + this.effectParam[c][1]] - this.channelPeriod[c];
										break;
									}
								}

	                        	rate = this.sampleRatio * this.findPeriod (this.channelPeriod[c] + arp, this.channelSample[c].fineTune);
							}

							this.sampleStep[c]    = 1 / rate;											// Set new sample step

							break;
						case this.EFFECT_PORTA_UP:
	      					this.channelPeriod[c] = Math.max (this.channelPeriod[c] - this.porta[c][0], 57);
							rate = this.sampleRatio * this.findPeriod (this.channelPeriod[c], this.channelSample[c].fineTune);
	                        this.sampleStep[c] = 1 / rate;											// Set new sample step

							break;
	                    case this.EFFECT_PORTA_DOWN:
	      					this.channelPeriod[c] = Math.min (1712, this.channelPeriod[c] + this.porta[c][0]);
							rate = this.sampleRatio * this.findPeriod (this.channelPeriod[c], this.channelSample[c].fineTune);
	                        this.sampleStep[c] = 1 / rate;											// Set new sample step

							break;
						case this.EFFECT_PORTA_TO_NOTE:
							if (this.channelPeriod[c] < this.porta[c][1]) {
	                            this.channelPeriod[c] += this.porta[c][0];
								if (this.channelPeriod[c] >= this.porta[c][1]) {
	                                this.channelPeriod[c] = this.porta[c][1];
									this.effect[c] = -1;
								}
							} else {
	                        	this.channelPeriod[c] -= this.porta[c][0];
	                            if (this.channelPeriod[c] <= this.porta[c][1]) {
	                                this.channelPeriod[c] = this.porta[c][1];
									this.effect[c] = -1;
								}
							}

	                        rate = this.sampleRatio * this.findPeriod (this.channelPeriod[c], this.channelSample[c].fineTune);
	                        this.sampleStep[c] = 1 / rate;											// Set new sample step

							break;
						case this.EFFECT_VIBRATO:
							if (this.channelSample[c]) {
								var vStep  = this.vibrato[c][0];
								var vDepth = this.vibrato[c][1];
		                        var vPos   = this.vibrato[c][2];

								var vibrato        = ((vPos % 64) < 32 ? this.vibratoSine[vPos % 32] : -this.vibratoSine[vPos % 32]) * vDepth / 128;
								this.vibrato[c][2] = vPos + vStep;

	                            var rate = this.sampleRatio * this.findPeriod (this.channelPeriod[c] + vibrato, this.channelSample[c].fineTune);
								this.sampleStep[c] = 1 / rate;
							}

							break
						case this.EFFECT_PROTA_VOL:
							if (this.channelPeriod[c] < this.porta[c][1]) {
	                            this.channelPeriod[c] += this.porta[c][0];
								if (this.channelPeriod[c] >= this.porta[c][1]) {
	                                this.channelPeriod[c] = this.porta[c][1];
									this.effect[c] = -1;
								}
							} else {
	                        	this.channelPeriod[c] -= this.porta[c][0];
	                            if (this.channelPeriod[c] <= this.porta[c][1]) {
	                                this.channelPeriod[c] = this.porta[c][1];
									this.effect[c] = -1;
								}
							}

							if (this.channelSample[c]) {
	                        	rate = this.sampleRatio * this.findPeriod (this.channelPeriod[c], this.channelSample[c].fineTune);
	                        	this.sampleStep[c] = 1 / rate;											// Set new sample step
							}

							this.sampleVolume[c] += this.volumeSlide[c];
			    			this.sampleVolume[c] = Math.max (0.0, Math.min (this.sampleVolume[c], 1.0));

							break;
						case this.EFFECT_VIBRATO_VOL:
	                        var vStep  = this.vibrato[c][0];
							var vDepth = this.vibrato[c][1];
	                        var vPos   = this.vibrato[c][2];

	      					var vibrato        = ((vPos % 64) < 32 ? this.vibratoSine[vPos % 32] : -this.vibratoSine[vPos % 32]) * vDepth / 128;
							this.vibrato[c][2] = vPos + vStep;

	      					var rate = this.sampleRatio * this.findPeriod (this.channelPeriod[c] + vibrato, this.channelSample[c].fineTune);
							this.sampleStep[c] = 1 / rate;

	                        this.sampleVolume[c] += this.volumeSlide[c];
			    			this.sampleVolume[c] = Math.max (0.0, Math.min (this.sampleVolume[c], 1.0));

							break;
						case this.EFFECT_VOLUME_SLIDE:
	                    	this.sampleVolume[c] += this.volumeSlide[c];
			    			this.sampleVolume[c] = Math.max (0.0, Math.min (this.sampleVolume[c], 1.0));

							break;
					}
				}

				bIndex = this.samplesPerTick * t;
				for (var s = 0; s < this.samplesPerTick; s ++) {
					if (c == 0) divSamples[bIndex] = 0.0;

			        if (this.channelSample[c] && this.noteDelay[c] == 0 && !this.channelMute[c]) {
			            var sample = this.channelSample[c].sample[Math.floor (this.samplePos[c])] * this.sampleVolume[c];
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
								this.sampleVolume[c] = 0.0;
							}
						}
					}

                    bIndex ++;
				}

                if (this.noteDelay[c] > 0) {
                	this.noteDelay[c] --;
				}
			}

			// Handle pattern break if there is one.
			if (this.breakPattern != -1) {
				this.division = this.breakPattern - 1;
				if (!this.repeatOrder) {
					this.order ++;
				}
				if (this.order == mod.orderCount) {
					this.playing = false;
				} else {
                	this.pattern = mod.patterns[mod.orderTable[this.order]];
					this.breakPattern = -1;
				}
			}

			if (this.orderJump != -1 && !this.repeatOrder) {
				this.division = -1;
				this.order = Math.min (mod.orderCount - 1, this.orderJump);
                this.pattern = mod.patterns[mod.orderTable[this.order]];
				this.orderJump = -1;
			}
		}

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


	this.findPeriod = function (basePeriod, fineTune) {
		if (fineTune == 0) return basePeriod;

		for (var i = 0; i < this.periods[0].length; i ++) {
			if (this.periods[0][i] == basePeriod) {
				return this.periods[fineTune][i];
			}
		}

		return basePeriod;
	};


	this.handleEffect = function (channel, effect, effectX, effectY) {
		switch (effect) {
			case this.EFFECT_ARPEGGIO:
                if (effectX != 0 || effectY != 0) {
                	this.effect[channel]         = this.EFFECT_ARPEGGIO;
     				this.effectParam[channel][0] = effectX;
     				this.effectParam[channel][1] = effectY;

                    // Some MODs seem to assume that vibrato parameters are global. So if a channel has no parameters
					// set then copy them just to be sure.
					for (var i = 0; i < this.effectParam.length; i ++) {
						if (!this.effectParam[i][0]) {
                            this.effectParam[i][0] = effectX;
                			this.effectParam[i][1] = effectY;
						}
					}
				}

				break;
			case this.EFFECT_PORTA_UP:
				this.effect[channel]   = this.EFFECT_PORTA_UP;
				this.porta[channel][0] = effectX * 16 + effectY;

				break;
            case this.EFFECT_PORTA_DOWN:
				this.effect[channel]    = this.EFFECT_PORTA_DOWN;
				this.porta[channel][0]  = effectX * 16 + effectY;

				break;
			case this.EFFECT_PORTA_TO_NOTE:
                this.effect[channel] = this.EFFECT_PORTA_TO_NOTE;
				
				if (effectX != 0 || effectY != 0) {
					this.porta[channel][0] = effectX * 16 + effectY;
				}
				
				if (this.pattern.period[channel][this.division] != 0) {
					this.porta[channel][1] = this.pattern.period[channel][this.division];
				}

				break;
			case this.EFFECT_VIBRATO:
                this.effect[channel] = this.EFFECT_VIBRATO;
				if (effectX != 0 && effectY != 0) {
                	this.vibrato[channel][0] = effectX;
                	this.vibrato[channel][1] = effectY;
                	this.vibrato[channel][2] = 0;

					// Some MODs seem to assume that vibrato parameters are global. So if a channel has no parameters
					// set then copy them just to be sure.
					for (var i = 0; i < this.vibrato.length; i ++) {
						if (!this.vibrato[i][0]) {
                            this.vibrato[i][0] = effectX;
                			this.vibrato[i][1] = effectY;
                			this.vibrato[i][2] = 0;
						}
					}
				}

				break;
			case this.EFFECT_PROTA_VOL:
				this.effect[channel] = this.EFFECT_PROTA_VOL;
				this.volumeSlide[channel] = ((effectX != 0) ? effectX : -effectY) / 64.0;

                if (this.pattern.period[channel][this.division] != 0) {
					this.porta[channel][1] = this.pattern.period[channel][this.division];
				}
			
				break;
			case this.EFFECT_VIBRATO_VOL:
				this.effect[channel] = this.EFFECT_VIBRATO_VOL;
				this.volumeSlide[channel] = ((effectX != 0) ? effectX : -effectY) / 64.0;

				break;
			case this.EFFECT_TREMOLO:
				console.log ("Tremolo");

				break;
			case this.EFFECT_SAMPLE_OFFSET:
                this.samplePos[channel]     = (effectX * 16 + effectY) * 256;
				this.sampleRepeat[channel] -= (effectX * 16 + effectY) * 256;

				break;
			case this.EFFECT_VOLUME_SLIDE:
				this.effect[channel]      = this.EFFECT_VOLUME_SLIDE;
                this.volumeSlide[channel] = ((effectX != 0) ? effectX : -effectY) / 64.0;

				break;
			case this.EFFECT_JUMP_TO:
    			this.orderJump = effectX * 16 + effectY;

				break;
			case this.EFFECT_SET_VOLUME:
                this.sampleVolume[channel] = (effectX * 16 + effectY) / 64.0;

				break;
			case this.EFFECT_PATTERN_BREAK:
            	this.breakPattern = effectX * 10 + effectY;

				break;
			case this.EFFECT_EXTENDED:
				switch (effectX) {
					case this.FINE_PORTA_UP:
						console.log ("Fine porta up");
						break;
					case this.FINE_PORTA_DOWN:
						console.log ("Fine porta down");
						break;
					case this.EFFECT_SET_FINE_TUNE:
                        this.channelSample[channel].fineTune = (effectX > 7) ? effectX - 16 : effectX;
						console.log ("Set finetune!");

						break;
					case this.EFFECT_FINE_VOLUME_UP:
						this.sampleVolume[channel] = Math.min (this.sampleVolume[channel] + effectY / 64.0, 1.0);

						break;
					case this.EFFECT_FINE_VOLUME_DOWN:
                        this.sampleVolume[channel] = Math.max (0.0, this.sampleVolume[channel] - effectY / 64.0);

						break;
					case this.EFFECT_NOTE_DELAY:
						this.noteDelay[channel] = effectY;

						break;
				}

				break;
			case this.EFFECT_SET_SPEED:
	            var speed = effectX * 16 + effectY;

				if (speed <= 32) {
					this.setSpeed (this.bpm, speed);
				} else {
				    this.setSpeed (speed, this.ticksPerDiv);
				}

				break;
		}
	};


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
			patData:  this.pattern,
			instruments: [
				((this.channelSample[0]) ? this.channelSample[0].name : "---"),
                ((this.channelSample[1]) ? this.channelSample[1].name : "---"),
                ((this.channelSample[2]) ? this.channelSample[2].name : "---"),
                ((this.channelSample[3]) ? this.channelSample[3].name : "---"),
                ((this.channelSample[4]) ? this.channelSample[4].name : "---"),
                ((this.channelSample[5]) ? this.channelSample[5].name : "---"),
                ((this.channelSample[6]) ? this.channelSample[6].name : "---"),
                ((this.channelSample[7]) ? this.channelSample[7].name : "---"),
			]
		}
	};

	this.setSpeed (125, 6);

}