/*\
title: test-filters.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the filtering mechanism.

\*/
(function(){

	/* jslint node: true, browser: true */
	/* eslint-env node, browser, jasmine */
	/* eslint no-mixed-spaces-and-tabs: ["error", "smart-tabs"]*/
	/* global $tw, require */
	"use strict";
	describe("filter tests", function() {
	
		var wiki = new $tw.Wiki();
	
		wiki.addTiddler({
			title: "Brownies",
			text: "//This is a sample shopping list item for the [[Shopping List Example]]//",
			description: "A square of rich chocolate cake",
			tags: ["shopping","food"],
			price: "4.99",
			quantity: "1"
		});
		wiki.addTiddler({
			title: "Chick Peas",
			text: "//This is a sample shopping list item for the [[Shopping List Example]]//",
			tags: ["shopping","food"],
			description: "a round yellow seed",
			price: "1.32",
			quantity: "5"
		});
		wiki.addTiddler({
			title: "Milk",
			text: "//This is a sample shopping list item for the [[Shopping List Example]]//",
			tags: ["shopping", "dairy", "drinks"],
			price: "0.46",
			quantity: "12"
		});
		wiki.addTiddler({
			title: "Rice Pudding",
			price: "2.66",
			quantity: "4",
			description: "",
			tags: ["shopping", "dairy"],
			text: "//This is a sample shopping list item for the [[Shopping List Example]]//"
		});
		wiki.addTiddler({
			title: "Sparkling water",
			tags: ["drinks", "mineral water", "textexample"],
			text: "This is some text"
		});
		wiki.addTiddler({
			title: "Red wine",
			tags: ["drinks", "wine", "textexample"],
			text: "This is some more text!"
		});
		wiki.addTiddler({
			title: "Cheesecake",
			tags: ["cakes", "food", "textexample"],
			text: "This is even even even more text"
		});
		wiki.addTiddler({
			title: "Chocolate Cake",
			tags: ["cakes", "food", "textexample"],
			text: "This is even more text"
		});
		wiki.addTiddler({
			title: "Persian love cake",
			tags: ["cakes"],
			text: "An amazing cake worth the effort to make"
		});
		wiki.addTiddler({
			title: "cheesecake",
			tags: ["cakes"],
			text: "Everyone likes cheescake"
		});
		wiki.addTiddler({
			title: "chocolate cake",
			tags: ["cakes"],
			text: "lower case chocolate cake"
		});
		wiki.addTiddler({
			title: "Pound cake",
			tags: ["cakes","with tea"],
			text: "Does anyone eat pound cake?"
		});
		wiki.addTiddler({
			title: "Wikified Images Test",
			text: `
				<$let imgs="""
				https://source.unsplash.com/Pbztnji2t6k/683x445
				https://source.unsplash.com/TS_RMNAO7Lo/616x340
				https://source.unsplash.com/ya7R1JbS-5w/533x317
				https://source.unsplash.com/nlMiiYZM2Hk/700x894
				https://source.unsplash.com/tWMVbh0MCFY/663x541
				https://source.unsplash.com/dwJ0imjVifs/368x575
				"""
				>
				<$list filter="[enlist<imgs>]" variable="img">
				<$button class="tc-btn-invisible" tag="div">
				<$image source=<<img>> />
				</$button>
				</$list>
				<img src="https://source.unsplash.com/dwJ0imjVifs/368x600"/>
				</$let>
		`});
		wiki.addTiddler({
			title: "Extract Images Test",
			text: `
				[img[https://source.unsplash.com/Pbztnji2t6k/683x445]]
				<$image source="https://source.unsplash.com/TS_RMNAO7Lo/616x340"/>
				<div>
					<img src="https://source.unsplash.com/ya7R1JbS-5w/533x317"/>
					<$image source="https://source.unsplash.com/tWMVbh0MCFY/663x541"/>		
				</div>
			`
		})


		it("should handle the _extract operator", function() {
			//no operands
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[]]").join(",")).toBe("");
			//only one operand
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine]]").join(",")).toBe("nine");
			//three operands
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[1],[1]]").join(",")).toBe("eight,nine,ten");
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[5],[5]]").join(",")).toBe("four,five,six,seven,eight,nine,ten,elevent,twelve,thirteen,fourteen");
			//second operand is 0
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[0],[5]]").join(",")).toBe("nine,ten,elevent,twelve,thirteen,fourteen");
			//third operand is 0
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[5],[0]]").join(",")).toBe("four,five,six,seven,eight,nine");
			//third operand is missing
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[5]]").join(",")).toBe("four,five,six,seven,eight,nine");
			//second operand is negative
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[-1],[5]]").join(",")).toBe("nine,ten,elevent,twelve,thirteen,fourteen");
			//third operand is negative
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[1],[-5]]").join(",")).toBe("eight,nine");
			//second and third operands are negative
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[-1],[-5]]").join(",")).toBe("nine");	
			//missing marker
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[zero]]").join(",")).toBe("");
			//too many beforeCount
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[20],[1]]").join(",")).toBe("one,two,three,four,five,six,seven,eight,nine,ten");	
			//too many afterCount
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[2],[25]]").join(",")).toBe("seven,eight,nine,ten,elevent,twelve,thirteen,fourteen,fifteen,sixteen,seventeen,eighteen,nineteen,twenty");
			//everything after the marker plus 5 before
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[1],[all]]").join(",")).toBe("eight,nine,ten,elevent,twelve,thirteen,fourteen,fifteen,sixteen,seventeen,eighteen,nineteen,twenty");
			//everything before the marker plus 5 after
			expect(wiki.filterTiddlers("[enlist[one two three four five six seven eight nine ten elevent twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty]_extract[nine],[all],[5]]").join(",")).toBe("one,two,three,four,five,six,seven,eight,nine,ten,elevent,twelve,thirteen,fourteen");
		});
		it("should handle the _concat operator", function() {
			expect(wiki.filterTiddlers("[tag[shopping]_concat[]]").join(",")).toBe("Brownies [[Chick Peas]] Milk [[Rice Pudding]]");
			expect(wiki.filterTiddlers("[tag[doesnotexist]_concat[]]").join(",")).toBe("");
		});
		
		it("should handle the _indexof operator", function() {
			expect(wiki.filterTiddlers("[tag[shopping]_indexof[Milk]]").join(",")).toBe("2");
			expect(wiki.filterTiddlers("[tag[shopping]_indexof[Bananas]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[tag[shopping]_indexof[]]").join(",")).toBe("");
		});
/*
		it("should handle the _snip operator", function() {
			expect(wiki.filterTiddlers("abcdefghijklmnopqrstuvwxyz :and[_snip[0]]").join(",")).toBe("abcdefghijklmnopqrstuvwxyz");
			expect(wiki.filterTiddlers("abcdefghijklmnopqrstuvwxyz :and[_snip[2]]").join(",")).toBe("cdefghijklmnopqrstuvwxyz");
			expect(wiki.filterTiddlers("abcdefghijklmnopqrstuvwxyz :and[_snip[-2]]").join(",")).toBe("yz");
			expect(wiki.filterTiddlers("abcdefghijklmnopqrstuvwxyz :and[_snip[0],[2]]").join(",")).toBe("ab");
			expect(wiki.filterTiddlers("abcdefghijklmnopqrstuvwxyz :and[_snip[0],[12]]").join(",")).toBe("abcdefghijkl");
			expect(wiki.filterTiddlers("abcdefghijklmnopqrstuvwxyz :and[_snip[3],[12]]").join(",")).toBe("defghijklmno");
			expect(wiki.filterTiddlers("abcdefghijklmnopqrstuvwxyz :and[_snip[-8]]").join(",")).toBe("stuvwxyz");
			expect(wiki.filterTiddlers("abcdefghijklmnopqrstuvwxyz :and[_snip[-8],[5]]").join(",")).toBe("stuvw");
			expect(wiki.filterTiddlers("abcdefghijklmnopqrstuvwxyz :and[_snip[-8],[15]]").join(",")).toBe("stuvwxyz");
			expect(wiki.filterTiddlers("abcdefghijklmnopqrstuvwxyz :and[_snip[-5],[5]]").join(",")).toBe("vwxyz");
		})
*/		
		
	});
	
	})();
	