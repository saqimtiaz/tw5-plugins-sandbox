/*\
title: $:/plugins/astroport/lasertag/tag-on-import.js
type: application/javascript
module-type: startup
description: add $:/config/NewTiddler/Tags to imported Tiddlers
code-body: yes

\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	// Export name and synchronous status
	exports.name = "tagonimport";
	exports.platforms = ["browser"];
	exports.after = ["startup"];

	exports.startup = function() {

		$tw.hooks.addHook('th-importing-tiddler', function (tiddler) {


			let defaultTags = $tw.wiki.getTiddlerList("$:/config/NewTiddler/Tags", "text")
			
			var updatedTiddler = $tw.utils.updateTiddler({
				tiddler: tiddler,
				addTags: defaultTags
			})

			return updatedTiddler;

		});

	};

})();
