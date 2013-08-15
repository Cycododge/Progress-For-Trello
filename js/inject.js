/*
AUTHOR
	Cycododge

UPDATED
	8/15/2013

PURPOSE
	Injects script into DOM for access to page variables
*/

/* IMMEDIATE */
//initializes the script when the page is ready
var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		//add the script to the page
		var scr = document.createElement("script");
		scr.type = "text/javascript";
		//doesn't need cached because its loaded locally
		scr.src = chrome.extension.getURL("js/bp-trello.js")+'?v='+(new Date().getTime());
		(document.head || document.body || document.documentElement).appendChild(scr);
	}
}, 10);