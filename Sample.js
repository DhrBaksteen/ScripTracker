/**
 * Sample.js
 *
 * Sample defines a generic ScripTracker sample regardless of the module type. The various loaders should take care of
 * filling a sample with correct data so that it is usable by ScripTracker.
 *
 * Author:  Maarten Janssen
 * Version: 1.0.0
 * Date:    14-02-2013
 */
function Sample () {
	this.LOOP_NONE     = 0;             // Sample looping is disabled
	this.LOOP_FORWARD  = 1;             // When sample reaches its end loop from loopStart to loopStart + loopLength
	this.LOOP_PINGPONG = 2;             // When sample reaches its end loop from loopStart to loopStart + loopLength back and forth
	
	this.TYPE_8BIT  = 0;
	this.TYPE_16BIT = 1;
	this.TYPE_UNCOMPRESSED = 0;
	this.TYPE_DELTA = 2;
	this.TYPE_ADPCM = 4;

	this.sampleIndex = 0;               // Index of this sample used by the module
	this.name        = "";				// Name of this sample

	this.sampleLength = 0;              // Length of this sample
	this.loopStart    = 0;              // Start position for sample looping if enabled
	this.loopLength   = 0;              // Length of sample loop mesaured from start if enabled
	this.loopType     = this.LOOP_NONE; // How the sample should looped when played to the end
	this.dataType     = this.TYPE_8BIT | this.TYPE_UNCOMPRESSED;

	this.volume   = 1.0;                // Default volume of this sample
	this.panning  = 0.5;				// Default volume multiplication factor for channels
	
	this.volEnvelope = new Envelope ();	// Empty default envelope for volume.
	this.panEnvelope = new Envelope ();	// Empty default envelope for panning.

	this.basePeriod = 0;                // Base period of this sample
	this.fineTune   = 0;                // Finetune of this sample

    this.sample = [];                   // Sample data stored a an array of floats [-1.0, 1.0]


	/**
	 * Load normal uncompressed sample data.
	 */
	this.loadSample = function (sampleData, is16Bit, signed) {
		this.sample = [];

		var val = 0.0;
		for (var i = 0; i < this.sampleLength; i ++) {
			if (!is16Bit) {
            	var val8 = sampleData.charCodeAt (i);

				if (signed) {
					val = (val8 < 128) ? val8 / 127 : -((val8 ^ 0xFF) + 1) / 128;
				} else {
					val = (val8 / 128.0) - 1.0;
				}
			} else {
                var val16 = sampleData.charCodeAt (i * 2) + sampleData.charCodeAt (i * 2 + 1) * 256;

				if (signed) {
                	val = (val16 < 32768) ? val16 / 32767 : -((val16 ^ 0xFFFF) + 1) / 32768;
				} else {
					val = (val16 / 32768.0) - 1.0;
				}
			}

			this.sample.push (val);
		}
	};


	/**
	 * Load a stereo sample and convert it to mono.
	 */
	this.loadStereoSample = function (sampleData, is16Bit, signed) {
		this.loadSample (sampledata.substring (0, this.sampleLength * (is16Bit) ? 2 : 1), is16Bit, signed);
		var sampleL = this.sample;
        this.loadSample (sampledata.substring (this.sampleLength * (is16Bit) ? 2 : 1), is16Bit, signed);
		var sampleR = this.sample;

		this.sample = [];
		for (var i = 0; i < this.sampleLength; i ++) {
			this.sample.push ((sampleL[i] + sampleR[i]) / 2.0);
		}
	};


    /**
	 * Load sample data from delta values.
	 */
	this.loadDeltaSample = function (sampleData, is16Bit) {
		var val = 0.0;

		for (var i = 0; i < this.sampleLength; i ++) {
			if (!is16Bit) {
			
				var val8 = sampleData.charCodeAt (i);
				if (val8 > 127) val8 = -(256 - val8);
				val += val8 / 128;
			} else {
				var val16 = sampleData.charCodeAt (i) + (sampleData.charCodeAt (i + 1) << 8);
				if (val16 > 32767) val16 = -(65536 - val16)
                val += val16 / 32768;
			}
				
			if (val < -1) val =  1 + (val + 1);
			if (val > 1)  val = -1 + (val - 1);
			this.sample.push (val);
		}
	};


	/**
	 * Decode an ADPCM sample to regular uncompressed sample data.
	 */
	this.loadAdpcmSample = function (sampleData, is16Bit) {
		console.log ("adpcm sample");
		var compression = [];
		this.sample = [];

		// Fill the compression table.
		for (var i = 0; i < 16; i ++) {
			if (!is16Bit) {
				var val8 = sampleData.charCodeAt (i);
				compression[i] = (val8 < 128) ? val8 / 127 : -((val8 ^ 0xFF) + 1) / 128;
			} else {
				var val16 = sampleData.charCodeAt (i * 2) + sampleData.charCodeAt (i * 2 + 1) * 256;
                compression[i] = (val16 < 32768) ? val16 / 32767 : -((val16 ^ 0xFFFF) + 1) / 32768;
			}
		}

		// Decode samples.
		var val = 0.0;
		for (var i = 0; i < Math.floor (this.sampleLength / 2); i ++) {
			val += compression[sampleData.charCodeAt (i + (is16Bit) ? 32 : 16) & 0x0F];
			this.sample.push (val);
			val += compression[sampleData.charCodeAt (i + (is16Bit) ? 32 : 16) >> 4];
			this.sample.push (val);
		}
	};
}


function Envelope () {
	this.ON      = 1;
	this.SUSTAIN = 2;
	this.LOOP    = 4;
	this.type = 0;

	this.points = [];
	var lastPosition = -1;
	var lastValue    = 0;
	
	this.sustainPoint = 0;
	this.loopBegin    = 0;
	this.loopEnd      = 0;
	
	/**
	 * Add a point to the envelope and calculate all points in between.
	 */
	this.addPoint = function (position, value, markSustainPoint, markLoopBegin, markLoopEnd) {
		var deltaPos = position - lastPosition;
		var deltaVal = (value - lastValue) / deltaPos;
		
		for (var i = 0; i < deltaPos; i ++) {
			lastPosition ++;
			lastValue    += deltaVal;
			
			this.points.push (lastValue);
		}
		
		if (markSustainPoint) this.sustainPoint = lastPosition;
		if (markLoopBegin)    this.loopBegin    = lastPosition;
		if (markLoopEnd)      this.loopEnd      = lastPosition;
	}
	
	
	this.getValue = function (position, decay, defaultValue) {
		if ((this.type & this.SUSTAIN) != 0) {
			if (!decay) {
				return this.points[Math.min (position, this.sustainPoint)];
			} else {
				return this.points[Math.min (position, this.points.length - 1)];
			}
		} else if ((this.type & this.LOOP) != 0) {
			var loopPos;
			if (position >= this.loopBegin) {
				loopPos = this.loopBegin + ((position - this.loopBegin) % (this.loopEnd - this.loopBegin));
			} else {
				loopPos = position;
			}
			
			return this.points[Math.min (loopPos, this.points.length - 1)];
		} else if ((this.type & this.ON) != 0) {
			return this.points[Math.min (position, this.points.length - 1)];
		} else {
			return defaultValue;
		}
	}
}