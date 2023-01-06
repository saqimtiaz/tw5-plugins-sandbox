/*\
title: $:/plugins/sq/webdav-utils/createPath.js
type: application/javascript
module-type: library

//check if path exists, and if not then create it

\*/
(function(){


/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

let relativeToRoot;

async function checkDirectory(path) {
	const propfindXML = `<?xml version="1.0"?>
	<propfind xmlns="DAV:">
	   <prop>
	      <resourcetype />
	   </prop>
	</propfind>`;
	
	let response = await fetch(path,{
		"method": "PROPFIND",
		"headers": {
			"Depth": "0",
			"Content-Type": "text/xml"
		},
		"body": propfindXML
	});
	if(!response.ok) {
		//console.log(response.status);
		return false;
	} else if(response.ok && response.status === 207) {
		//console.log("exists");
		return true;
	}
};

async function checkDirectories(filesPath) {
	let dirExists = false,
		dir = filesPath;	
	do {
        //console.log("checking",dir);
		dirExists = await checkDirectory(dir);
		if(!dirExists) {
			const matches = dir.match(/^(.*)\/.+/);
			if(matches) {
				dir = matches[1];
			} else {
	            dir = "";
	        }
		}
	} while(!dirExists && dir.length)
	return dir;
};

async function mkDir(path) {
	let response = await fetch(path,{
		"method": "MKCOL"
	});
	if(!response.ok) {
		throw new Error(`Error: could not create backup directory ${path}. Response status: ${response.status}`);
	} else {
		return true;
	}
};

async function mkDirs(filesPath,dir) {
	if(filesPath === dir) {
		//console.log("original folder exists");
		return;
	} else {
		//console.log(`exists until ${dir} from ${filesPath}`);
		let missingPath = filesPath;
		if(filesPath.startsWith(dir)) {
			missingPath = filesPath.substring(dir.length).replace(/^\/|\/$/gm,"");
			//console.log(`missing path ${missingPath}`)
		}
		let missingDirs = missingPath.split("/");
		if(relativeToRoot) {
			missingDirs[0] = "/" + missingDirs[0];
		}
		while(missingDirs.length) {
			let newDir = missingDirs.shift(),
				dirToCreate = dir.length ? `${dir}/${newDir}` : newDir;
			await mkDir(dirToCreate);
			dir = dirToCreate;
		}
	}
};

async function createPath(filesPath) {
		relativeToRoot = filesPath.startsWith("/");
		filesPath = filesPath.trim().replace(/\/$/gm,"");
		let dir = await checkDirectories(filesPath);
		await mkDirs(filesPath,dir);
};

exports.createPath = createPath;
	
})();