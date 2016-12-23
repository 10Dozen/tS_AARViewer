var aarData = {};
var aarCurrentTime = 0;
var aarPlaying = false;
var aarAutoStepper;
var aarMapParam = [];
var aarIconSrc = "svg";
var eStyle = {
	"headerStatus": {
		"default": {
			"text": "Open AAR file to play...",
			"bgColor": "#5a5a5a"			
		}
		,"onload": {
			"text": "Загрузка...",
           "bgColor": "#5a5a5a"
		}
		,"success": {
			"text": "Click 'Play' to start!",
			"bgColor": "rgb(155, 195, 78)"
		}
		,"failed": {
			"text": "File is not AAR file!",
			"bgColor": "#AF4E4E"
		}
		,"file_not_available": {
			"text": "AAR failed to download...",
			"bgColor": "#AF4E4E"
		}
		,"offline_mode": {
			"text": "Select AAR file to play...",
			"bgColor": "#5a5a5a"
		}
	}
}


function goToList() {
	window.open("Web-AAR-List.html","_self")
}
function showLoadingFailed() {
	$( "#header-status-text" ).html( eStyle.headerStatus.file_not_available.text );
    $( "#header-status" ).css( "background-color", eStyle.headerStatus.file_not_available.bgColor );
    setTimeout(switchToOffline, 3000);
};

function switchToOffline() {
	$( document ).ready(function () {
		$( "#header-status-text" ).html( eStyle.headerStatus.offline_mode.text );
        $( "#header-status" ).css( "background-color", eStyle.headerStatus.offline_mode.bgColor );
	});
}

function startViewer() {
	if (localStorage.getItem('aarTitle') == null) {
		showLoadingFailed();
	} else {
		document.title = "AAR - " + localStorage.getItem('aarTitle');
		$( "#header-status-text" ).html( eStyle.headerStatus.onload.text );
		$( "#header-status" ).css( "background-color", eStyle.headerStatus.onload.bgColor );

		var aarLoadScript = document.createElement('script');
        aarLoadScript.src = localStorage.getItem('aarLink');

        aarLoadScript.addEventListener(
        	'error'
      		,showLoadingFailed
      		,false
        );

        aarLoadScript.addEventListener(
			'load'
 			,function() {
 				$( "#uploader" ).remove();
 				$( "#header-choose-file-btn" ).remove();

 				aarData = aarFileData;
 				showAARDetails();
                setTimeout( function() {
                	$( "#header-status-text" ).html( "Готово!" );
                	setTimeout( function() {
                		$( "#header-status-text" ).html( "" );
                	} , 1500);
                } , 500);
 			}
			,false
        );

        document.body.appendChild(aarLoadScript);
	}
}
			
// getMapParams(aarData.metadata.island)
function getMapParams(name) {
	var params;	
	for (var i = 0; i < maps.length; i++) {
		if (maps[i][0].toLowerCase() == name.toLowerCase()) {
			params = maps[i][1];
		};
	};	
	if (!params) { 
		console.log("Island config not found!"); 
		params =  { "size": 0, "scale": 1, "img": "" } 
	};
	
	return params;
};

function getScaledVal(value) {
	return Math.round(value / aarMapParam.scale)
};


// Open file
var openFile = function(event) {
	$( "#result-form" ).css( "top", "-1000px" );	
	$( "#header-status" ).css( "background-color", eStyle.headerStatus.default.bgColor );
	$( "#header-status-text" ).html( eStyle.headerStatus.default.text );

	var reader = new FileReader();

	reader.onload = function() {
		try {
			eval(this.result);
        	aarData = aarFileData;
        	console.log("Parsed!");

        	$( "#header-status-text" ).html( "Opened!" );
            $( "#header-status" ).css( "background-color", eStyle.headerStatus.success.bgColor );
            $( "#header-status-text" ).html( eStyle.headerStatus.success.text );
            showAARDetails();
		} catch (e) {
			console.log("Error occured during parsing!");
        	$( "#header-status" ).css( "background-color", eStyle.headerStatus.failed.bgColor );
        	$( "#header-status-text" ).html( eStyle.headerStatus.failed.text );
		}
	};

	reader.readAsText(uploader.files[0]);
};

function showAARDetails() {
	$( "#result-form" ).css( "top", "75px" );	
	$( "#mission-name" ).html( "<h3>" + aarData.metadata.name + "</h3>" );
	$( "#mission-island" ).html( aarData.metadata.island );
	$( "#mission-date" ).html( aarData.metadata.date );
	$( "#mission-time" ).html( getTimeLabel( aarData.metadata.time ) );
	$( "#mission-desc" ).html( aarData.metadata.desc );
	$( "#player-list" ).html(
		(function (){
			var output = "";
			var listOfNames = [];
			aarData.metadata.players.sort(function (a,b) {
			    if (a[0] < b[0]) return -1;
			    if (a[0] > b[0]) return 1;
			    return 0;
			});

			for (var i = 0; i < aarData.metadata.players.length; i++) {
			    var name = aarData.metadata.players[i][0];

			    if (listOfNames.indexOf(name) > -1) { continue; };

			    listOfNames.push(name);
				var color;
				switch (aarData.metadata.players[i][1]) {
					case "blufor": color = "RGB(0,77,152)"; break;
					case "opfor": color = "RGB(127,0,0)"; break;
					case "indep": color = "RGB(0,127,0)"; break;
					case "civ": color = "RGB(102,0,127)"; break;
				};
				output = output + "<li class='player-side-icon' style='padding: 2px 4px; background-color: " + color + "'>" + name + "</li>";
				}
			return (output)
		})()
	);
};

function toggleIconSrc() {
	if ( $( "#icon-src-switcher-pin" ).css( "float" ) == "left" ) {
		aarIconSrc = "png";
		$( "#icon-src-switcher-pin" ).css( "float", "right" );
		$( "#icon-src-switcher-pin" ).css( "background-color", "#6798D2" );			
		$( "#icon-src-switcher" ).css( "background-color", "#9BC34E" );
	} else {
		aarIconSrc = "svg";
		$( "#icon-src-switcher-pin" ).css( "float", "left" );
		$( "#icon-src-switcher-pin" ).css( "background-color", "#9BC34E" );
		$( "#icon-src-switcher" ).css( "background-color", "#6798D2" );		
	}
	$( "#icon-src-switcher  > label" ).html( aarIconSrc.toUpperCase() );
};

// Time label
function getTimeLabel(t) {
	var time = t;
	var timeHours = time / 60 /60 | 0;
	var timeMinutes = (time - timeHours*60*60) /60 | 0;
	var timeSeconds = time - timeHours*60*60 - timeMinutes*60;
	var output = "";
	function formatTimeNum(t,l) {
		var output = t + " " + l + " ";		
		if (t > 0) { 
			if (t < 10) {output = "0" + output;} 
		} else { 
			if (l == "s") {
				output = "00 s"
			} else {
				output = ""
			}
		}
		return output
	}	
	return formatTimeNum(timeHours,"h") + formatTimeNum(timeMinutes,"m") + formatTimeNum(timeSeconds,"s")
}

function createObject(data,type) {
	// 0: Unit Array
	// 1: "unit" or "veh"
	var id = data[0];
	var name = data[1];

	var side = (function(){var a = ""; if (type == "unit") { a = data[2] } else { a ="unknown" }; return a})();
	var icon = "src/icons/" + side + "_" + type + "." + aarIconSrc;	
	$( ".panzoom" ).append( "<div id='mrk-unit-" + id + "' class='unit-marker'><img class='icn' dir='0' src='" + icon + "' /><span>" + name + "</span></div>" );

	$( "#mrk-unit-" + id ).attr({
		"side": side,
		"type": type,
		"name": name
	});

	$("#mrk-unit-" + id + " > .icn").attr({"title": name});

	$( ".icn" ).css({
		"width": getScaledVal(32) + "px",
		"height": getScaledVal(32) + "px"		
	});

	$( "#mrk-unit-" + id ).css({
	 	"font-size": getScaledVal(16) + "px",
	 	"z-index": 2
	});
}

// Init AAR
function initAAR() {	
	$( "#result-form" ).remove();
	$( "#header" ).remove();
	
	$( "#player-step" ).html( "<span>0 s</span> / " + getTimeLabel(aarData.metadata.time) );
	$( "#slider").slider( "option", "max", aarData.metadata.time );
	$( "#player-line" ).css( "top", "12px" );

	aarMapParam = getMapParams(aarData.metadata.island);
	
	$( ".panzoom > img" ).attr( "src", aarMapParam.img );	
	panzoomInit();
	
	// Spawn
	// Spawn Vehicles
	var vehs = aarData.metadata.objects.vehs;
	for (var i = 0; i < vehs.length; i++) {
		createObject( vehs[i], "veh" );
	}	
	
	// Spawn Units
	var units = aarData.metadata.objects.units;
	for (var i = 0; i < units.length; i++) {
		createObject( units[i], "unit" );
	}
	
	document.map.onload = function() {
		$( ".panzoom" ).panzoom('resetDimensions');
		playReportStep( 0 );
	};
	
	$( "#player-header" ).html(aarData.metadata.name + " (" + aarData.metadata.date + ")");
	$( "#player-line > button" ).removeAttr( "disabled" );
};

// Panzoom Init
var panzoomInit = function() {
	var $panzoom = $('.panzoom').panzoom();
	$('.panzoom').panzoom("option", {
		minScale: 0.1,
		maxScale: 4		
	});
	
	$panzoom.parent().on('mousewheel.focal', function( e ) {
		e.preventDefault();
		var delta = e.delta || e.originalEvent.wheelDelta;
		var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
		$panzoom.panzoom('zoom', zoomOut, {
			increment: 0.1,
			animate: true,
			easing: "ease-in-out",
			focal: e
		});
	});
};

// Rotate Image
jQuery.fn.rotate = function(degrees) {
	$(this).css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
				 '-moz-transform' : 'rotate('+ degrees +'deg)',
				 '-ms-transform' : 'rotate('+ degrees +'deg)',
				 'transform' : 'rotate('+ degrees +'deg)'});
	return $(this);
};

// Get Metadata of actors
function getUnitMetadata(id) {
	var output = [];
	for (var i = 0; i < aarData.metadata.objects.units.length; i++) {
		if ( aarData.metadata.objects.units[i][0] == id ) {
			output = aarData.metadata.objects.units[i];
			i = aarData.metadata.objects.units.length;
		}		
	}
	return output;	
}

function getVehicleMetadata(id) {
	var output = [];
	for (var i = 0; i < aarData.metadata.objects.vehs.length; i++) {
		if ( aarData.metadata.objects.vehs[i][0] == id ) {
			output = aarData.metadata.objects.vehs[i];
			i = aarData.metadata.objects.vehs.length;
		}		
	}
	return output
}

function isPlayer(id) {
	var result = false;
	if ( (getUnitMetadata(id))[3] ) { result = true };
	
	return result	
}

function setGridPos(unit, data) {
	if ( data[4] ) {
		var posx = getScaledVal( data[1] ) - ( $( unit ).outerWidth() /2 );	
		var posy = aarMapParam.size - getScaledVal( data[2] ) - getScaledVal( 16 );
		$( unit ).css({ "left": posx, "top": posy });
	}
}

function drawAttack(data, timelabel) {
	var id = "av-" + timelabel + "-" + data[0] + data[1] + data[2] + data[3];
	$( ".panzoom" ).append(
		"<canvas id='" + id 
		+ "' width='" + aarMapParam.size
		+ "' height='" + aarMapParam.size
		+ "' timelabel='" + timelabel
		+ "'></canvas>"
	);
	
	$( "#" + id ).css({
		"top": "0px",
		"left": "0px"
	});
	
	var ctx = $( "#" + id )[0].getContext('2d');
	ctx.beginPath();
	ctx.moveTo( getScaledVal( data[0] ), aarMapParam.size - getScaledVal( data[1] ) );
	ctx.lineTo( getScaledVal( data[2] ), aarMapParam.size - getScaledVal( data[3] ) );
	ctx.lineWidth = getScaledVal( showSmallState ? 1 : 3 );
	ctx.strokeStyle = '#FF6000';
	ctx.lineCap = 'round';
	ctx.stroke();
}


function clearAttacks(timelabel) {
	$( "canvas" ).each(function () {
		var canvas = $( this );
		if ( 
			( timelabel - canvas.attr( "timelabel" ) ) < 0
			|| ( timelabel - canvas.attr( "timelabel" ) ) > 3
		) {
			canvas.remove();
		};
	});
}

// Process unit - animate
function processUnit(data,type) {
	// 0: unit/vehicle data
	// 1: "unit" or "veh"
	var id = data[0];	
	var unit = "#mrk-unit-" + id;
	var dir = data[3];
	var alive = data[4];

	$( unit + " > img" ).css({"width": (showSmallState ? getScaledVal(16) + "px" : getScaledVal(32) + "px")});
	$( unit + " > span" ).css({"font-size": (showSmallState ? "6px" : "16px")});

	var inCargo, owner, cargo
	if (type == "unit") {
		inCargo = data[5];	
		if (inCargo == -1) {
			$( unit + " > img" ).rotate( dir );
			$( unit ).css({"color": "rgba(0, 0, 0, " + (showNamesState ? 255 : 0) + ")"});
			setGridPos(unit, data);		
		} else {
			$( unit ).css({ "left": "-20px","top": "-20px" });
		}
		
		if (alive < 1) {
			var typePlayer = "";
			if (isPlayer(id)) {			
				typePlayer = "player_";
			}			
			$( unit + "> img" ).attr( "src", "src/icons/dead_" + typePlayer + "unit." + aarIconSrc );
			$( unit ).css({
				"color": "rgba(0, 0, 0, " + (showNamesState ? 0.25 : 0) + ")",
				"z-index": 0
			});
		} else {
			$( unit + "> img" ).attr( "src", "src/icons/" + $( unit ).attr("side") + "_" + $( unit ).attr("type") + "." + aarIconSrc );			
		}
	} else {
		owner = data[5];
		cargo = data[6];		
		if (owner > -1 || cargo > -1) {
			var unitData = getUnitMetadata(owner);
			var unitName = $( unit ).attr("name") + " (" + unitData[1] + ")";			
			var unitSide = unitData[2];
			if (cargo > 0) { unitName = $( unit ).attr("name") + " (" + unitData[1] + " +" + cargo + ")"; }						
			$( unit + "> img" ).attr( "src", "src/icons/" + unitSide + "_veh." + aarIconSrc )			
			$( unit + "> span").html( unitName );
			$( unit ).css({"color": "rgba(0, 0, 0, 0.6)"});
		} else {
			$( unit + "> img" ).attr( "src", "src/icons/unknown_veh." + aarIconSrc )			
			$( unit + "> span").html(  getVehicleMetadata(id)[1] );
			$( unit ).css({"color": "rgba(0, 0, 0, 0.25)"});
		}
		
		$( unit + " > img" ).rotate( dir );
		setGridPos(unit, data);
		
		if (alive < 1) { $( unit + "> img" ).attr( "src", "src/icons/dead_veh." + aarIconSrc ) }
	}
};

// Play AAR frame (1 second)
function playReportStep (step) {
	var units = aarData.timeline[step][0];
	var vehs = aarData.timeline[step][1];
	var attacks = aarData.timeline[step][2];
	clearAttacks(step);
	
	for (var i = 0; i < units.length; i++) {		
		processUnit( units[i], "unit" );
	};
	for (var i = 0; i < vehs.length; i++) {
		processUnit( vehs[i], "veh" );
	};
	for (var i = 0; i < attacks.length; i++) {
		drawAttack(attacks[i], step);
	}
	$( ".panzoom" ).panzoom('resetDimensions');
};

// Play AAR in auto mode
function playReportAuto () {
	if (!aarPlaying) {
		startReport();
		aarAutoStepper = setInterval(
			function () {
				if (aarCurrentTime != aarData.metadata.time) {				
					reportNextStep();
				} else {
					clearInterval( aarAutoStepper );
					stopReport();
				}
			}
			, 2000/( $( "#player-speed" ).val() )
		);
	} else {
		stopReport();
	}
};

function startReport() {
	aarPlaying = true;
	$( "#player-step-play" ).button( "option", { label: "pause", icons: {primary: "ui-icon-pause"} });
	clearInterval( aarAutoStepper );
};

function stopReport() {
	aarPlaying = false;
	$( "#player-step-play" ).button( "option", {label: "play", icons: {primary: "ui-icon-play"} });
	clearInterval( aarAutoStepper );
};

function reportNextStep () {
	if ( aarCurrentTime + 1 <= aarData.metadata.time ) {		
		aarCurrentTime = aarCurrentTime + 1;
		$( "#slider" ).slider({ value: aarCurrentTime });
		$( "#player-step > span" ).html( getTimeLabel(aarCurrentTime) );
		playReportStep ( aarCurrentTime );		
	}
};

function reportPrevStep () {
	if ( aarCurrentTime - 1 >= 0 ) {
		aarCurrentTime = aarCurrentTime - 1;
		$( "#slider" ).slider({ value: aarCurrentTime });
		$( "#player-step > span" ).html( getTimeLabel(aarCurrentTime) );
		playReportStep ( aarCurrentTime );
	}
};

var whereAreUnitsState = false;
function whereAreUnits() {
	var whereAreUnitsCanvas = "where-are-units-canvas";
	if (whereAreUnitsState) {
		whereAreUnitsState = false;
		$( "#" + whereAreUnitsCanvas ).remove();
	} else {
		whereAreUnitsState = true;
		$( ".panzoom" ).append(
			"<canvas id='" + whereAreUnitsCanvas + "'"
			+ "' width='" + aarMapParam.size
			+ "' height='" + aarMapParam.size
			+ "'></canvas>"
		);
		$( "#" + whereAreUnitsCanvas ).css({
			"top": "0px",
			"left": "0px"
		});
		
		for (var i = 0; i < aarData.timeline[aarCurrentTime][0].length; i++) {
			var icn = aarData.timeline[aarCurrentTime][0][i];
			var ctx = $( "#" + whereAreUnitsCanvas )[0].getContext('2d');
			ctx.beginPath();
			ctx.moveTo( 0, 0 );
			ctx.lineTo( getScaledVal( icn[1] ), aarMapParam.size - getScaledVal( icn[2] ) );
			ctx.lineWidth = 3;
			ctx.strokeStyle = '#8E00FF';
			ctx.lineCap = 'round';
			ctx.stroke();
		};					
	}				
}

var showNamesState = true;
function toggleNames() {
    showNamesState = showNamesState ? false : true;
    playReportStep(aarCurrentTime);
}

var showSmallState = false;
function toggleSize() {
	showSmallState = showSmallState ? false : true;
    playReportStep(aarCurrentTime);
}

$( document ).ready(function () {
	$( "#slider" ).slider({
		range: "min",
		min: 0,
		max: 100,
		slide: function( event, ui ) {
			$( "#player-step > span" ).html( getTimeLabel(ui.value) );
			playReportStep ( ui.value );
			aarCurrentTime = ui.value;
			stopReport();
		},
		change: function( event, ui ) {
			if (ui.value == aarData.metadata.time) { stopReport(); }
		}
	});
	$( "#player-step > span" ).html( "0 s" );
	
	$( "#player-speed" ).selectmenu();
	$( "#player-step-backward" ).button({text: false,icons: { primary: "ui-icon-seek-prev" }}).click(function() { stopReport(); });
	$( "#player-step-forward" ).button({text: false,icons: {primary: "ui-icon-seek-next"}}).click(function() { stopReport(); });
	$( "#player-step-play" ).button({text: false,icons: {primary: "ui-icon-play"}});
	$( "#player-info" ).button({text: false, icons: { primary: "ui-icon-help" }});
	$( "#player-toggleNames" ).button({text: false, icons: { primary: "ui-icon-tag" }});
	$( "#player-toggleIcons" ).button({text: false, icons: { primary: "ui-icon-circle-zoomout" }});

	$( "#player-line > button" ).attr( "disabled", "true" );

	startViewer();
});
