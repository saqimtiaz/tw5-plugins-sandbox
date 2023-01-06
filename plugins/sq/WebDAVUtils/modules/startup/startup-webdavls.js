/*\
title: $:/plugins/sq/webdav-utils/startup-webdavls.js
type: application/javascript
module-type: startup
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "webav-ls";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.before = ["story"];

exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-webdav-ls",function(event) {
		var options = {
			"tiddlerTitlePrefix" : event.paramObject["tiddlerTitlePrefix"] || "$:/temp/webdav/filesystem",
			"depth": event.paramObject["depth"] || "1"
		};
		indexDirectory(event.param,options);
	});
};

async function indexDirectory(root,options) {
	try {
		const response = await fetch(root,{
			"method": "PROPFIND",
			"headers": {
				"Depth": options.depth,
				"Content-Type": "text/xml"
			},
			"body": propfindXML
		})
		
		if(!response.ok) {
			var status = response.status,
				msg = `Network error: ${response.status}`;
			if(status === 401) { // authentication required
				msg = $tw.language.getString("Error/PutUnauthorized");
			} else if(status === 403) { // permission denied
				msg = $tw.language.getString("Error/PutForbidden");
			} else if(status === 404) {
				msg = "404: The directory does not exist";
			}			
			throw new Error(msg);
		} else {
			const xml = await response.text();
			const parser = new DOMParser(),
				xmlDOM = parser.parseFromString(xml,"text/xml"),
				nodes = Array.from(xmlDOM.getElementsByTagName("D:response"));
			let jsonData = {tiddlers: {}};
			nodes.forEach((item)=> {
				let href = item.getElementsByTagName("D:href")[0].textContent,
					uri = item.getElementsByTagName("D:href")[0].textContent,
					type = item.getElementsByTagName("D:collection").length ? "directory" : "file";
				//jsonData[uri] = type;
				jsonData.tiddlers[uri] = Object.create(null);
				jsonData.tiddlers[uri].title = uri;
				jsonData.tiddlers[uri]["item-type"] = type;
				jsonData.tiddlers[uri]["text"] = "";
			});
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: `${options.tiddlerTitlePrefix}/directory${root === "/" ? "/root/" : root}`,
				text : JSON.stringify(jsonData),
				type: "application/json"
			}));	
			
		}
	} catch(err) {
		//console.log(err);
		if(!$tw.webdavlslogger) {
			$tw.webdavlslogger = new $tw.utils.Logger("WebDAV-LS");
		}
		$tw.webdavlslogger.alert(`<p><strong>Error: Could not retrieve the contents of the directory ${root}.</strong></p><p>${err.message}</p>`);
	}
};

const propfindXML = `<propfind xmlns="DAV:">
  <prop>
    <resourcetype xmlns="DAV:"/>
  </prop>
</propfind>`;

})();


/*
http://www.webdav.org/specs/rfc4918.html#METHOD_PROPFIND
<getlastmodified xmlns="DAV:"/>
<getcontentlength xmlns="DAV:"/>
<executable xmlns="http://apache.org/dav/props/"/>
*/
