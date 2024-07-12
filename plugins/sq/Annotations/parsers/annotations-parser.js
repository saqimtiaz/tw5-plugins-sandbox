/*\
title: $:/plugins/sq/annotations/parsers/rule.js
type: application/javascript
module-type: wikirule

Wiki text rule for code blocks that allows for annotations.

\*/
(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";
    
    exports.name = "codeblock";
    exports.types = {block: true};
    
    exports.init = function(parser) {
        this.parser = parser;
        this.matchRegExp = /```([\w-]+) annotated(.*)\r?\n/mg;
    };
    
    exports.parse = function() {
        var reEnd = /(\r?\n```$)/mg;
        var languageStart = this.parser.pos + 3,
            languageEnd = languageStart + this.match[1].length,
            params = this.match[2],
            attribs = {},
            node;
        // Move past the match
        this.parser.pos = this.matchRegExp.lastIndex;
    
        // Look for the end of the block
        reEnd.lastIndex = this.parser.pos;
        var match = reEnd.exec(this.parser.source),
            text,
            codeStart = this.parser.pos;
        // Process the block
        if(match) {
            text = this.parser.source.substring(this.parser.pos,match.index);
            this.parser.pos = match.index + match[0].length;
        } else {
            text = this.parser.source.substr(this.parser.pos);
            this.parser.pos = this.parser.sourceLength;
        }

        if(params) {
            node = $tw.utils.parseMacroParameters({params:[]},params,1);
            node.params.forEach((val,index) => attribs[val["name"]] = {type:"string", value: val["value"]});
        }

        // Return the $codeblock widget
        return [{
                type: "annotatedcode",
                attributes: $tw.utils.extend({
                        code: {type: "string", value: text, start: codeStart, end: this.parser.pos},
                        language: {type: "string", value: this.match[1], start: languageStart, end: languageEnd}
                },attribs)
        }];
    };
    
    })();
