/*\
title: $:/plugins/sq/chatgptimporter/deserializer
type: application/javascript
module-type: tiddlerdeserializer

ChatGPT JSON export deserializer for conversations.json file

\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";
	
	$tw.utils.registerFileType("application/x-chatgpt","utf-8",".chatgpt");
	
	exports["application/x-chatgpt"] = function(text,fields) {
		var jsonData,
			results = [];
		// Parse the text
		try {
			jsonData = JSON.parse(text)
		} catch(ex) {
			jsonData =  [{
				title: "JSON error: " + ex,
				text: ""
			}]
		}
		if(!$tw.utils.isArray(jsonData)) {
			return [{
				title: "ChatGPT import error: " + jsonData
			}];
		}

		function getConversationMessages(conversation) {
			var messages = [];
			var currentNode = conversation.current_node;
			while (currentNode != null) {
				var node = conversation.mapping[currentNode];
				if (
					node.message &&
					node.message.content &&
					node.message.content.content_type == "text"
					&& node.message.content.parts.length > 0 &&
					node.message.content.parts[0].length > 0 &&
					(node.message.author.role !== "system"  || node.message.metadata.is_user_system_message)
				) {
					var author = node.message.author.role;
					if (author === "assistant") {
						author = "ChatGPT";
					} else if (author === "system" && node.message.metadata.is_user_system_message) {
						author = "Custom user info"
					}
					messages.push({ author, text: node.message.content.parts[0] });
				}
				currentNode = node.parent;
			}
			return messages.reverse();
		}
		
		for (var i = 0; i < jsonData.length; i++) {
			var conversation = jsonData[i],
				messages = getConversationMessages(conversation);

			var getDateFieldString = function(epoch) {
				let date = new Date(conversation.create_time * 1000);
				if(date && $tw.utils.isDate(date) && date.toString() !== "Invalid Date") {
					return $tw.utils.formatDateString(date,"[UTC]YYYY0MM0DD0hh0mm0ssXXX").trim();
				}
			};

			var fields = {
				"title": conversation.title,
				"tags": ["ChatGPT Conversation"],
				"created": getDateFieldString(conversation.create_time),
				"modified": getDateFieldString(conversation.update_time)
			}
			var textData = [];
			for (var j = 0; j < messages.length; j++) {
				var message = `<pre class="chatgpt-message"><div class="author">${messages[j].author}</div><div>
	
	${messages[j].text}
	
</div></pre>`;
				textData.push(message);
			}
//			fields.text = textData.join("\n\n");
			fields.text = `<div class="chatgpt-conversation">
${textData.join("\n\n")}
</div>`
			results.push(fields);
		}

		// Return the output tiddlers
		return results;
	};
	
	})();