/*
AUTHOR
	Cycododge

UPDATED
	7/28/2013 v1.0.0
*/

/* "GLOBAL" VARS */
pData = { //the current board status with demo structure
	totalCards:0,
	totalComplete:0
},
set = { //default settings
	progressOfCards:true,
	progressOfScrum:false,
	countCheckLists:true,
	rememberGlobally:false,
	lastSelectedList:''
},
percentageComplete = 0,
backupDoneTitles = ['{bp-done}','done','complete','finished']; //in order of priority


/* EVENTS */
function initEvents(){
	//check that the UI still exists
		//and load the data continuously (can't figure out how to inject working listeners)
	setInterval(injectUI,1000);

	//reload when the done list setting is changed
	$('body').on('change','.bp-doneList select',function(){
		//save the newly selected list
		set.lastSelectedList = $('.ext-bp .bp-doneList option:selected').text();

		//update the progress
		loadData();
	});
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
	var newSelection = '',
		$lists = $('.list');

	//decide which list is selected
		//if not set by user
	if(!set.lastSelectedList){
		//loop through list of titles to check against
		for(var i = 0, ii = backupDoneTitles.length; i < ii; i++){
			//exit the loop if this is now set
			if(newSelection){ break; }

			//check each list and make best guess
			$.each($lists,function(index){
				var $this = $(this),
					listTitle = $this.find('.list-title h2').text();

				//check if this list matches
				if(listTitle.toLowerCase().indexOf(backupDoneTitles[i].toLowerCase()) >= 0){
					newSelection = listTitle; //set this list as selected
					return; //stop checking list when match found
				}
			});
		}

		//save the new selection as the last selected
		set.lastSelectedList = newSelection;
	}else{
		newSelection = set.lastSelectedList;
	}

	//build "done" list options
	$.each($lists,function(index){
		var $this = $(this),
			listTitle = $this.find('.list-title h2').text();

		//skip this list if it has no title
		if(!listTitle){ return; }

		//see if this element is already in the list
		if(!$('select option:contains("'+listTitle+'")').length){
			//add this list, and possibly make it selected
			var selected = (listTitle == newSelection ? ' selected':'');
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
		$.each($this.find('.list-card').not('.hide'),function(){
			var numCheckLists = 0;

			//exit if this card isn't created yet
			if($(this).hasClass('js-composer')){ return; }

			//if allowed, count checklists for this card
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
	var newPercent = Math.round((pData.totalComplete / pData.totalCards) * 100);

	//don't update if nothing changed
	if(percentageComplete == newPercent){ return; }

	//update the global var
	percentageComplete = newPercent;
console.log('updating');
	//adjust the progress bar
	$('.bp-progress').width(percentageComplete+'%').find('.bp-pc').text(percentageComplete);
}


/* IMMEDIATE */
//intializes the script when the page is ready
chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
		initEvents();
	}
	}, 10);
});