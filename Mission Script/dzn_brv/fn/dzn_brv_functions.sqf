

dzn_brv_getCoreMetadata = {
	// Return basic misison Metadata
	diag_log format [
		'<AAR><meta><core>{ "island": "%1", "name": "%2" }</core></meta></AAR>'
		,worldName
		,briefingName	
	];
};

dzn_brv_collectMetadata = {	
	private["_units","_vehs","_name"];
	
	_units = [allUnits, {!(_x in dzn_brv_unitList)}] call BIS_fnc_conditionalSelect;	
	{
		diag_log format [
			'<AAR><meta><unit>{ "unitMeta": [%1,"%2","%3",%4] }</unit></meta></AAR>'
			, dzn_brv_unitIdMax
			, if (isPlayer _x) then { name _x } else { "" }
			, switch (side _x) do {
				case WEST: {"blufor"};
				case EAST: {"opfor"};
				case RESISTANCE: {"indep"};
				case CIVILIAN: {"civ"};
				default { "unknown" };
			}
			, if (isPlayer _x) then { 1 } else { 0 }
		];
		
		_x setVariable ["dzn_brv_id", dzn_brv_unitIdMax];
		_x setVariable ["dzn_brv_type", "unit"];
		_x call dzn_brv_addAttackEH;
		
		dzn_brv_unitIdMax = dzn_brv_unitIdMax + 1;
		dzn_brv_unitList pushBack _x;
	} forEach _units;
	
	_vehs = [vehicles, { !(_x in dzn_brv_vehList) && !(typeOf _x in ["Ground"])}] call BIS_fnc_conditionalSelect;
	{
		_name = format [
			"%1%2"			
			, roleDescription _x			
			, if (roleDescription _x == "") then { 
				getText (configFile >> "CfgVehicles" >> typeOf _x >> "displayname")
			} else {
				" ("+(getText (configFile >> "CfgVehicles" >> typeOf _x >> "displayname"))+")"
			}
		];
		
		diag_log format [
			'<AAR><meta><veh>{ "vehMeta": [%1,"%2"] }</veh></meta></AAR>'
			, dzn_brv_vehIdMax
			, _name		
		];
	
		_x setVariable ["dzn_brv_id", dzn_brv_vehIdMax];
		_x setVariable ["dzn_brv_type", "veh"];
		
		dzn_brv_vehIdMax = dzn_brv_vehIdMax + 1;
		dzn_brv_vehList pushBack _x;
	} forEach _vehs;
};


dzn_brv_updateTimeLabel = {
	dzn_brv_timeLabel = dzn_brv_timeLabel + 1;
};

dzn_brv_collectData = {
	params["_unit","_timelabel"];
	private["_id","_pos","_posx","_posy","_dir","_alive","_vehID"];
	
	_id = _unit getVariable "dzn_brv_id";
	_pos = getPosASL _unit;
	_posx = round(_pos select 0);
	_posy = round(_pos select 1);
	_dir = round(getDir _unit);
	_alive = if (alive _unit) then { 1 } else { 0 };	
	
	if (_unit getVariable "dzn_brv_type" == "unit") then {
		_vehID = -1;
		if (vehicle _unit != _unit && { (vehicle _unit) getVariable ["dzn_brv_id", -1] > -1 }) then {
			_posx = 0;
			_posy = 0;
			_dir = 0;
			_vehID = (vehicle _unit) getVariable "dzn_brv_id";
		};
	
		diag_log format [
			'<AAR><%1><unit>[%2,%3,%4,%5,%6,%7]</unit></%1></AAR>'
			,_timelabel
			,_id
			,_posx
			,_posy
			,_dir
			,_alive
			,_vehID
		];
	} else {
		_crewData = _unit call dzn_brv_getVehiceCargoAndOwnerId;
		diag_log format [
			'<AAR><%1><veh>[%2,%3,%4,%5,%6,%7,%8]</veh></%1></AAR>'
			,_timelabel
			,_id
			,_posx
			,_posy
			,_dir
			,_alive
			,_crewData select 0
			,_crewData select 1
		];	
	};
};

dzn_brv_getVehiceCargoAndOwnerId = {
	// @Vehicle call dzn_brv_getVehiceOwnerId
	params["_veh"];
	private["_crew","_ownerID","_cargo"];
	
	_crew = crew _veh;
	if ((crew _veh) isEqualTo []) exitWith { [-1, -1] };
	
	_ownerID = (_crew select 0) getVariable ["dzn_brv_id",-1];	
	_cargo = ({alive _x} count (_crew)) - 1;
	if (_cargo == 0) then { _cargo = -1 };
	
	[_ownerID, _cargo]
};

dzn_brv_collectUnitsData = {
	// @IsPlayerOnly spawn dzn_brv_collectUnitsData
	// MAY BE USEFUL TO CALL THIS STUFF... BUT IT MAY BE HEAVY IMPACT ON PERFORMANCE
	
	params["_isPlayerOnly",["_timelabel",0]];
	private["_units"];
	
	_units = if (_isPlayerOnly) then {
		allPlayers - entities "HeadlessClient_F"
	} else {
		dzn_brv_unitList + dzn_brv_vehList
	};
	
	{
		[_x,_timelabel] call dzn_brv_collectData;
	} forEach _units;
};

dzn_brv_addAttackEH = {
	_this addEventHandler [
		"Fired"
		, {
			if (!isNil { (_this select 0) getVariable format ["dzn_brv_av%1", dzn_brv_timeLabel] }) exitWith {};
			(_this select 0) setVariable [ format ["dzn_brv_av%1", dzn_brv_timeLabel], true ];
			
			[ _this select 0, _this select 6, dzn_brv_timeLabel ] spawn {
				params["_unit", "_proj", "_timelabel"];
				private ["_from", "_to", "_dist"];
				
				_from = getPosASL _unit;
				_to = getPosASL _proj;
				_dist = 0;
				waitUntil {
					if !(isNull _proj) then { 
						_to = getPosASL _proj;
						_dist = _from distance2d _to;
					};
					isNull _proj || { _dist > dzn_brv_attackVectorMaxDistance }
				};
				
				diag_log format [
					"<AAR><%1><av>[%2,%3,%4,%5]</av></%1></AAR>"
					, _timelabel
					, round(_from select 0)
					, round(_from select 1)
					, round(_to select 0)
					, round(_to select 1)
				];
				
				waitUntil { dzn_brv_timeLabel > (_timelabel + 2) };				
				_unit setVariable [ format ["dzn_brv_av%1", _timelabel], nil ];
			};
		}
	];
};
