/**
 * tileImages - An array of image URLs.
 * frameDelay - The delay in ms between two frames in the animation.
 */
function Tile (tileName, tileImages, frameDelay) {
    this.PASS_TOP      = 0;
    this.PASS_BOTTOM   = 1;
    this.PASS_LEFT     = 2;
    this.PASS_RIGHT    = 3;
    this.HURTS_PLAYER  = 4;
    this.INSTANT_DEATH = 5;
    this.IS_PICKUP     = 6;
    this.IS_SWITCH     = 7;
    this.IS_TRIGGER    = 8;

	this.tileName    = tileName;
    this.frameImages = tileImages;
    this.frameDelay  = Math.max (1, frameDelay);
    this.prevFrameNr = -1;
    this.frameNr     = -1;

    this.boolParams = [true, true, true, true, false, false, false, false, false];
    this.paramValue = [];



	/**
	 * Set the static image of this tile.
	 */
	this.setTile = function (tileImage) {
	    this.frameImages = [tileImage];
	    this.frameDelay  = 1;
	};


	/**
	 * Add an image as a new frame to the animation of this tile.
	 */
	this.addFrame = function (tileImage) {
	    this.frameImages[this.frameImages.length] = tileImage;
	};


	/**
	 * Set the delay between frames in the animation in ms. Minimum delay is 1 ms.
	 */
	this.setFrameDelay = function (delay) {
	    if (delay < 1) delay = 1;

		this.frameDelay = delay;
	};


	/**
	 * Update the animation of this tile and render it as soon as its frame index changes to all IMG elements that use
	 * this Tile.
	 */
	this.render = function () {
        var frameIndex   = Math.floor (mainTimer / this.frameDelay);
        this.prevFrameNr = this.frameNr;
        this.frameNr     = frameIndex % this.frameImages.length;
        
        // Only render the tile when the image changes.
        if (this.frameImages.length > 0 && this.prevFrameNr != this.frameNr) {
			$("img[alt=" + tileName + "]").attr ("src", this.frameImages[this.frameNr]);
  		}
	};
	
	
	/**
	 * Set the value of a boolean parameter for this tile.
	 */
	this.setBoolParam = function (param, value) {
	    this.boolParams[param] = value;
	};
	
	
	/**
	 * Exchange all boolean parameters with a new set from the given array.
	 */
	this.setBoolParamArray = function (boolParams) {
	    this.boolParams = boolParams;
	};
	
	
	/**
	 * Does this tile have the given boolean parameter set?
	 */
	this.hasBoolParam = function (param) {
	    return this.boolParams[param];
	};
	
	
	/**
	 * Get the parameter value array of this tile.
	 */
	this.getParamValue = function () {
		return this.paramValue;
	};
	
	
	/**
	 * Set the parameter value array of this tile.
	 */
	this.setParamValue = function (value) {
		this.paramValue = value;
	};
}