
const MS_IN_SECOND = 1000;
const appProperties = {
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
		, "ready": {
			"text": "Готово!"
		}
	},
	"links": {
		"aarList": "http://aar.tacticalshift.ru",
		"aarViewer": "http://aar.tacticalshift.ru/Web-AAR-Viewer.html"
	}
}

var aarData = {};
var aarCurrentTime = 0;
var aarPlaying = false;
var aarAutoStepper;
var aarMapParam = [];
var mapZoomedOut = false;
var mapZoomedOutThreshold = 0.6;
var aarIconSrc = "svg";
var $avl;
var aarAttackLines = [];
var aarAttackLinesTimeout = 3;
var whereAreUnitsState = false;

// Label Draw Manager
var LDM = {
	mode: "all"
	, opacity: {unit: 1, veh: 0.6, vehEmpty: 0.25}
	, btn: {
		color: "#fff"
		, text: "Labels []"
	}
	, change: function () {
		switch (this.mode) {
			case "all":
				this.mode = "units";
				this.opacity = {unit: 1, veh: 0, vehEmpty: 0 };
				this.btn.color = "#ffdd61";
				this.btn.text = "Labels [Units only]";
				break;
			case "units":
				this.mode = "vehicles";
				this.opacity = {unit: 0, veh: 0.6, vehEmpty: 0.25 };
				this.btn.color = "#56b1ff";
				this.btn.text = "Labels [Vehicles only]";
				break;
			case "vehicles":
				this.mode = "none";
				this.opacity = {unit: 0, veh: 0, vehEmpty: 0 };
				this.btn.color = "rgb(208, 255, 56)";
				this.btn.text = "Labels [None]";
				break;
			case "none":
				this.mode = "all";
				this.opacity = {unit: 1, veh: 0.6, vehEmpty: 0.25};
				this.btn.color = "";
				this.btn.text = "Labels [All]";
				break;
		}

		$("#player-toggleNames > span").css("background-color", this.btn.color);
		$("#player-toggleNames").attr("title", this.btn.text)
		playReportStep(aarCurrentTime,true);
	}
};

// Unit Size Manager
var USM = {
	mode: "normal"
	, size: {
		icon: 32
		, text: 16
	}
	, btn: {
		color: ""
		, text: "Names mode [Normal]"
	}
	, attackLineSize: 3
	, change: function() {
		switch (this.mode) {
			case "normal":
				this.mode = "small";
				this.size.icon = 16;
				this.size.text = 6;
				this.btn.color = "#ffdd61";
				this.btn.text = "Icon size [Small]";
				this.attackLineSize = 1;
				break;
			case "small":
				this.mode = "large";
				this.size.icon = 256;
				this.size.text = 128;
				this.btn.color = "#56b1ff";
				this.btn.text = "Icon size [Large]";
				this.attackLineSize = 16;
				break;
			case "large":
				this.mode = "normal";
				this.size.icon = 32;
				this.size.text = 16;
				this.btn.color = "";
				this.btn.text = "Icon size [Normal]";
				this.attackLineSize = 3;
				break;
		}

		$("#player-toggleIcons > span").css("background-color", this.btn.color);
		$("#player-toggleIcons").attr("title", this.btn.text)
		playReportStep(aarCurrentTime,true);
	}
};

// Scale-o-meter Manager
var SMM = {
    mode: "hidden"
	, btn: {
		color: ""
		, text: "Scale-o-meter [Corner]"
	}
	, css: {}
	, change: function() {
		switch (this.mode) {
			case "corner":
				this.mode = "center";
				this.btn.color = "#ffdd61";
				this.btn.text = "Scale-o-meter [Center]";
				this.css = {
					top: $(window).scrollTop() + $(window).height() / 2
					, left: $(window).scrollLeft() + $(window).width() / 2
				};
				break;
			case "center":
				this.mode = "hidden";
				this.btn.color = "#56b1ff";
				this.btn.text = "Scale-o-meter [Hidden]";
				this.css = {
					visibility: "hidden"
				};
				break;
			case "hidden":
				this.mode = "corner";
				this.btn.color = "";
				this.btn.text = "Scale-o-meter [Corner]";
				this.css = {
					visibility: ""
					, top: 64
					, left: 32
				};
				break;
		}

		$("#scalemeter").css(this.css);
		$(".scale-h").css(this.css);
		$(".scale-v").css(this.css)

		$("#player-toggleScale > span").css("background-color", this.btn.color);
		$("#player-toggleScale").attr("title", this.btn.text)
	}
	, redraw: function (scale) {
		var scaleSize = Math.ceil(100 * scale);
		var params;

		if (scaleSize >= 150) {
			// 50m
			params = {
				width: scaleSize/2
				, height: scaleSize/2
				, label: "50m"
			};

		} else if (scaleSize >= 50) {
			// 100m
			params = {
				width: scaleSize
				, height: scaleSize
				, label: "100m"
			};
		} else if (scaleSize >= 20 ) {
			// 500m
			params = {
				width: scaleSize*5
				, height: scaleSize*5
				, label: "500m"
			};
		} else {
			// 1km
			params = {
				width: scaleSize*10
				, height: scaleSize*10
				, label: "1km"
			};
		}

		$("#scalemeter").html(params.label);
		$("#scale-h-1 > line").attr("x2", params.width);
		$("#scale-h-2 > line").attr("x2", params.width / 2);
		$("#scale-v-1 > line").attr("y2", params.height);
		$("#scale-v-2 > line").attr("y2", params.height / 2);
		$(".scale-h").css("width", params.width);
		$(".scale-v").css("height", params.height);
	}
};


function goToList() {
 	window.open(
 		window.location.href == appProperties.links.arrViewer ? appProperties.links.aarList : "Web-AAR-List.html"
 		,"_self"
 	)
}

function onFailedAARLoad() {
	$( "#header-status-text" ).html( appProperties.headerStatus.file_not_available.text );
    $( "#header-status" ).css( "background-color", appProperties.headerStatus.file_not_available.bgColor );
    setTimeout(switchToOffline, 3000);
};

function switchToOffline() {
	$( document ).ready(function () {
	    $( "#header-choose-file-btn" ).show();
		$( "#header-status-text" ).html( appProperties.headerStatus.offline_mode.text );
        $( "#header-status" ).css( "background-color", appProperties.headerStatus.offline_mode.bgColor );
	});
}

function onSuccessAARLoad() {
	$( "#uploader" ).remove();
	$( "#header-choose-file-btn" ).remove();

	aarData = aarFileData;

	document.title = "AAR - " + aarData.metadata.name;
	$( "#header-status-text" ).html( appProperties.headerStatus.onload.text );
	$( "#header-status" ).css( "background-color", appProperties.headerStatus.onload.bgColor );

	showAARDetails();

	setTimeout( function() {
		$( "#header-status-text" ).html( appProperties.headerStatus.ready.text );
		setTimeout( function() { $( "#header-status-text" ).html( "" ); } , 1500);
	});

	// If was opened from storage link - update URL with path
	if (localStorage.getItem('aarLink') != null) {
		let url = window.location.protocol + "//" + window.location.host + window.location.pathname + '?aar=' + encodeURI(localStorage.getItem('aarLink'));
		window.history.pushState({ path: url }, '', url);
	}
}

function loadAAR(path) {
	var aarLoadScript = document.createElement('script');
	aarLoadScript.src = path;
	aarLoadScript.addEventListener('error', onFailedAARLoad, false);
	aarLoadScript.addEventListener('load', onSuccessAARLoad, false);
	document.body.appendChild(aarLoadScript);
}
function startViewer() {
    $( "#header-choose-file-btn" ).hide();
	let aarPath = "";
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.has('aar')) {
		aarPath = decodeURI(urlParams.get('aar'));
		localStorage.removeItem('aarLink');
	} else {
		if (localStorage.getItem('aarLink') != null) {
			aarPath = localStorage.getItem('aarLink');
		} else {
			onFailedAARLoad();
		};
	};

	loadAAR(aarPath);
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
		params = { size: 20480, scale: 1, tiles: 1, img: "src/maps/NoTerrain_*.png" };
	};

	return params;
};

function getScaledVal(value) {
	return Math.round(value / aarMapParam.scale)
};

// Open file
var openFile = function(event) {
	$( "#result-form" ).css( "top", "-1000px" );
	$( "#header-status" ).css( "background-color", appProperties.headerStatus.default.bgColor );
	$( "#header-status-text" ).html( appProperties.headerStatus.default.text );

	var reader = new FileReader();

	reader.onload = function() {
		try {
			eval(this.result);
        	aarData = aarFileData;
        	console.log("Parsed!");

        	$( "#header-status-text" ).html( "Opened!" );
            $( "#header-status" ).css( "background-color", appProperties.headerStatus.success.bgColor );
            $( "#header-status-text" ).html( appProperties.headerStatus.success.text );
            showAARDetails();
		} catch (e) {
			console.log("Error occured during parsing!");
        	$( "#header-status" ).css( "background-color", appProperties.headerStatus.failed.bgColor );
        	$( "#header-status-text" ).html( appProperties.headerStatus.failed.text );
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

// Init AAR
function initAAR() {
	$( "#result-form" ).remove();
	$( "#header" ).remove();

	$( "#player-step" ).html( "<span>0 s</span> / " + getTimeLabel(aarData.metadata.time) );
	$( "#slider").slider( "option", "max", aarData.metadata.time );
	$( "#player-line" ).css( "top", "12px" );

	aarMapParam = getMapParams(aarData.metadata.island);
	drawMap(aarMapParam);
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

	$( "#player-header" ).html(aarData.metadata.name + " (" + aarData.metadata.date + ")");
	$( "#player-line > button" ).removeAttr( "disabled" );
    $( ".panzoom" ).append("<div id='attackLinesDiv' ></div>");
    $avl = $( "#attackLinesDiv" );
	$avl.css({
	    "top": "0px"
	    , "left": "0px"
	    , "display": "inline"
	    , "position": "absolute"
	    , "z-index": 3
	    , "width": aarMapParam.size
	    , "height": aarMapParam.size
	});
};

function getOffsets(tiles, size) {
	var result = [];
	var gridSize = Math.sqrt(tiles);
	var stepSize = Math.floor(size / gridSize);

	for (var i = 0; i < gridSize; i++) {
		for (var j = 0; j < gridSize; j++) {
			result.push({
				top: stepSize * i
				, left: stepSize * j
			})
		}
	}

	return result;
}

function drawMap(config) {
    /* Config  {
    *   size: 8533
    *   scale: 1.5
    *   tiles: 16
    *   img: "src/maps/Takistan/*.png"
    */

	var offsets = getOffsets(config.tiles, config.size);

    if (config.tiles > 1 || config.img == "src/maps/NoTerrain_*.png") {
        $( ".panzoom" ).append("<img name='tile-0' class='map-tile' src='" + config.img.replace('*', "00") + "' />" );
        $( "img[name=tile-0]" ).css({
            "top": "0px"
            , "left": "0px"
            , "width": aarMapParam.size
        });
	}

	for (var i = 1; i <= config.tiles; i++) {
		$( ".panzoom" ).append("<img name='tile-" + i + "' class='map-tile' "
			+ "src='" + config.img.replace('*', (i < 10 ? "0" + i : "" + i)) + "' />" );
		$( "img[name=tile-" + i + "]" ).css( offsets[i-1] );
	}

	document.getElementsByName("tile-" + config.tiles)[0].onload = mapOnLoad;
};

function redrawMapOnZoom(scale) {
    if (aarMapParam.tiles == 1) { return; };
	if (!mapZoomedOut && scale < mapZoomedOutThreshold) {
		// console.log("Change to single tile");
		mapZoomedOut = true;

		$( "img[name=tile-0]" ).css("visibility", "");
		for (var i = 1; i <= aarMapParam.tiles; i++) {
			$("img[name=tile-" + i + "]").css("visibility","hidden");
		}
	} else if (mapZoomedOut && scale >= mapZoomedOutThreshold) {
		// console.log("Change to several tiles");
		mapZoomedOut = false;

		$( "img[name=tile-0]" ).css("visibility", "hidden");
		for (var i = 1; i <= aarMapParam.tiles; i++) {
			$("img[name=tile-" + i + "]").css("visibility","");
		}
	}
}

function mapOnLoad() {
	$( ".panzoom" ).panzoom('resetDimensions');
	playReportStep( 0, false );
}

// Panzoom Init
var panzoomInit = function() {
	var $panzoom = $('.panzoom').panzoom();
	$('.panzoom').panzoom("option", {
		minScale: 0.1,
		maxScale: 4
	});

	$('.panzoom').on('panzoomzoom', function(e, panzoom , scale, opts) {
		redrawMapOnZoom(scale);
		SMM.redraw(scale);
	});
	SMM.change();
	SMM.redraw(1);

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

// Actors

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

function setGridPos(unit, data) {
	if ( data[4] ) {
		var pos = getGridPos(data[1], data[2])
		$( unit ).css({
			"left": pos.x - $( unit ).outerWidth() /2
			, "top": pos.y - ( $( unit ).outerHeight() - $( unit + " > span" ).outerHeight() )/2
		});
	}
}

function getGridPos(x,y) {
    return { x: getScaledVal( x ), y: aarMapParam.size - getScaledVal( y ) };
}

// Process unit - animate
function processUnit(data,type) {
	// 0: unit/vehicle data
	// 1: "unit" or "veh"
	var id = data[0];
	var unit = "#mrk-unit-" + id;

	$( unit + " > img" ).css({"width": getScaledVal(USM.size.icon), "height": getScaledVal(USM.size.icon)});
    $( unit + " > span" ).css({"font-size": USM.size.text});

	if (data.length == 1) {
		if (type == "unit") {
			$( unit ).css({"color": "rgba(0, 0, 0, " + LDM.opacity.unit + ")"});
		} else {
			$( unit ).css({"color": "rgba(0, 0, 0, " + LDM.opacity.vehEmpty + ")"});
		}

		return;
	}

	var dir = data[3];
	var alive = data[4];

	$( unit + " > img" ).css({"width": getScaledVal(USM.size.icon), "height": getScaledVal(USM.size.icon)});
	$( unit + " > span" ).css({"font-size": USM.size.text});

	var inCargo, owner, cargo
	if (type == "unit") {
		inCargo = data[5];
		if (inCargo == -1) {
			$( unit + " > img" ).rotate( dir );
			$( unit ).css({"color": "rgba(0, 0, 0, " + LDM.opacity.unit + ")"});
			$( unit ).css({"visibility": ""});
			setGridPos(unit, data);
		} else {
			$( unit ).css({ "left": "-20px","top": "-20px", "visibility": "hidden" });
		}

		if (alive < 1) {
			var typePlayer = "";
			if (isPlayer(id)) {
				typePlayer = "player_";
			}
			$( unit + "> img" ).attr( "src", "src/icons/dead_" + typePlayer + "unit." + aarIconSrc );
			$( unit ).css({
				"color": "rgba(0, 0, 0, " +  LDM.opacity.vehEmpty + ")",
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
			$( unit ).css({"color": "rgba(0, 0, 0, " + LDM.opacity.veh + ")"});
		} else {
			$( unit + "> img" ).attr( "src", "src/icons/unknown_veh." + aarIconSrc )
			$( unit + "> span").html(  getVehicleMetadata(id)[1] );
			$( unit ).css({"color": "rgba(0, 0, 0, " + LDM.opacity.vehEmpty + ")"});
		}

		$( unit + " > img" ).rotate( dir );
		setGridPos(unit, data);

		if (alive < 1) { $( unit + "> img" ).attr( "src", "src/icons/dead_veh." + aarIconSrc ) }
	}
};

// Attacks
function drawAttackLine(attackData) {
    var size = aarMapParam.size;

    $avl.append("<svg class='attack-vector' id='av-" + attackData.id + "' height='" + size + "' width='" + size + "' >"
        + "<line x1='" + attackData.pos1.x + "' y1='" + attackData.pos1.y
        + "' x2='" + attackData.pos2.x + "' y2='" + attackData.pos2.y
        + "' style='stroke:rgb(245, 132, 0);stroke-width:" + USM.attackLineSize + "'></line>"
        + "</svg>"
    );
}

function removeAttackLine(id) {
    $( "#av-" + id ).remove();
}

function addAttackLine(data, timelabel) {
    // in AAR attacks looks like:   [1473,3036,1445,2619]
    var id = "" + timelabel + data[0] + data[1] + data[2] + data[3];

    if ( aarAttackLines.filter(function( obj ) { return (obj.id == id);}).length == 0 ) {
        aarAttackLines.push( {
            id: id
            , pos1: getGridPos(data[0], data[1])
            , pos2: getGridPos(data[2], data[3])
            , timelabel: timelabel
        } );
    }
}

function redrawAttackLines(timelabel) {
    for (var i = 0; i < aarAttackLines.length; i++) {
        if (
            aarAttackLines[i].timelabel + aarAttackLinesTimeout - timelabel > 0
            && timelabel >= aarAttackLines[i].timelabel
        ) {
            drawAttackLine(aarAttackLines[i]);
        } else {
            removeAttackLine(aarAttackLines[i].id);
        }
    };
}

// Play AAR frame (1 second)
function playReportStep (step, forced) {
	var units = aarData.timeline[step][0];
	var vehs = aarData.timeline[step][1];
	var attacks = aarData.timeline[step][2];

	if (forced) {
		$("[id^=mrk-unit-]").each(function () {
			var id = parseInt( $( this ).attr("id").split("-")[2] );
			var type = $( this ).attr("type");

			if (type == "unit") {
				var unitData = units.filter(function (unit) { if (unit[0] == id) { return unit }; return; });
				processUnit( unitData.length > 0 ? unitData : [id], "unit" );
			} else {
				var vehData = vehs.filter(function (veh) { if (vehs[0] == id) { return veh } });
				processUnit( vehData.length > 0 ? vehData : [id], "veh" );
			}
		});

		$( ".panzoom" ).panzoom('resetDimensions');
		return;
	}

	for (var i = 0; i < units.length; i++) {
		processUnit( units[i], "unit" );
	};
	for (var i = 0; i < vehs.length; i++) {
		processUnit( vehs[i], "veh" );
	};
	for (var i = 0; i < attacks.length; i++) {
		// drawAttack(attacks[i], step);
		addAttackLine(attacks[i], step);
	}
	redrawAttackLines(step);

	$( ".panzoom" ).panzoom('resetDimensions');
};

// Play AAR in auto mode
function playReportAuto () {
	if (!aarPlaying) {
		console.log("Playback: Started")

		startReport();
		let speed = $( "#player-speed" ).val();
		setPlayInterval(speed);
	} else {
		stopReport();
	}
}

function setPlayInterval(speed) {
	frameTime = MS_IN_SECOND / speed;
	console.log(`Playback: ${speed} FPS, frameTime: ${frameTime} ms`)

	aarAutoStepper = setInterval(
		function () {
			// If UI speed changed -> re-initiate setInterval with different Frame time
			let playbackSpeed = $( "#player-speed" ).val();
			if (speed != playbackSpeed) {
				console.log(`Playback: FPS change old: ${speed}, new: ${playbackSpeed}`)

				unsetPlayInterval(true);
				setPlayInterval(playbackSpeed);
				return;
			}

			aarCurrentTime = Math.min(aarCurrentTime + 1, aarData.metadata.time);
			if (aarCurrentTime <= aarData.metadata.time) {
				reportCurrentStep();
			} else {
				stopReport();
			}
		}
		, frameTime
	);
}

function unsetPlayInterval(forced) {
	if (aarPlaying || forced) {
		console.log(`Playback: Stopped`)
		clearInterval( aarAutoStepper );
	}
}

function startReport() {
	unsetPlayInterval();
	aarPlaying = true;
	$( "#player-step-play" ).button( "option", { label: "pause", icons: {primary: "ui-icon-pause"} });
}

function stopReport() {
	unsetPlayInterval();
	aarPlaying = false;
	$( "#player-step-play" ).button( "option", {label: "play", icons: {primary: "ui-icon-play"} });
}

function reportCurrentStep () {
	$( "#slider" ).slider({ value: aarCurrentTime });
	$( "#player-step > span" ).html( getTimeLabel(aarCurrentTime) );
	playReportStep ( aarCurrentTime, false );
};

function reportNextStep() {
	if ( aarCurrentTime + 1 <= aarData.metadata.time ) {
		aarCurrentTime = aarCurrentTime + 1;
		reportCurrentStep();
	}
};

function reportPrevStep() {
	if ( aarCurrentTime - 1 >= 0 ) {
		aarCurrentTime = aarCurrentTime - 1;
		reportCurrentStep();
	}
};

// Additional functions
function whereAreUnits() {
	var whereAreUnitsLayer = "where-are-units-canvas";
	if (whereAreUnitsState) {
		whereAreUnitsState = false;
		$( "#" + whereAreUnitsLayer ).remove();
	} else {
		whereAreUnitsState = true;
        $( ".panzoom" ).append("<div id='" + whereAreUnitsLayer + "' ></div>");
        var $wul = $( "#" + whereAreUnitsLayer );
        $wul.css({
            "top": "0px"
            , "left": "0px"
            , "display": "inline"
            , "position": "absolute"
            , "z-index": 3
            , "width": aarMapParam.size
            , "height": aarMapParam.size
        });

        for (var i = 0; i < aarData.timeline[aarCurrentTime][0].length; i++) {
            var icn = aarData.timeline[aarCurrentTime][0][i];
            $wul.append("<svg class='attack-vector' height='" + aarMapParam.size + "' width='" + aarMapParam.size + "' >"
                + "<line x1='0' y1='0' "
                + "x2='" + getScaledVal( icn[1] ) + "' y2='" + (aarMapParam.size - getScaledVal( icn[2] ))
                + "' style='stroke:#8E00FF;stroke-width:6;stroke-dasharray:50'></line>"
                + "</svg>"
            );
        }
	}
}

var isAA = false;
function toggleAA() {
	isAA = !isAA;
	$(".map-tile").css("image-rendering", isAA ? "auto" : "");
	$( "#player-toggleAA" ).button({text: false, icons: { primary: isAA ? "ui-icon-grip-solid-horizontal" : "ui-icon-grip-dotted-horizontal" }});
}

$( document ).ready(function () {
	$( "#slider" ).slider({
		range: "min",
		min: 0,
		max: 100,
		slide: function( event, ui ) {
			$( "#player-step > span" ).html( getTimeLabel(ui.value) );
			playReportStep ( ui.value, false );
			aarCurrentTime = ui.value;
			stopReport();
		},
		change: function( event, ui ) {
			if (ui.value == aarData.metadata.time) { stopReport(); }
		}
	});
	$( "#player-step > span" ).html( "0 s" );

	$( "#player-speed" ).val(50);
	$( "#player-speed" ).selectmenu();
	$( "#player-step-backward" ).button({text: false,icons: { primary: "ui-icon-seek-prev" }}).click(function() { stopReport(); });
	$( "#player-step-forward" ).button({text: false,icons: {primary: "ui-icon-seek-next"}}).click(function() { stopReport(); });
	$( "#player-step-play" ).button({text: false,icons: {primary: "ui-icon-play"}});
	$( "#player-info" ).button({text: false, icons: { primary: "ui-icon-help" }});
	$( "#player-toggleAA" ).button({text: false, icons: { primary: "ui-icon-grip-dotted-horizontal" }});
	$( "#player-toggleNames" ).button({text: false, icons: { primary: "ui-icon-tag" }});
	$( "#player-toggleIcons" ).button({text: false, icons: { primary: "ui-icon-circle-zoomout" }});
	$( "#player-toggleScale" ).button({text: false, icons: { primary: "ui-icon-arrow-2-e-w" }});

	$( "#player-line > button" ).attr( "disabled", "true" );

	startViewer();
});
