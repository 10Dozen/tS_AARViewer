dzn_brv_fnc_sendAttackVectorData = {
	params ["_from","_to","_timelabel"];
	
	[
		_timelabel
		, round(_from # 0)
		, round(_from # 1)
		, round(_to # 0)
		, round(_to # 1)
	] remoteExecCall ["dzn_brv_logAV",2];
};

dzn_brv_fnc_trackProjectile = {
	params ["_unit", "_proj", "_timelabel"];
	private _from = getPosASL _unit;
	private _to = [];
	
	waitUntil {
		if (isNull _proj) exitWith { true };
		_to = getPosASL _proj;
		false
	};
	
	waitUntil { (call dzn_brv_getLogTime) > (_timelabel + 2) };
	
	_unit setVariable [format ["dzn_brv_av%1", _timelabel], nil];
	[_from, _to, _timelabel] call dzn_brv_fnc_sendAttackVectorData;
};

dzn_brv_fnc_addFiredEH = {
	params ["_unit"];
	_unit addEventHandler ["FiredMan", {
		if (dzn_brv_finished) exitWith {};
		params ["_unit", "_weapon", "", "", "", "", "_proj", "_veh"];
		
		private _logTime = call dzn_brv_getLogTime;
		if (!isNil { _unit getVariable format ["dzn_brv_av%1", _logTime] }) exitWith {};
		_unit setVariable [format ["dzn_brv_av%1", _logTime], true];

		[_unit, _proj, _logTime] spawn dzn_brv_fnc_trackProjectile;
	}];
};