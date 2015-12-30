var eStyle = {
	"headerStatus": {
		"default": {
			"text": "Open RPT file to convert...",
			"bgColor": "#5a5a5a"			
		},
		"success": {
			"text": "Choose report from the list to convert!",
			"bgColor": "rgb(155, 195, 78)"
		},
		"failedEmpty": {
			"text": "File is empty/Failed to read!",
			"bgColor": "#AF4E4E"
		},
		"failedWrong": {
			"text": "File does not contain AAR data!",
			"bgColor": "#AF4E4E"
		}
	}
};

var statusElement = {
	"text": "#header-status-text",
	"bar": "#header-status"
};

	
var rptData = "";
var reportGuid = "";
var aarData;

function updateHeaderStatus(mode) {
	switch (mode) {
		case "default": 
			$( statusElement.text ).html( eStyle.headerStatus.default.text );
			$( statusElement.bar ).css( "background-color",  eStyle.headerStatus.default.bgColor )
			break;
		case "success":
			$( statusElement.text ).html( eStyle.headerStatus.success.text );
			$( statusElement.bar ).css( "background-color", eStyle.headerStatus.success.bgColor );	
			break;
		case "failedEmpty":
			$( statusElement.text ).html( eStyle.headerStatus.failedEmpty.text );
			$( statusElement.bar ).css( "background-color", eStyle.headerStatus.failedEmpty.bgColor );
			break;
		case "failedWrong":
			$( statusElement.text ).html( eStyle.headerStatus.failedWrong.text );
			$( statusElement.bar ).css( "background-color", eStyle.headerStatus.failedWrong.bgColor );
			break;
	}	
}

function resetForm() {
	$( "#result-form" ).css( "top", "-1000px" );
	$( "#mission-desc" ).val("");
	$( "#mission-date" ).val("");
	$( "#output" ).val("");
	
	$( "#report-selector" ).css( "top", "-1000px" );
	$( "#report-selector > ul" ).html( "" );
	
	updateHeaderStatus( "default" );
	
	rptData = "";
	reportGuid = "";
	aarData = [];
}

// Open file
var openFile = function(event) { 
	resetForm();
	
	var input = event.target; 
	var reader = new FileReader(); 
	reader.onload = function(){ 
		var text = reader.result;
		rptData = text;
		if (text.length > 0) {
			console.log( "Read!");

			var listOfDirtyMetadata = rptData.match( /(.*)<AAR-.*><meta><core>(.*)<\/core><\/meta><\/AAR-.*>/ig);			
			if ( listOfDirtyMetadata ) {
				var listOfMetadata = [];
				for (var i = 0; i < listOfDirtyMetadata.length; i++) {
					var parsedMeta = listOfDirtyMetadata[i].match( /(.*)<AAR-.*><meta><core>(.*)<\/core><\/meta><\/AAR-.*>/i);
					var meta = JSON.parse( parsedMeta[2] )
					meta.logTime = parsedMeta[1].slice(0,-2);
					$( "#report-selector > ul" ).append(
						"<li onClick='chooseReportToConvert(\"" + meta.guid + "\"); '>" + meta.island + " ▸ " + meta.logTime + " ▸ " + meta.name + "</li>"
					);
				}
				
				updateHeaderStatus( "success" );
				$( "#report-selector" ).css( "top", "75px" );
			} else {
				console.log( "Not an AAR!" );
				updateHeaderStatus( "failedWrong" );
			}
		} else {
			console.log( "Empty!" );
			updateHeaderStatus( "failedEmpty" );
		}
	};
	reader.readAsText(input.files[0]);
};

function chooseReportToConvert(guid) {
	reportGuid = guid;
	
	$( "#report-selector > ul" ).html("");
	$( "#report-selector" ).css("top", "-1000px");
	convertInit();
};

function convertInit() {
	toggleProgressView(true);
	updateProgressView( "Converting...","Please, wait until conversion is over." );
	setTimeout( convertToAAR, 500 );
}

function toggleProgressView(on) {
	$( "#progress-header" ).html( "" );
	$( "#progress-status" ).html( "" );	
	if (on) {
		$( "#progress-viewer" ).css("top", "150px");
	} else {
		$( "#progress-viewer" ).css("top", "-1000px");
	}
}

function updateProgressView(header, text) {
	$( "#progress-header" ).html( header );
	$( "#progress-status" ).append( text + "<br />" );	
}

function convertToAAR() {
	console.log(reportGuid);
	
	aarData = {
		"metadata": {
			"island": "",
			"name": "",
			"time": 0,
			"date": "",
			"desc": "",
			"players": [],
			"objects": {
				"units": [],
				"vehs": []					
			}
		},
		"timeline": []
	};
	
	var consoleMsgEnabled = true;
	var consoleDebugEnabled = false;
	function logMsg(t) { if (consoleMsgEnabled) { console.log( t ) }};
	function logDebug(t) { if (consoleDebugEnabled) { console.log( t ) }};
	
	var re = new RegExp( "<AAR-" + reportGuid + ">.*<\/AAR-" + reportGuid + ">", "g" )
	var rptItems = rptData.match( re );
	var metadataCore = JSON.parse( ( rptItems[0].match( /(<core>)(.*)(<\/core>)/i) )[2] ); 
	
	logMsg( "Metadata: Core [ Processing ]" );
	aarData.metadata.island = metadataCore.island;
	aarData.metadata.name = metadataCore.name;
	logMsg( "Metadata: Core [ OK ]" );
	
	logMsg( "Objects [ Processing ]" );
	for (var i = 0; i < rptItems.length; i++) {		
		try {
			var u = JSON.parse( rptItems[i].match( /(<meta><veh>)(.*)(<\/veh><\/meta>)/i )[2] );
			(aarData.metadata.objects.vehs).push(u.vehMeta);
			continue;
		} catch(e) {};
		
		try {
			var u = JSON.parse( rptItems[i].match( /(<meta><unit>)(.*)(<\/unit><\/meta>)/i )[2] );
			(aarData.metadata.objects.units).push(u.unitMeta);
			if (u.unitMeta[3] > 0) {
				(aarData.metadata.players).push( [u.unitMeta[1],u.unitMeta[2]] );
			}
			continue;
		} catch(e) {};
		
		try {
			var timelabel = rptItems[i].match( /(<)(\d+)(>)/i)[2];
			var unittype = rptItems[i].match( /(<unit>|<veh>|<av>)(.*)(<\/unit>|<\/veh>|<\/av>)/i )[1];
			var unitdata = rptItems[i].match( /(<unit>|<veh>|<av>)(.*)(<\/unit>|<\/veh>|<\/av>)/i )[2];
			
			if (typeof (aarData.timeline[timelabel]) == "undefined") {
				aarData.timeline[timelabel] = [ [], [], [] ];
			}

			switch (unittype) {
				case "<unit>": 
					(aarData.timeline[timelabel])[0].push( JSON.parse(unitdata) );
					break;
				case "<veh>":
					(aarData.timeline[timelabel])[1].push( JSON.parse(unitdata) );
					break;
				case "<av>":
					(aarData.timeline[timelabel])[2].push( JSON.parse(unitdata) );
					break;
			};
			
			continue;
		} catch(e) {};
	};
	
	logMsg( "Objects [ OK ]" );
	
	logMsg( "Timeline: Interpolating Transitions of Units [ Processing ]" );
	/*
		For each UNIT check all timelines.
			If there are no data for timeline 
			- select last time when data exists then find time when data exists next (or end of time)
			- then for each time between last known and latest time - calculate/interpolate values of position
			- add this data to timeline
			- check for another range	
	*/	
	for (var m = 0; m < 2; m++) {		
		var unitList, unitTypeId;

		if (m == 0) {
			unitList = aarData.metadata.objects.units;
			unitTypeId = 0;
		} else {			
			unitList = aarData.metadata.objects.vehs;
			unitTypeId = 1;
		}		
		
		for (var i = 0; i < unitList.length; i++ ) {
			var unitId = unitList[i][0];			
			logDebug("INTERPOLATION FOR UNIT " + unitId);

			var lastKnownTimestamp = 0;
			var lastKnown = [];
			var actualKnownTimestamp = 0;
			var actualKnown = [];
			var stepsToInterpolate = [];
			
			// **************
			// Looks like if we start to seek for timeframes not from 0 - it will easily avoid interpolation of afterspawned units
			// But it will cause few second of lag of bots, but who carse
			// ***********
			// For each Second
			for (var j = 1; j < aarData.timeline.length; j++) {
				// For each Unit per Timeline item
				for (var k = 0; k < aarData.timeline[j][unitTypeId].length; k++) {
					if (aarData.timeline[j][unitTypeId][k][0] == unitId || j == (aarData.timeline.length - 1)) {
						logDebug("Time " + j + " unit data is here! " + aarData.timeline[j][unitTypeId][k]);

						if (lastKnown.length == 0) {
							logDebug("Start of Interpol Range");
							lastKnown = aarData.timeline[j][unitTypeId][k];
							lastKnownTimestamp = j;
						} else {
							if (actualKnown.length == 0) {
								logDebug("End of Interpol Range");
								actualKnown = aarData.timeline[j][unitTypeId][k];
								actualKnownTimestamp = j;
							}
						}
					}
				}
	
				if (lastKnown.length > 0 && actualKnown.length == 0) {
					logDebug("Adding time to empty");
					stepsToInterpolate.push(j);
				} else {
					if (lastKnown.length > 0 && actualKnown.length > 0 && (  lastKnownTimestamp != actualKnownTimestamp ) ) {
						logDebug("Interpolation ( @" + lastKnown[1] + ", @" + actualKnown[1] + ", @" + stepsToInterpolate.length + ")");

						var posxSteps = interpolateValues( lastKnown[1], actualKnown[1], stepsToInterpolate.length );
						var posySteps = interpolateValues( lastKnown[2], actualKnown[2], stepsToInterpolate.length );
						var dirSteps = lastKnown[3];
						//var dirSteps = interpolateValues( lastKnown[3], actualKnown[3], stepsToInterpolate.length );

						logDebug("Interpolation... | X: " + posxSteps + " || Y: " + posySteps + " || DIR: " + dirSteps);								
						// Start with 1, because 0 is equal to lastKnown value and we may not update it
						for (var l = 1; l < stepsToInterpolate.length; l++ ) {
							logDebug( "Time (" + stepsToInterpolate[l] + ")" + [unitId, posxSteps[l], posySteps[l], dirSteps, lastKnown[4], lastKnown[5] ] );
							if (m == 0) {
								( aarData.timeline[stepsToInterpolate[l]][unitTypeId] ).push( [unitId, posxSteps[l], posySteps[l], dirSteps, lastKnown[4], lastKnown[5]]  );
							} else {
								( aarData.timeline[stepsToInterpolate[l]][unitTypeId] ).push( [unitId, posxSteps[l], posySteps[l], dirSteps, lastKnown[4], lastKnown[5], lastKnown[6]]  );
							}
						}
						
						lastKnown = [];
						actualKnown = [];
						stepsToInterpolate = [];								
						// Step back to get new start interpolation range
						j = j - 1;
					}
				}
			}
		}
	}
	
	aarData.metadata.time = (aarData.timeline).length - 2;
	
	logMsg( "Timeline: Interpolating Transitions of Units [ OK ]" );

	logMsg( "Creating form" );
	$( "#player-list" ).html( "" );
	$( "#mission-name" ).val( aarData.metadata.name );
	$( "#mission-island" ).val( aarData.metadata.island );
	$( "#mission-time" ).html( getTimeLabel(aarData.metadata.time) );
	
	for (var i = 0; i < aarData.metadata.players.length; i++) {
		var color;
		switch (aarData.metadata.players[i][1]) {
			case "blufor": color = "RGB(0,77,152)"; break;
			case "opfor": color = "RGB(127,0,0)"; break;
			case "indep": color = "RGB(0,127,0)"; break;
			case "civ": color = "RGB(102,0,127)"; break;
		};
		$( "#player-list" ).append( "<li class='player-side-icon' style='padding: 2px 4px; background-color: " + color + "'>" + aarData.metadata.players[i][0] + "</li>" );				
	}
	
	logMsg("Done!");
	toggleProgressView(false);
	$( "#result-form" ).css( "top", "75px" );
	$( "#header-status-text" ).html( "Converted!" );
	$( ".dl-2 > input, textarea" ).removeAttr( "disabled" );
};

// Interpolate values
function interpolateValues(min,max,steps) {
	var output = [];
	var delta = (max - min)/steps;
	for (var i = 0; i < steps; i++) { output.push( Math.round( min + i*delta ) ); }

	return output			
}
			
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

// Generate
function generateAAR() {			
	aarData.metadata.date = $( "#mission-date" ).val();
	aarData.metadata.desc = $( "#mission-desc" ).val();
	aarData.metadata.island = $( "#mission-island" ).val();
	aarData.metadata.name = $( "#mission-name" ).val();
	console.log( "AAR text generated.");
}

function saveGeneratedAARData() {
	generateAAR();
	toggleProgressView(true);
	updateProgressView("Saving", "Wait until AAR file will be generated.")
	
	setTimeout ( saveAARFile, 500, JSON.stringify( aarData ) )
	//saveAARFile( JSON.stringify( aarData ) );				
}

function saveAARFile(data) {	
    var a = document.createElement("a");
    var file = new Blob([data], {type: "text/plain"});
    a.href = URL.createObjectURL(file);
    a.download = "[AAR][" + aarData.metadata.island + "] " + aarData.metadata.name;
    a.click();
	
	toggleProgressView(false);
}

$( document ).ready(function() {
	$( ".dl-2 > input, textarea, button" ).attr( "disabled", "true" );
	resetForm();
});
