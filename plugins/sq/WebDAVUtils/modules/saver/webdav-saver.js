/*\
title: $:/plugins/sq/webdav-utils/webdav-saver.js
type: application/javascript
module-type: saver

Saves to Webdav and creates a backup

\*/
(function(){


/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

const createPath = require("$:/plugins/sq/webdav-utils/createPath.js").createPath;

/*
Retrieve ETag if available
*/
var retrieveETag = function(self) {
	var headers = {
		Accept: "*/*;charset=UTF-8"
	};
	$tw.utils.httpRequest({
		url: self.uri(),
		type: "HEAD",
		headers: headers,
		callback: function(err,data,xhr) {
			if(err) {
				return;
			}
			var etag = xhr.getResponseHeader("ETag");
			if(!etag) {
				return;
			}
			self.etag = etag.replace(/^W\//,"");
		}
	});
};


/*
Select the appropriate saver module and set it up
*/
var WebDAVSaver = function(wiki) {
	this.wiki = wiki;
	var self = this;
	var uri = this.uri();
	// Async server probe. Until probe finishes, save will fail fast
	// See also https://github.com/Jermolene/TiddlyWiki5/issues/2276
	$tw.utils.httpRequest({
		url: uri,
		type: "OPTIONS",
		callback: function(err,data,xhr) {
			// Check DAV header http://www.webdav.org/specs/rfc2518.html#rfc.section.9.1
			if(!err) {
				self.serverAcceptsPuts = xhr.status === 200 && !!xhr.getResponseHeader("dav");
			}
		}
	});
	retrieveETag(this);
};

WebDAVSaver.prototype.uri = function() {
	var uri = document.location.toString().split("#")[0];
	// if the uri does not end in a filename
	if(uri.split("/").pop().indexOf(".") === -1) {
		//add a trailing slash if needed and a filename
		uri = `${uri}${(/\/$/.test(uri)) ? "" : "/"}index.html`;
	}
	return uri;
};



/*
backupConfig tiddler:

\define filename() abc.html

\backups\<<filename>>_backups\<<filename>>-<<now YYYY0MM0DD0hh0mm0ssXXX>>.html

*/
function getBackupPath(filename,configTiddler) {
	var wikifyParser = $tw.wiki.parseText("text/vnd.tiddlywiki",$tw.wiki.getTiddlerText(configTiddler,""),{
			parseAsInline: true
		});
	// Create the widget tree 
	var wikifyWidgetNode = $tw.wiki.makeWidget(wikifyParser,{
			document: $tw.fakeDocument,
			parentWidget: $tw.rootWidget,
			variables: {
				"filename": filename,
				"filebasename": filename.substr(0,filename.lastIndexOf('.'))
			}
		});
	// Render the widget tree to the container
	var wikifyContainer = $tw.fakeDocument.createElement("div");
	wikifyWidgetNode.render(wikifyContainer,null);
	var wikifyResult = wikifyContainer.textContent;
	return wikifyResult;
};


WebDAVSaver.prototype.saveBackup = async function(pathInfo) {
	//check if the backup directory exists, if not then create it
	try {
//		await createPath(pathInfo.backupFileDirectory);
		await createPath(`${new URL(pathInfo.backupFileDirectory,pathInfo.serverURI)}`)
	} catch(err) {
		const errorMessage = `Error creating or confirming that backup directory exists: ${pathInfo.backupFileDirectory}. Details: ${err.message}`;
		this.logger.log(errorMessage);
		throw new Error(errorMessage);
		//return;
	}

	//create the backup file
	const backupResponse = await fetch(this.uri(),{
		method: "COPY",
		headers: {
			'Destination': `${new URL(pathInfo.backupFilePath,pathInfo.serverURI)}`
		}
	})
	if(!backupResponse.ok) {
		const message = `Error saving backup ${backupResponse.status}`;
		this.logger.log(message, backupResponse);
		throw new Error(message);
		//return;
	}
	this.logger.log(`Backup saved: ${pathInfo.backupFilePath}`);
};

// TODO: in case of edit conflict
// Prompt: Do you want to save over this? Y/N
// Merging would be ideal, and may be possible using future generic merge flow
WebDAVSaver.prototype.save = async function(text,method,callback) {
	if(!this.serverAcceptsPuts) {
		return false;
	}
	if(!this.logger) {
		this.logger = new $tw.utils.Logger("WebDAVSaver");
	}
	var self = this,
		headers = {
			"Content-Type": "text/html;charset=UTF-8"
		},
		pathInfo = Object.create(null);
	if(this.etag) {
		headers["If-Match"] = this.etag;
	}
	const doBackup = $tw.wiki.getTiddlerText("$:/config/webdav/enableBackups","yes") === "yes";
	if(doBackup) {
		// TODO? replace all \ with /
		pathInfo.filename = this.uri().split("/").pop() || "index.html";
		pathInfo.basename = pathInfo.filename.substr(0,pathInfo.filename.lastIndexOf('.'));
		pathInfo.serverURI = this.uri().replace(/\/[^\/]+?\.[^\/]+?$/, '/');
		pathInfo.backupFilePath = getBackupPath(pathInfo.filename,"$:/config/webdav/backupPath");
		pathInfo.backupFileDirectory = pathInfo.backupFilePath.substring(0,pathInfo.backupFilePath.lastIndexOf("/"));
		
		//save backup
		try {
			await this.saveBackup(pathInfo);
		} catch(err) {
			this.logger.alert(`<p><strong>Error: Could not save backup to ${pathInfo.backupFilePath}.</strong></p><p>${err.message}</p>`);
		}		
	}

	$tw.notifier.display("$:/language/Notifications/Save/Starting");

	//save the wiki, we save even if the backup failed
	$tw.utils.httpRequest({
		url: this.uri(),
		type: "PUT",
		headers: headers,
		data: text,
		callback: function(err,data,xhr) {
			if(err) {
				var status = xhr.status,
					errorMsg = err;
				if(status === 412) { // file changed on server
					errorMsg = $tw.language.getString("Error/PutEditConflict");
				} else if(status === 401) { // authentication required
					errorMsg = $tw.language.getString("Error/PutUnauthorized");
				} else if(status === 403) { // permission denied
					errorMsg = $tw.language.getString("Error/PutForbidden");
				}
				if (xhr.responseText) {
					// treat any server response like a plain text error explanation
					errorMsg = errorMsg + "\n\n" + xhr.responseText;
				}
				callback(errorMsg); // fail
			} else {
				self.etag = xhr.getResponseHeader("ETag");
				if(self.etag == null) {
					retrieveETag(self);
				}
				callback(null); // success
			}
		}
	});
	return true;
};

/*
Information about this saver
*/
WebDAVSaver.prototype.info = {
	name: "webdav",
	priority: 2001,
	capabilities: ["save","autosave"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return /^https?:/.test(location.protocol);
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new WebDAVSaver(wiki);
};

})();
