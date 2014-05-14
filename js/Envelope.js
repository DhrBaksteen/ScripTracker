/**
 * @constructor
 */
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
			return decay ? 0.0 : defaultValue;
		}
	}
}