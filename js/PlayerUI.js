var mod = null;
var player = null;
var playing = false;
var solo = false;
var scroll = 0;
var cellLookup = [];

// Dialog state info.
var Dialog = {
	contentSourceID: null,
	content:         null,
	onOpen:          null,
	onClose:         null
}


$(document).ready (function () {
	showDialog ({
		contentID: "dlgWelcome", 
		closeButtonID: "btnWelcomeOk",
		onOpen: function () {
			setTimeout (function () {
				closeDialog ();
			}, 20000);
		},
		onClose: function () {
			init ();
		}
	});

	
	for (var i = 0; i < 16; i ++) {
		cellLookup[i] = [];
		var rowData = $("<tr/>");
		var cell = $("<td class=\"patternCellBorder dataCell\">" + ((i < 16) ? "0" : "") + i.toString (16).toUpperCase () + "</td>");
		rowData.append (cell);
		cellLookup[i][0] = cell;
		
		for (var j = 0; j < 8; j ++) {
			cell = $("<td class=\"patternCellBorder dataCell\">... .. .. ...</td>");
			rowData.append (cell);	
			cellLookup[i][j + 1] = cell;
		}
		rowData.insertBefore ("#trPatScroll");	
	}

	
	$(window).resize(function(){
		$('.tracker').css ({
			position:'absolute',
			left: ($(window).width  () - $('.tracker').outerWidth  ())  / 2,
			top:  ($(window).height () - $('.tracker').outerHeight ()) / 2
		});
	});

	$(window).resize();
});


function init () {
	// Does the browser support the Web Audio API??
	if (typeof AudioContext === "undefined" &&
		typeof webkitAudioContext === "undefined") {
		showDialog ({
			contentID: "dlgNoWebAudio",
			closeButtonID: "btnNoAudioOk"
		});

		return;
	}
	
	player = new ScripTracker ();
	player.setRowCallbackhandler (playerUpdate);
				
	$("#modFileChooser").change (function (e) {
		var file = e.target.files[0];

		var fileReader = new FileReader();
		fileReader.onloadend = function (fileLoadedEvent) {
			if (fileLoadedEvent.target.readyState == FileReader.DONE) {
				var fileNamePart = String (file.name).split (".");
				var fileType = fileNamePart[fileNamePart.length - 1].toLowerCase ();
				
				if (fileType == "mod") {
					mod = ModLoader (fileLoadedEvent.target.result);
				} else if (fileType == "s3m") {
					mod = S3mLoader (fileLoadedEvent.target.result);
				} else if (fileType == "xm") {
					mod = XmLoader (fileLoadedEvent.target.result);
				}
								
				player.load (mod);
				
				// Set channel headers
				$("td[id^='tdPatHead']").each (function (i) {
					if (i >= mod.channels) {
						$(this).addClass ("patternRowHeaderMute");
						$(this).css ("cursor", "default");
					} else {
						$(this).removeClass ("patternRowHeaderMute");
						$(this).css ("cursor", "");
					}
				});
				
				$("#btnPlayPause").click ();
			}
		}

		fileReader.readAsBinaryString (file);
	});

	$(document).keydown (function (e) {
		if (e.keyCode == 68) {
			player.dump ();					
		}
	});

	$("#btnPlayPause").click (function () {
		if (!player.isPlaying ()) {
			$(this).removeClass ("btnPlay");
			$(this).addClass    ("btnPause");

			playing = true;
			player.play ();
		} else {
			$(this).removeClass ("btnPause");
			$(this).addClass    ("btnPlay");

			playing = false;
			player.stop ();
		}
	});


	$("#btnEject").click (function () {
		$("#btnPlayPause").removeClass ("btnPause");
		$("#btnPlayPause").addClass    ("btnPlay");
		if (player) {
			player.stop ();
		}

		$("#modFileChooser").trigger("click");
	});


	$("#btnPattern").click (function () {
		player.setPatternLoop (!player.isPatternLoop ());

		if (player.isPatternLoop ()) {
			$(this).addClass ("btnPatternDown");
		} else {
			$(this).removeClass ("btnPatternDown");
		}
	});


	$("#btnPrevOrder").click (function () {
		player.prevOrder ();
	});


	$("#btnNextOrder").click (function () {
		player.nextOrder ();
	});


	$("td[id^='tdPatHead']").click (function () {
		var channel = Number ($(this).attr ("id").split ("tdPatHead")[1]);

		if (channel + scroll < mod.channels) {
			player.setMute (channel + scroll, !player.isMuted (channel + scroll));
			
			if (player.isMuted (channel + scroll)) {
				$(this).addClass ("patternRowHeaderMute");
			} else {
				$(this).removeClass ("patternRowHeaderMute");
			}
		}
	});

	
	$("td[id^='tdPatHead']").bind ("contextmenu", function (e) {
		var channel = Number ($(this).attr ("id").split ("tdPatHead")[1]);
		if (channel + scroll >= mod.channels) return;

		if (!solo) {
			$("td[id^='tdPatHead']").addClass ("patternRowHeaderMute");
			for (var i = 0; i < mod.channels; i ++) {						
				player.setMute (i, true);
			}					
		
			$(this).removeClass ("patternRowHeaderMute");
			player.setMute (channel + scroll, false);
			
			solo = true;
		} else {
			$("td[id^='tdPatHead']").removeClass ("patternRowHeaderMute");
			
			for (var i = 0; i < mod.channels; i ++) {
				player.setMute (i, false);
			}
			
			solo = false;
		}
		
		return false;
	});

	
	$("#btnScrollLeft").click (function () {
		if (scroll > 0) {
			setScroll (scroll - 1);
		}
	});
	
	
	$("#btnScrollRight").click (function () {
		if (scroll < 24) {
			setScroll (scroll + 1);
		}
	});
}

function playerUpdate (player) {
	var row = player.getCurrentRow ();

	// Fill song info area.
	$("#txtSongName").text (player.getSongName ());
	$("#txtOrder").text    (player.getCurrentOrder () + "/" + player.getSongLength ());
	$("#txtPattern").text  (player.getCurrentPattern ());
	$("#txtRow").text      (row);
	$("#txtTempo").text    (player.getCurrentBPM () + "/" + player.getCurrentTicks ());

	var firstRow = Math.max (0, Math.min (row - 7, player.getPatternRows () - 16));
	for (var i = firstRow; i < firstRow + 16; i ++) {
		cellLookup [i - firstRow][0].text (((i < 16) ? "0" : "") + i.toString (16).toUpperCase ());
		for (var j = 0; j < 8; j ++) {					
			cellLookup [i - firstRow][j + 1].text (player.getNoteInfo (j + scroll, i));
			cellLookup [i - firstRow][j + 1].css ("background", (i % 4 == 0) ? "#202020" : "#000000");
		}
	}

	// Hilight current row.
	$("#patternView td").removeClass ("rowPlayHead");
	if (row < 8) {
		$("#patternView tr:nth-child(" + (row + 2) + ") td").addClass ("rowPlayHead");
	} else if (row > player.getPatternRows () - 9) {
		$("#patternView tr:nth-child(" + (row - (player.getPatternRows () - 18)) + ") td").addClass ("rowPlayHead");
	} else {
		$("#patternView tr:nth-child(9) td").addClass ("rowPlayHead");
	}

	// Set instruments and VU meters.
	for (var i = 0; i < 8; i ++) {
		$("#tdVuInst" + i).text (player.isMuted (i + scroll) ? "** MUTE **" : player.getChannelInstrument (i + scroll).substring (0, 13));
		var v = player.isMuted (i + scroll) ? -1 : Math.round (player.getChannelVolume (i + scroll) * 16);
		$("#tdVuCell" + i + " div").each (function (j) {
			if (j < 12) {
				if (v > j) {
					$(this).attr ("class", "vuLed vuGreenOn");
				} else {
					$(this).attr ("class", "vuLed vuGreenOff");
				}
			} else {
				if (v > j) {
					$(this).attr ("class", "vuLed vuRedOn");
				} else {
					$(this).attr ("class", "vuLed vuRedOff");
				}
			}
		});
	}	
}


function errorHandler (msg) {
	showDialog ({
		contentID: "dlgError",
		closeButtonID: "btnErrorOk",
		onOpen: function () {
			$("#lblError").text (msg);
		},
		onClose: function () {
			location.reload ();
		}
	});
}


function setScroll (leftCol) {
	scroll = leftCol;
	
	for (var i = 0; i < 8; i ++) {
		$("#tdPatHead" + i).text ("Channel " + ((leftCol + i + 1 < 10) ? "0" : "") + (leftCol + i + 1));
		if (player != null && player.isMuted (i + leftCol)) {
			$("#tdPatHead" + i).addClass ("patternRowHeaderMute");
		} else {					
			$("#tdPatHead" + i).removeClass ("patternRowHeaderMute");
		}
	}
	
	if (player != null) {
		playerUpdate (player);
	}
	
	$("#scrollButton").css ("margin-left", ((892 / 24) * leftCol) + "px");
}


/**
 * Open a dialog with given params object.
 */
function showDialog (params) {
	// Copy content from source container if a contentID is defined.
	if (params.contentID) {
		Dialog.contentSourceID = params.contentID;
		Dialog.content = $("#" + params.contentID).html ();
		$("#" + params.contentID).empty ();
		$("#dialog").append (Dialog.content);
	} else {
		Dialog.contentSourceID = null;
		Dialog.content         = null;
		return;
	}
	
	// Call dialog on open function if defined.
	if (params.onOpen) {
		Dialog.onOpen = params.onOpen;
		params.onOpen ();
	} else {
		Dialog.onOpen = null;
	}
	
	// Register dialog on close function if defined.
	if (params.onClose) {
		Dialog.onClose = params.onClose;
	} else {
		Dialog.onClose = params.onClose;
	}
	
	// Set close dialog call to close button if defined.
	if (params.closeButtonID) {
		$("#" + params.closeButtonID).click (function () {
			closeDialog ();
		});
	}

	// Closing the dialog with the Enter key, cause why not!?
	$(document).keydown (function (e) {
		if (e.keyCode == 13) {
			closeDialog ();
		}
	});
	
	$("#dialogOverlay").show ();
}


/**
 * Close the current dialog.
 */
function closeDialog () {
	// If we have dialog content call the onClose and copy content back to the source container.
	if (Dialog.content) {
		$("#" + Dialog.contentSourceID).append (Dialog.content);
	}
	
	var closeHandler = Dialog.onClose;
	
	// Clean up dialog info.
	Dialog.constenSourceID = null;
	Dialog.content         = null;
	Dialog.onOpen          = null;
	Dialog.onClose         = null;
	
	// Close dialog box.
	$("#dialogOverlay").hide ();
	$("#dialog").empty ();
	
	if (closeHandler) {
		closeHandler ();
	}
}