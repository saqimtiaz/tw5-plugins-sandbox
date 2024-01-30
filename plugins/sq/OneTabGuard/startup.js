/*\
title: $:/plugins/sq/OneTabGuard/startup.js
type: application/javascript
module-type: startup
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "one-tab-guard";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.before = ["story"];

exports.startup = function() {
	const url = new URL(window.location.toString());
	url.hash = "";

	const pingChannel = new BroadcastChannel(`OneTabGuard:${url.toString()}`);
	pingChannel.addEventListener("message", e => {
		if(e.data.type === "ping") {
			pingChannel.postMessage({
				type: "pong"
			});
		} else if(e.data.type === "pong") {
			$tw.modal.display("$:/plugins/sq/OneTabGuard/warning");
		}
	});
	pingChannel.postMessage({
		type: "ping"
	});
};


})();
