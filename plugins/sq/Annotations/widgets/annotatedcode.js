/*\
title: $:/plugins/sq/annotations/widgets/annotatedcode.js
type: application/javascript
module-type: widget

\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";
	
	const Widget = require("$:/core/modules/widgets/widget.js").widget;
	
	let AnnotatedCodeWidget = function(parseTreeNode,options) {
		this.initialise(parseTreeNode,options);
	};
	
	const commentRegexes = {
		number: { start: /^\s*#[^!]\s*|^\s*#$/ },
		slash: { start: /^\s*\/\/\s*/ },
		xml: { start: /^\s*<!--\s*/, end: /-->$\s*/ },
		percent: { start: /^\s*%%?\s*/ },
		hyphen: { start: /^\s*--\s*/ }
	};

	/*
	Inherit from the base widget class
	*/
	AnnotatedCodeWidget.prototype = new Widget();
	
	/*
	Render this widget into the DOM
	*/
	AnnotatedCodeWidget.prototype.render = function(parent,nextSibling) {
		this.parentDomNode = parent;
		this.computeAttributes();
		this.execute();
		this.prepareNodes();
		//TODO: check that rows are prepared without error before proceeding

		let domNode = $tw.utils.domMaker("div",{
			class: "squi annotate beside",
			innerHTML: `<div class="annotate-header"></div>
			<div class="annotate-beside"></div>`
		});
		parent.appendChild(domNode);
		this.domNodes.push(domNode);
		let container = domNode.getElementsByClassName("annotate-beside")[0],
			header = domNode.getElementsByClassName("annotate-header")[0];

		let headerWidgetNode = this.wiki.makeTranscludeWidget("$:/plugins/sq/Annotations/templates/header",{
			parentWidget: this,
			mode: "inline",
			variables: {
				"language": this.language,
				"code": this.rawcode,
				"header": this.header,
				"uniquestate": this.state || ""
			}, //TODO: set title attrib and lang as variables as well as anything needed to control the buttons, like state identifier
			document: this.document,
		});
		headerWidgetNode.render(header,null);
		let parseTree;
		if(this.errorMessages.length) {
			parseTree = [{type: "element", tag: "span", attributes: {
				"class": {type: "string", value: "tc-error"}
			}, children: [
				{type: "text", text: `Error - AnnotatedCodeWidget: ${this.errorMessages.join(" ")}`}
			]}];
		} else {
			parseTree = this.getParseTree();
		}

		this.makeChildWidgets(parseTree);
		this.renderChildren(container,null);
		this.children.push(headerWidgetNode);
		if(this.state) {
			let inlineWidgetNode = this.wiki.makeTranscludeWidget("$:/plugins/sq/Annotations/templates/inline",{
				parentWidget : this,
				mode: "inline",
				document: this.document,
				variables: {
					"language": this.language,
					"code": this.rawcode					
				}
			});
			inlineWidgetNode.render(this.domNodes[0],null);
			this.children.push(inlineWidgetNode);
		}
	};

	AnnotatedCodeWidget.prototype.getParseTree = function() {

		const getRow= (row) => {
			let code = row[1].join("\n"),
				note = row[0].map((n) => n.replace(this.commentRegExp,"")).map((n) => this.commentEndRegExp? n.replace(this.commentEndRegExp,""): n).join("\n");
			return {
				"type": "let",
				"attributes": {
					"code": {
						"name": "code",
						"type": "string",
						"value": code,
					},
					"note": {
						"name": "note",
						"type": "string",
						"value": note,
					}
				},
				"orderedAttributes": [
					{
						"name": "code",
						"type": "string",
						"value": code,
					},
					{
						"name": "note",
						"type": "string",
						"value": note,
					}
				],
				"tag": "$let",
				"isBlock": false,
				"children": [
					this.wiki.parseText("text/vnd.tiddlywiki",`<div class="annotate-row" tabindex="-1">
						<div class="annotate-code">
							<$codeblock code=<<code>> language="${this.language}"/>
						</div>
						<div class="annotate-note">
							<$transclude $variable="note" $mode="block"/>
						</div>
					</div>`,{parseAsInline: true}).tree[0]
				],
			};
		};

		let rows = this.rows.map((row) => getRow(row));
		return rows;
	};
	
	AnnotatedCodeWidget.prototype.prepareNodes = function() {
		const lines = this.rawcode.split("\n").filter((line) => Boolean(line.trim())),
			groups = [[]],
			testLine = (line) => this.commentRegExp.test(line);

		let mode = testLine(lines[0]);
		for(const line of lines) {
			if((!mode && testLine(line)) || (mode && !testLine(line))) {
				mode = !mode;
				groups.push([]);
			}
			groups[groups.length-1].push(line);
		}
		const rows = [...Array(Math.ceil(groups.length / 2))].map((_, i) => groups.slice(i * 2, i * 2 + 2));
		
		//TODO: check rows here,each annotation must have a code block
		
		this.rows = rows;
	};

	/*
	Compute the internal state of the widget
	*/
	AnnotatedCodeWidget.prototype.execute = function() {
		this.rawcode = this.getAttribute("code");
		this.errorMessages = [];
		const language = this.getAttribute("language"),
			languages = JSON.parse(this.wiki.getTiddlerText("$:/plugins/sq/Annotations/languages.json"));
		if(!(languages && languages[language])) {
			this.errorMessages.push(`Unsupported language for annotation. Please use one of: ${Object.keys(
				languages,
			  )}.`);
			return;
		}
		const firstLine = this.rawcode.split('\n')[0],
			langRegexes = commentRegexes[languages[language]];
		this.commentRegExp = langRegexes.start;
		if(langRegexes.end) {
			this.commentEndRegExp = langRegexes.end;
		}
		if(!this.commentRegExp.test(firstLine)) {
			this.errorMessages.push(`Make sure the annotated code example starts with a single line annotation. It's currently starting with: ${firstLine}`);
			return;
		}
		if(!new RegExp(this.commentRegExp, "m").test(this.rawcode)) {
			this.errorMessages.push('Make sure the comment syntax matches the language. Use single-line comments only.');
			return;
		}
		this.language = language;
		this.header = this.getAttribute("header",language);
		let stateQualifier = this.getAttribute("uniquestate","");
		if(stateQualifier.length) {
			this.state = `$:/state/${this.getVariable("currentTiddler")}/${stateQualifier}`;
		}
	};
	
	/*
	Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
	*/
	AnnotatedCodeWidget.prototype.refresh = function(changedTiddlers) {
		var changedAttributes = this.computeAttributes();
		if($tw.utils.count(changedAttributes) > 0) {
			this.refreshSelf();
			return true;
		} else {
			if(this.state && changedTiddlers[this.state]) {
				$tw.utils.toggleClass(this.domNodes[0],"beside");
				$tw.utils.toggleClass(this.domNodes[0],"inline");
			}
			return this.refreshChildren(changedTiddlers);
		}
	};
	
	exports.annotatedcode = AnnotatedCodeWidget;
	
	})();