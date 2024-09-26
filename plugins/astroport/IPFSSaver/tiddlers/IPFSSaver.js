/*\
title: $:/plugins/astroport/IPFSSaver/IPFSSaver.js
type: application/javascript
module-type: library

IPFSSaver plugin avancé pour TiddlyWiki

\*/
(function(){

"use strict";

var kuboRpcClient = require("kubo-rpc-client");

exports.IPFSSaver = function() {
    this.client = null;

    this.init = async function() {
        if (!this.client) {
            const config = $tw.wiki.getTiddlerData("$:/plugins/astroport/IPFSSaver/Config") || {};
            const ipfsServerAddress = config.ipfsServerAddress || "http://localhost:5001";
            this.client = kuboRpcClient.create({ url: ipfsServerAddress });
        }
    };

    this.addToIPFS = async function(content) {
        await this.init();
        const { cid } = await this.client.add(content);
        return cid.toString();
    };

    this.publishToIPNS = async function(ipfsHash) {
        await this.init();
        const config = $tw.wiki.getTiddlerData("$:/plugins/astroport/IPFSSaver/Config") || {};
        const keyName = config.ipnsKeyName || "self";
        const result = await this.client.name.publish(ipfsHash, { key: keyName });
        return result.name;
    };

    this.saveAndPublish = async function(content) {
        const ipfsHash = await this.addToIPFS(content);
        const ipnsName = await this.publishToIPNS(ipfsHash);
        return { ipfsHash, ipnsName };
    };

    this.saveToMFS = async function(content, path) {
        await this.init();
        await this.client.files.write(path, Buffer.from(content), { create: true, parents: true });
        return this.client.files.stat(path);
    };

    this.pinContent = async function(cid) {
        await this.init();
        return this.client.pin.add(cid);
    };

    this.addLargeFile = async function(fileStream) {
        await this.init();
        const file = await this.client.add(fileStream, { pin: true });
        return file.cid.toString();
    };

    this.saveVersion = async function(content, path) {
        const stat = await this.saveToMFS(content, path);
        const ipnsName = await this.publishToIPNS(stat.cid.toString());
        return { cid: stat.cid.toString(), ipnsName };
    };

    this.searchContent = async function(query) {
        await this.init();
        const results = await this.client.dag.get(query);
        return results;
    };

    this.retryOperation = async function(operation, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            }
        }
    };
};

})();
