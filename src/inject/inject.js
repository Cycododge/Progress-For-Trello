/*
AUTHOR
	Cycododge

UPDATED
	7/27/2013 v1.0.0
*/
chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		startScript();
		// ----------------------------------------------------------
	}
	}, 10);
});


//the script starts here
function startScript(){
	/* "GLOBAL" VARS */
	pData = { //the current board status with demo structure
		totalCards:0,
		totalComplete:0
	},
	set = { //default settings
		progressOfCards:true,
		progressOfScrum:false,
		countCheckLists:true,
		rememberGlobally:false
	},
	backupDoneTitles = ['done','complete','finished'];


	/* IMMEDIATE */
	initEvents();
}


/* EVENTS */
function initEvents(){
	//check that the UI still exists
		//and load the data continuously (can't figure out how to inject working listeners)
	setInterval(injectUI,1000);

	//reload when the done list setting is changed
	$('body').on('change','.bp-doneList select',loadData);
}


/* FUNCTIONS */

//push the progress bar to the UI if it doesn't exist
function injectUI(){
	//if the UI doesn't exist
	if(!$('.ext-bp').length){
		//add it to the page
		$('#board-header').after('<div class="ext-bp"><div class="bp-barContainer"><div class="bp-progress"><span class="bp-pc">0</span>%</div></div><div class="bp-doneList"><select></select></div></div>');

		//show the progress bar
		$('.ext-bp').slideDown();

	}

	//reload the data
	loadData();
}

//update the list of cards
function updateDoneList(){
	//so we can re-select the proper element
	var previous = $('.ext-bp .bp-doneList option:selected').text();

	//build "done" list options
	$.each($('.list'),function(index){
		var $this = $(this),
			listTitle = $this.find('.list-title h2').text();

		//skip this list if it has no title
		if(!listTitle){ return; }

		//see if this element is already in the list
		if(!$('select option:contains("'+listTitle+'")').length){
			//add this list, and possible make it selected
			var selected = (listTitle == previous ? ' selected':'');
			$('.ext-bp .bp-doneList select').append('<option value="'+index+'"'+selected+'>'+listTitle+'</option>');
		}
	});
}

//refresh the data from the board
function loadData(){
	//reset
	pData.totalCards = 0;
	pData.totalComplete = 0;

	//update the drop down
	updateDoneList();

	//for each list
	$.each($('.list'),function(index){
		var $this = $(this);

		//loop through each card
		$.each($this.find('.list-card'),function(){
			var numCheckLists = 0;

			//if allowed, count checklists for this car
			if(set.countCheckLists){
				//look for a checklist
				var findChecklist = $(this).find('.badges .icon-checklist').parent().find('.badge-text');

				//if there is a checklist
				if(findChecklist.length){
					numCheckLists += parseInt(findChecklist.text().split('/')[1],10);
				}
			}

			pData.totalCards += numCheckLists || 1; //add this card to the total

			//if this card is in the "done" list, count towards complete
			if(index == $('.ext-bp .bp-doneList option:selected').val()){
				pData.totalComplete += numCheckLists || 1; //add this card to the total
			}
		});
	});

	//update the progress on the board
	updateProgress();
}

//update the progress bar
function updateProgress(){
	//determine percentage
	var percentage = Math.round((pData.totalComplete / pData.totalCards) * 100);

	//adjust the progress bar
	$('.bp-progress').width(percentage+'%').find('.bp-pc').text(percentage);
}