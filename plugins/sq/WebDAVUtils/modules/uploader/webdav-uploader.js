/*\
title: $:/plugins/sq/webdav-utils/uploader.js
type: application/javascript
module-type: uploader

Uploads to Webdav

\*/
(function(){


/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "webdav";

exports.create = function(params) {
	return new WebDAV(params);
};

const createPath = require("$:/plugins/sq/webdav-utils/createPath.js").createPath;
const getUploadPath = require("$:/plugins/sq/webdav-utils/getUploadPath.js").getUploadPath;

function WebDAV(params) {
	this.params = params || {};
	this.items = [];
	this.logger = new $tw.utils.Logger("webdav-uploader");
	this.logger.log("",params);
};

WebDAV.prototype.initialize = function(callback) {
	this.logger.log("uploader initialize");
	callback();
};

WebDAV.prototype._getCanonicalURI = function(uploadItem) {
	return encodeURI(getUploadPath(uploadItem.title,"$:/config/file-uploads/webdav/uploadPathFilters",{
		"wiki": $tw.wiki,
		"unique": ($tw.wiki.getTiddlerText("$:/config/file-uploads/webdav/generateUniqueURIs") === "yes") ? true : false
	}));
};

async function handleUploadFile(uploadItem,canonical_uri) {
	var self = this;
	const data = uploadItem.isBase64 ? uploadItem.getBlob() : uploadItem.text;
	try {
		await createPath(canonical_uri.substring(0,canonical_uri.lastIndexOf("/")));
	} catch(err) {
		const errorMessage = `Error creating or confirming that upload directory exists. Details: ${err.message}`;
		self.logger.log(errorMessage);
		throw new Error(errorMessage);
	}
	
	const response = await fetch(canonical_uri,{ 
		method: "PUT",
		body: data
	});
	if(!response.ok) {
		var status = response.status,
			msg = `Network error: ${response.status}`;
		if(status === 401) { // authentication required
			msg = $tw.language.getString("Error/PutUnauthorized");
		} else if(status === 403) { // permission denied
			msg = $tw.language.getString("Error/PutForbidden");
		} else if(status === 404) {
			msg = "404: The upload directory does not exist";
		}
		throw new Error(msg);
	}
}

/*
Arguments:
uploadItem: object of type UploadItem representing tiddler to be uploaded
callback accepts two arguments:
	err: error object if there was an error
	uploadItemInfo: object corresponding to the tiddler being uploaded with the following properties set:
	- title
	- canonical_uri (if available)
	- uploadComplete (boolean)
	- getUint8Array()
	- getBlob()
*/
WebDAV.prototype.uploadFile = function(uploadItem,callback) {
	var self = this,
		uploadInfo = {title: uploadItem.title},
		canonical_uri = this._getCanonicalURI(uploadItem);
	if(!canonical_uri) {
		self.logger.alert(`<p><strong>Error: Could not save file ${uploadItem.title}, no valid path filter available.</strong></p>`);
		callback(Error("No valid path filter available"),uploadInfo);
	}
	
	handleUploadFile(uploadItem,canonical_uri)
		.then(function(status){
			uploadInfo.canonical_uri = canonical_uri;
			self.logger.log(`Saved to ${uploadItem.filename} with canonical_uri ${canonical_uri}`);
			// Set updateProgress to true if the progress bar should be updated
			// For some uploaders where the data is just being added to the payload with no uploading taking place we may not want to update the progress bar
			uploadInfo.updateProgress = true;
			// Set uploadComplete to true if the uploaded file has been persisted and is available at the canonical_uri
			// This flag triggers the creation of a canonical_uri tiddler corresponding to the uploaded file
			// Here we set uploadComplete to false since with Fission the file uploaded will not be persisted until we call publish()
			uploadInfo.uploadComplete = true;
			callback(null,uploadInfo);
		}).catch(function(err){
			self.logger.alert(`<p><strong>Error: Could not save file ${uploadItem.filename} to ${canonical_uri}.</strong></p><p>${err.message}</p>`);
			callback(err,uploadInfo);
		});

};

/*
Arguments:
callback accepts two arguments:
	status: true if there was no error, otherwise false
	uploadInfoArray (optional): array of uploadInfo objects corresponding to the tiddlers that have been uploaded
		this is needed and should set the canonical_uri for each uploadItem if:
		- (a) uploadInfo.uploadComplete was not set to true in uploadFile AND 
		- (b) uploadInfo.canonical_uri was not set in uploadFile
*/
WebDAV.prototype.deinitialize = function(callback) {
	// Mock finishing up operations that will complete the upload and persist the files
	this.logger.log("uploader deinitialize");
	callback();
};

})();
