/**
 * name         - A unique name for this Sprite.
 * parent       - The element to add this sprite to.
 * size         - Size of this Sprite (horizontal and vertical).
 * spriteImages - An array of URL to images to use for this Sprite's animation.
 * frameDelay   - The delay in ms between frames.
 */
function Sprite (name, parent, size, spriteImages, frameDelay) {
	this.spriteObject = null;
	this.name = name;
	this.x = 0;
	this.y = 0;
	this.layer = 1;
	this.size = size;
	this.AABB = [this.x, this.y, this.x + this.size - 1, this.y + this.size - 1];
	
	this.spriteImages = spriteImages;
 	this.frameDelay   = Math.max (1, frameDelay);
	this.prevFrameNr  = -1;
	this.frameNr      = -1;

	this.collisions = [];
	this.updateFunction = null;
	
	
	// Make sure the sprite does not yet exist.
	if ($("img#s_" + name).length != 0) {
	    throw "Duplicate sprite s_" + name;
	} else {
		this.spriteObject = $("<img />");
		
		this.spriteObject.attr ("id", "s_" + name);
		this.spriteObject.attr ("src", spriteImages[0]);
		
		this.spriteObject.css ("position", "absolute");
		this.spriteObject.css ("width",    size + "px");
		this.spriteObject.css ("height",   size + "px");
		this.spriteObject.css ("z-index",  this.layer);
		
		parent.append (this.spriteObject);
 	}
	
	
	/**
	 * Update this Sprite using its given update function.
	 */
	this.update = function (dTime) {
	    if (this.updateFunction != null) {
	        this.updateFunction (this, dTime);
		}
	}
	
	
	/**
	 * Render this Sprite and update its AABB when the image changes.
	 */
	this.render = function () {
	    var frameIndex   = Math.floor (mainTimer / this.frameDelay);
        this.prevFrameNr = this.frameNr;
        this.frameNr     = frameIndex % this.spriteImages.length;

        // Only render the sprite when the image changes.
        if (this.spriteImages.length > 0 && this.prevFrameNr != this.frameNr) {
   			this.spriteObject.attr ("src", this.spriteImages[this.frameNr]);
  		}
	};
	
	
	/**
	 * Check whether the AABB of this Sprite intersects the AABB of another Sprite.
	 *
	 * Sprite2 - The Sprite to test for collisions with.
	 */
	this.collidesWith = function (sprite2) {
	    var otherAABB = sprite2.getAABB ();

	    return !(this.AABB[1] > otherAABB[3] ||
			this.AABB[3] < otherAABB[1] ||
	    	this.AABB[0] > otherAABB[2] ||
			this.AABB[2] < otherAABB[0]);
	};
	
	
	/**
	 * Set the position of this sprite and update its AABB.
	 *
	 * X            - new X coordinate of sprite.
	 * Y            - New Y coordinate of sprite.
	 * relativeAABB - Calculate relative AABB (covers area from previous to new position for movement of sprite).
	 *                Optional, default TRUE.
	 */
	this.setPosition = function (x, y, relativeAABB) {
     	relativeAABB = typeof relativeAABB !== 'undefined' ? relativeAABB : true;
	    var oldX = this.x;
	    var oldY = this.y;
	
	    // Move sprite to new position.
	    this.x = x;
	    this.y = y;
		this.spriteObject.css ("left", x + "px");
		this.spriteObject.css ("top",  y + "px");
		
		if (relativeAABB) {
		    // Calculate relative AABB taking old position into account.
	  		this.AABB = [Math.min (this.x, oldX),
				Math.min (this.y, oldY),
				Math.max (this.x, oldX) + this.size - 1,
				Math.max (this.y, oldY) + this.size - 1];
   		} else {
   		    // Calculate absolute AABB using new position only.
   		    this.AABB = [this.x,
				this.y,
				this.x + this.size - 1,
				this.y + this.size - 1];
		}
	};
	
	
	/**
	 * Move this Sprite by a given amount of pixels.
	 *
	 * deltaX - Number of pixels to move in X direction.
	 * deltaY - Number of pixels to move in Y direction.
	 */
	this.move = function (deltaX, deltaY) {
		this.setPosition (this.x + deltaX, this.y + deltaY, true);
	};
	

	/**
	 * Set the appearance of this Sprite to a static image. The sprite image will be updated on the next repaint fo the
	 * sprite.
	 *
	 * spriteImage - The URL of the image to use for the Sprite.
	 */
	this.setImage = function (spriteImage) {
	    this.spriteImages = [spriteImage];
	    this.frameDelay   = 1;
	    this.prevFrameNr  = -1;
		this.frameNr      = -1;
	};
	
	
	/**
	 * Set the appearance of this Sprite to an animation using an array of image URLs and a delay in ms between frames.
	 * The sprite will be updated with on the next repaint.
	 *
	 * spriteImages - An array of URL to images to use for this Sprite's animation.
	 * frameDelay   - The delay in ms between frames.
	 */
	this.setAnimation = function (spriteImages, frameDelay) {
	    this.spriteImages = spriteImages;
	    this.frameDelay   = frameDelay;
	    this.prevFrameNr  = -1;
		this.frameNr      = -1;
	};
	
	
	/**
	 * Set the delay between frames in the animation in ms. Minimum delay is 1 ms.
	 */
	this.setFrameDelay = function (delay) {
	    if (delay < 1) delay = 1;

		this.frameDelay = delay;
	};
	

	/**
	 * make this Sprite appear.
	 */
	this.show = function () {
	    this.spriteObject.show ();
	};
	
	
	/**
	 * Make this sprite disappear.
	 */
	this.hide = function () {
	    this.spriteObject.hide ();
	};
	
	
	/**
	 * Is this sprite visible?
	 */
	this.isVisible = function () {
	    return this.spriteObject.is (":visible");
	};


	/**
	 * Get the AABB of this Sprite.
	 */
	this.getAABB = function () {
	    return this.AABB;
	}
	
	
	/**
	 * Clear the array of sprites that collide with this Sprite.
	 */
	this.clearCollisions = function () {
	    this.collisions = [];
	};
	
	
	/**
	 * Add a sprite to the array of collisions for this Sprite.
	 *
	 * sprite - The Sprite to add to the collision array.
	 */
	this.addCollision = function (sprite) {
	    this.collisions[this.collisions.length] = sprite;
	};
	
	
	/**
	 * Return the array of Sprites that collide with this Sprite.
	 */
	this.getCollisions = function () {
	    return this.collisions;
	};
	
	
	/**
	 * Set the layer of this Sprite.
	 */
	this.setlayer = function (layer) {
	    this.layer= layer;
	    
	    this.spriteObject.css ("z-index",  layer);
	};
}