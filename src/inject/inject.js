/*
AUTHOR
	Cycododge

UPDATED
	8/7/2013 v1.0.0

PURPOSE
	Injects script into DOM for access to page variables
*/

/* IMMEDIATE */
//intializes the script when the page is ready
chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			//add the script to the page
			var scr = document.createElement("script");
			scr.type = "text/javascript";
			scr.src = chrome.extension.getURL("js/bp-trello.js")+'?v='+(new Date().getTime());
			(document.head || document.body || document.documentElement).appendChild(scr);
		}
	}, 10);
});
