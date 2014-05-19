/**
 * Envelope.js
 *
 * Defines an envelope that is used for volume and panning fluctuations during instrument playback. For mod types that
 * do not use envelopes an empty default envelope is used.
 *
 * Author:  		Maarten Janssen
 * Date:    		2014-05-13
 * Last updated:	2014-05-14
 */
function Envelope () {
	this.type        = EnvelopeType.NONE;		// Set default envelope type.
	this.points      = [];						// List of envelope points.
	var lastPosition = -1;						// Position of last insertion.
	var lastValue    = 0;						// Last value inserted into the point list.
	
	this.sustainPoint = 0;						// Index of the sustain point in the points array.
	this.loopBegin    = 0;						// Index of loop begin position.
	this.loopEnd      = 0;						// Index of loop end position.
	
	
	/**
	 * Add a point to the envelope and calculate all points in between.
	 *
	 * position         - The absolute position within the envelope.
	 * value            - The value of the envelope at the given position.
	 * markSustainPoint - Mark the newly inserted point as sustain point.
	 * markLoopBegin    - Mark the newly inserted point as envelope loop begin.
	 * markLoopEnd      - Mark the newly inserted point as envelope loop end.
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
	
	
	/**
	 * Retrieve the envelope value at the given position. If the position is out of range clamp the position to the 
	 * range of the envelope.
	 *
	 * position     - The absolute position where want want to know the value of.
	 * release      - If note released do not clamp the envelope up until the sustain point.
	 * defaultValue - Default envelope value used when envelope is off (i.e. type == 0).
	 */
	this.getValue = function (position, release, defaultValue) {
		// Clamp sustain point.
		if ((this.type & EnvelopeType.SUSTAIN) != 0) {
			if (!release) {
				return this.points[Math.min (position, this.sustainPoint)];
			} else {
				return this.points[Math.min (position, this.points.length - 1)];
			}
			
		// Loop envelope.
		} else if ((this.type & EnvelopeType.LOOP) != 0) {
			var loopPos;
			if (position >= this.loopBegin) {
				loopPos = this.loopBegin + ((position - this.loopBegin) % (this.loopEnd - this.loopBegin));
			} else {
				loopPos = position;
			}
			
			return this.points[Math.min (loopPos, this.points.length - 1)];
			
		// Normal envelope point retrieval.
		} else if ((this.type & EnvelopeType.ON) != 0) {
			return this.points[Math.min (position, this.points.length - 1)];
			
		// No envelope type, default value or 0 if note released.
		} else {
			return release ? 0.0 : defaultValue;
		}
	}
}