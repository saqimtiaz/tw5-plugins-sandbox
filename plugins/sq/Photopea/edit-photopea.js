/*\
title: $:/plugins/sq/photopea/edit-photopea.js
type: application/javascript
module-type: widget

Edit-bitmap widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */

let Widget = require("$:/core/modules/widgets/widget.js").widget;
let Photopea = require("$:/plugins/sq/photopea/photopea.min.js");
let DEFAULT_IMAGE_TYPE = "image/png";

let EditPhotopeaWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

function base64ToArrayBuffer(base64) {
	let binaryString = atob(base64),
		bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes.buffer;
}

function arrayBufferToBase64( buffer ) {
	let binary = '',
		bytes = new Uint8Array( buffer ),
		len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode( bytes[ i ] );
	}
	return window.btoa( binary );
}

/*
Inherit from the base widget class
*/
EditPhotopeaWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EditPhotopeaWidget.prototype.render = function(parent,nextSibling) {
	let self = this;
	this.window = self.document.parentWindow || self.document.defaultView;
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create the wrapper for the toolbar and render its content
	this.container = this.document.createElement("div");
	this.container.className = "photopea-container";
	this.container.style.height = "850px";
	// // Insert the elements into the DOM
	parent.insertBefore(this.container,nextSibling);
	this.renderChildren(this.container,null);
	this.domNodes.push(this.container);
	//set up the iframe and initalize Photopea
	this.init();
};

EditPhotopeaWidget.prototype.getImageType = function() {
	let tiddler = this.wiki.getTiddler(this.editTitle),
		type = tiddler?.fields?.type || DEFAULT_IMAGE_TYPE,
		extension = $tw.config.contentTypeInfo[type].extension;
	return extension.startsWith('.') ? extension.slice(1) : extension;
};

EditPhotopeaWidget.prototype.init = async function() {
	let self = this,
		iframeLoaded = false,
		pendingSave = false,
		pendingExit = false,
		photopeaWindow;

	if(!$tw.browser) {
		return;
	}

	function onMessage(e) {
		console.log(e);
		if(Object.prototype.toString.call(e.data) === "[object ArrayBuffer]") {
			//save image
			self.saveChanges(e.data);
		}
		if(e.data === "saved" && pendingSave) {
			pendingSave = false;
			if(pendingExit) {
					if(self.exitActions) {
						self.invokeActionString(self.exitActions);
					}
			}
		}
	}
	window.addEventListener("message", onMessage);

	try {
		let language = self.wiki.getTiddlerText("$:/language").split("-")[0].slice("$:/languages/".length),
		pea = await Photopea.createEmbed(this.container, {
			"environment": {
				"customIO": {
					"save": `if(!app.activeDocument.saved)app.activeDocument.saveToOE("${self.getImageType()}");`,
					//TODO:, saveToOE has second part to the argument for quality that defaults to 0.7 https://www.photopea.com/learn/scripts#:~:text=Document.saveToOE(%22png%22)
					"exportAs":true,
				},
				"lang": `${language}`,
				"menus": [[0,0,0,0,0,1,0,0,1],1,1,1,1,1,1,1,1,1],
				/*"autosave" : 5*/
			}
		},self.window);

		iframeLoaded = true;
		photopeaWindow = self.container.getElementsByTagName("iframe")[0].contentWindow;
		if(self.wiki.getTiddler(self.editTitle)) {
			let base64String = self.wiki.getTiddlerText(self.editTitle);
			//send the image to the iframe
			photopeaWindow.postMessage(base64ToArrayBuffer(base64String),"*");
		}
	} catch(err) {
		let errorMessage = self.document.createElement("span");
		errorMessage.className = "tc-error";
		errorMessage.textContent = `Error loading Photopea: ${err}`;
		self.container.append(errorMessage);
	} finally {
		self.addEventListener("tm-photopea-save",function(event){
			if(iframeLoaded) {
				pendingExit = true;
				pendingSave = true;
				let script = `app.activeDocument.saveToOE("${self.getImageType()}");app.echoToOE("saved");`;
				photopeaWindow.postMessage(script,"*");
				//pea.runScript(script);
			} else {
				// make sure we can still exit
				if(self.exitActions) {
					self.invokeActionString(self.exitActions);
				}			
			}
		});
	}
};

/*
Compute the internal state of the widget
*/
EditPhotopeaWidget.prototype.execute = function() {
	// Get our parameters
	this.editTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.exitActions = this.getAttribute("exitactions");
	// Make the child widgets
	this.makeChildWidgets();
};

function getFileType(arrayBuffer) {
	// Convert the ArrayBuffer to a Uint8Array
	const bytes = new Uint8Array(arrayBuffer);
	
	// Convert the first few bytes to a hexadecimal string
	const hexSignature = bytes.slice(0, 8).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');

	// Known file signatures
	const signatures = {
		'ffd8ffe0': 'JPEG', // JPEG file signature
		'ffd8ffe1': 'JPEG', // Additional JPEG signature
		'ffd8ffe2': 'JPEG', // Additional JPEG signature
		'89504e47': 'PNG',  // PNG file signature
		'47494638': 'GIF',  // GIF file signature
		'49492a00': 'TIFF', // TIFF (little-endian)
		'4d4d002a': 'TIFF', // TIFF (big-endian)
		'52494646': 'WEBP', // RIFF header for WEBP
		'00000020': 'ISO Base Media', // Base signature for ISO formats (AVIF included)
	};

	// Match the signature for basic formats
	const basicMatch = signatures[hexSignature.slice(0, 8)];
	if (basicMatch) {
		if (basicMatch === 'ISO Base Media') {
			// Check additional bytes for AVIF
			const avifSignature = String.fromCharCode(...bytes.slice(4, 12));
			if (avifSignature.includes('avif')) {
				return '.avif';
			}
		}
		return `.${basicMatch}`.toLowerCase();
	}

	// SVG detection (based on XML declaration or <svg> tag)
	const text = new TextDecoder().decode(arrayBuffer);
	if (text.trim().startsWith('<?xml') || text.includes('<svg')) {
		return '.svg';
	}

	return null;
};

/*
Just refresh the toolbar
*/
EditPhotopeaWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

EditPhotopeaWidget.prototype.saveChanges = function(buffer) {
	let tiddler = this.wiki.getTiddler(this.editTitle) || new $tw.Tiddler({title: this.editTitle,type: DEFAULT_IMAGE_TYPE}),
		//type = tiddler.fields.type || DEFAULT_IMAGE_TYPE;
		buffertype = $tw.config.fileExtensionInfo[getFileType(buffer)]?.type,
		type = buffertype || tiddler.fields.type || DEFAULT_IMAGE_TYPE,
		newContent = arrayBufferToBase64(buffer);

	if(!tiddler.fields.text || newContent != tiddler.fields.text) {
		let update = {type: type, text: newContent};
		this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getModificationFields(),tiddler,update,this.wiki.getCreationFields()));
	}
};

exports["edit-photopea"] = EditPhotopeaWidget;

})();