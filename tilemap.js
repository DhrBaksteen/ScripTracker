function TileMap (name, rows, cols, tileSize, parent) {
	this.name     = name;
	this.rows     = rows;
	this.cols     = cols;
	this.tileSize = tileSize;
	this.width    = cols * tileSize;
	this.height   = rows * tileSize;
	this.x = 0;
	this.y = 0;

	this.map = $("<div/>");
	this.map.css ("position", "absolute");
	this.map.css ("width",    this.width  + "px");
	this.map.css ("height",   this.height + "px");
	this.map.css ("margin",   "0px");
	this.map.css ("padding",  "0px");
	
	parent.append (this.map);
	
	// Create rendering targets.
	for (var i = 0; i < rows * cols; i ++) {
        var img = $("<img/>");
        
		img.attr ("id",  "t_" + this.name + "_" + i);
		img.attr ("alt", "");
		
		img.css ("margin", "0");
		img.css ("border", "0");
		img.css ("float",  "left");
		img.css ("width",  tileSize + "px");
		img.css ("height", tileSize + "px");

		this.map.append (img);
	}
	
	
	/**
	 * place a tile with the given name somewhere on tile TileMap.
	 *
	 * row      - The row to place the tile in.
	 * col      - The column to place the tile in.
	 * tileName - The name of the tile to place.
	 */
	this.setTile = function (row, col, tileName) {
	    tileIndex = row * this.cols + col;
	    
	    $("img#t_" + this.name + "_" + tileIndex).attr ("alt", tileName);
	};
	
	
	/**
	 * Set the position of the TileMap.
	 *
	 * x - X coordinate.
	 * y - Y coordinate.
	 */
	this.setPosition = function (x, y) {
	    this.x = x;
	    this.y = y;
	    
		this.map.css ("left", x + "px");
		this.map.css ("top",  y + "px");
	};
	
	
	/**
	 * Move the TileMap by a given number of pixels.
	 *
	 * deltaX - Number of pixels to move in X direction.
	 * deltaY - Number of pixels to move in Y direction.
	 */
	this.move = function (deltaX, deltaY) {
	    this.setPosition (this.x + deltaX, this.y + deltaY);
	};
}