/*\
title: $:/plugins/astroport/IPFSSaver/startup.js
type: application/javascript
module-type: startup

Initialisation du plugin IPFSSaver avancé

\*/
(function(){

"use strict";

exports.name = "ipfs-saver-init";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
    $tw.ipfsSaver = new $tw.modules.createModule("$:/plugins/astroport/IPFSSaver/IPFSSaver.js").IPFSSaver();

    if (!$tw.wiki.tiddlerExists("$:/plugins/astroport/IPFSSaver/Config")) {
        $tw.wiki.addTiddler({
            title: "$:/plugins/astroport/IPFSSaver/Config",
            text: JSON.stringify({
                ipfsServerAddress: "http://localhost:5001",
                ipnsKeyName: "self",
                maxCacheSize: "50MB",
                cacheExpiration: "1h",
                autoPinning: "no"
            }),
            type: "application/json"
        });
    }

    $tw.hooks.addHook("th-saving-tiddler", function(tiddler) {
        $tw.ipfsSaver.saveToMFS(tiddler.fields.text, `/tiddlers/${tiddler.fields.title}`);
    });
};

})();
