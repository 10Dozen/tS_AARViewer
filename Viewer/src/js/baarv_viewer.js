			var aarData = {};
			var aarCurrentTime = 0;
			var aarPlaying = false;
			var aarAutoStepper;
			var aarMapSize = [];
			
			// Open file
			var openFile = function(event) {
				$( "#result-form" ).css( "top", "-1000px" );	
				$( "#header-status > label" ).html( "Opening..." );
				$( "#header-status > button" ).attr( "disabled", "true" );
				
				var input = event.target; 

				var reader = new FileReader(); 
				reader.onload = function(){ 
					var text = reader.result;
					try {
						aarData = JSON.parse(text);
						console.log("Parsed!");
						
						// Detail screen						
						$( "#header-status > label" ).html( "Opened!" );
						$( "#header-status" ).css( "background-color", "#9BC34E");
						$( "#header-status > label" ).html( "Click 'Play' to start!" );
						$( "#header-status > button" ).removeAttr( "disabled" );
						showAARDetails();
						
					} catch (e) {
						console.log("Error occured during parsing!");
						$( "#header-status > label" ).html( "File is not AAR file!" );
						$( "#header-status" ).css( "background-color", "#b30000");
					}
				};				
				reader.readAsText(input.files[0]);
			};
			
			function showAARDetails() {
				$( "#result-form" ).css( "top", "50px" );				
				$( "#mission-name > h1" ).html( aarData.metadata.name );
				$( "#mission-island" ).html( aarData.metadata.island );
				$( "#mission-date" ).html( aarData.metadata.date );
				$( "#mission-time" ).html( getTimeLabel( aarData.metadata.time ) );
				$( "#mission-desc" ).html( aarData.metadata.desc );
				$( "#player-list" ).html(
					(function (){
						var output = "";
						for (var i = 0; i < aarData.metadata.players.length; i++) {
							var color;
							switch (aarData.metadata.players[i][1]) {
								case "blufor": color = "RGB(0,77,152)"; break;
								case "opfor": color = "RGB(127,0,0)"; break;
								case "indep": color = "RGB(0,127,0)"; break;
								case "civ": color = "RGB(102,0,127)"; break;
							};
							output = output + "<li class='player-side-icon' style='padding: 2px 4px; background-color: " + color + "'>" + aarData.metadata.players[i][0] + "</li>";				
							}
						return (output)
					})()
				);
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
				var icon = "src/icons/" + side + "_" + type + ".svg";
				$( ".panzoom" ).append( "<div id='mrk-unit-" + id + "' class='unit-marker'><img class='icn' dir='0' src='" + icon + "' /><span>" + name + "</span></div>" );
			}
			
			// Init AAR
			function initAAR() {				
				$( "#result-form" ).remove();
				$( "#header" ).remove();
				
				$( "#player-step" ).html( "<span>0 s</span> / " + getTimeLabel(aarData.metadata.time) );
				$( "#slider").slider( "option", "max", aarData.metadata.time );
				$( "#player-line" ).css( "top", "12px" );
				
				var bgImg = "";
				switch (aarData.metadata.island.toLowerCase()) {
					case "stratis": bgImg = "src/maps/map_stratis_8192.png"; aarMapSize = [8132, 8132]; break;
					//default: bgImg = "src/img/map_stratis_8192.png";
				}				
				$( ".panzoom > img" ).attr( "src", bgImg );				
				panzoomInit();
				
				// Spawn			
				// Spawn Units
				var units = aarData.metadata.objects.units;
				for (var i = 0; i < units.length; i++) {
					createObject( units[i], "unit" );
				}
				
				// Spawn Vehicles
				var vehs = aarData.metadata.objects.vehs;
				for (var i = 0; i < vehs.length; i++) {
					createObject( vehs[i], "veh" );
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
			
			// Process unit - animate
			function processUnit(data,type) {
				// 0: unit/vehicle data
				// 1: "unit" or "veh"
				var id = data[0];				
				var unit = "#mrk-unit-" + id;
				
				console.log( data );
				console.log( $( unit ) );
				
				var posx = data[1] - ( $( unit ).outerWidth() /2 );				
				var posy = aarMapSize[1] 
					- data[2] 
					+ $( "#mrk-unit-" + id + " > span" ).outerHeight()
					+ 0.5 * ( $( unit ).outerHeight() - $( "#mrk-unit-" + id + " > span" ).outerHeight() );
				var dir = data[3];
				var alive = data[4];
				
				console.log ( posx + " | " + posy  );
				
				
				var inCargo, owner, cargo
				if (type == "unit") {
					inCargo = data[5];				
					if (inCargo == -1) {
						$( unit ).css({ "left": posx, "top": posy });
						$( unit + " > img" ).rotate( dir );
					} else {
						$( unit ).css({ "left": "-20px","top": "-20px" });
					}
				} else {
					owner = data[5];
					cargo = data[6];
					$( unit ).css({ "left": posx, "top": posy });
					$( unit + " > img" ).rotate( dir );
				}
			};
			
			// Play AAR frame (1 second)
			function playReportStep (step) {
				var units = aarData.timeline[step][0];
				var vehs = aarData.timeline[step][1];
				var attacks = aarData.timeline[step][2];
				
				for (var i = 0; i < units.length; i++) {					
					processUnit( units[i], "unit" );
				};
				for (var i = 0; i < vehs.length; i++) {
					processUnit( vehs[i], "veh" );
				};			
			};
			
			// Play AAR in auto mode
			function playReportAuto () {
				if (!aarPlaying) {
					console.log( "Player: Playing" );
					var aarPlaySpeed = $( "#player-speed" ).val()
					aarAutoStepper = setInterval(
						function () {
							if (aarCurrentTime != aarData.metadata.time) {							
								reportNextStep()
							} else {
								clearInterval( aarAutoStepper );
								stopReport()
							}
						}
						, 2000/aarPlaySpeed
					);
				} else {
					console.log( "Player: Stop" );
					stopReport();
				}			
			};
			
			function stopReport() {
				aarPlaying = false;
				setPauseButtonIcon();
				console.log( "Player: Stopped" );
				clearInterval( aarAutoStepper );
			};
			
			function reportNextStep () {
				if ( aarCurrentTime + 1 <= aarData.metadata.time ) {
					console.log( "Player: Next step -- " + (aarCurrentTime + 1) + " second" );
					aarCurrentTime = aarCurrentTime + 1;
					$( "#slider" ).slider({ value: aarCurrentTime });
					$( "#player-step > span" ).html( getTimeLabel(aarCurrentTime) );
					playReportStep ( aarCurrentTime );
				}
			};
			
			function reportPrevStep () {
				if ( aarCurrentTime - 1 >= 0 ) {
					console.log( "Player: Prev step -- " + (aarCurrentTime - 1) + " second" );
					aarCurrentTime = aarCurrentTime - 1;
					$( "#slider" ).slider({ value: aarCurrentTime });
					$( "#player-step > span" ).html( getTimeLabel(aarCurrentTime) );
					playReportStep ( aarCurrentTime );
				}			
			};
		
			function setPauseButtonIcon() {
				$( "#player-step-play" ).button( "option", {label: "play",icons: {primary: "ui-icon-play"} });
			}
