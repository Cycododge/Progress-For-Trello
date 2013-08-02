/*
AUTHOR
	Cycododge

UPDATED
	7/31/2013
*/

(function($){
	/* "GLOBAL" VARS */
	var pData = { //the current board status with demo structure
			totalCards:0,
			totalComplete:0
		},
		set = { //default settings
			progressOfCards:true,
			progressOfScrum:false,
			countCheckLists:true,
			rememberGlobally:false,
			lastSelectedList:'',
			refreshTime:500
		},
		percentageComplete = 0,
		backupKeywords = ['{bp-done}','done','complete','finished','closed'], //in order of priority
		lastDoneList = []; //contains current drop list data to compare against


	/* EVENTS */

	//check that the UI still exists
		//and load the data continuously (can't figure out how to inject working listeners!)
	injectUI(); //initial call
	setInterval(injectUI,set.refreshTime);

	//reload when the done list setting is changed
	$('body').on('change','.bp-doneList select',function(){
		//save the newly selected list
		set.lastSelectedList = $(this).find('option:selected').val();

		//update the progress
		loadData();
	});


	/* FUNCTIONS */

	//push the progress bar to the UI if it doesn't exist
	function injectUI(){
		//if the UI doesn't exist
		if(!$('.ext-bp').length){
			// console.log('injectUI()');

			//add it to the page
			$('#board-header').after('<div class="ext-bp"><div class="bp-barContainer"><div class="bp-progress"><span class="bp-pc">0</span>%</div></div><div class="bp-doneList"><select></select></div></div>');

			//show the progress bar
			$('.ext-bp').slideDown();
		}

		//reload the data
		loadData();
	}

	//update the list of cards
	function updateDoneOptions(_lists){
		var nextDoneList = [], listOptions = [];

		//loop through the current lists on the board
		for(var listID in _lists){
			if(!_lists.hasOwnProperty(listID)){ continue; }
			if(_lists[listID].attributes.closed){ continue; } //skip if the list is closed

			//add to new array
			nextDoneList.push({id:listID,title:_lists[listID].attributes.name});
		}

		//if a selected list hasn't been specified
		if(!set.lastSelectedList){
			//loop through list of keywords to check titles against
			for(var i = 0, ii = backupKeywords.length; i < ii; i++){
				//loop through each list title
				for(var x = 0, xx = nextDoneList.length; x < xx; x++){
					//if this keyword exists in this list title
					if(nextDoneList[x].title.toLowerCase().indexOf(backupKeywords[i].toLowerCase()) >= 0){
						set.lastSelectedList = nextDoneList[x].id; //set this list as selected
						ii = xx = 0; //selection found, break out of loops
					}
				}
			}
		}

		//compare the nextDoneList with lastDoneList
		if(JSON.stringify(nextDoneList) != JSON.stringify(lastDoneList)){
			//update lastDoneList with nextDoneList
			lastDoneList = JSON.parse(JSON.stringify(nextDoneList));

			//loop through nextDoneList
			for(var i = 0, ii = nextDoneList.length; i < ii; i++){
				//create the option lists AND set selected
				listOptions.push('<option value="'+nextDoneList[i].id+'"'+(nextDoneList[i].id == set.lastSelectedList ? ' selected':'')+'>'+nextDoneList[i].title+'</option>');
			}

			//output the list to the page
			$('.ext-bp .bp-doneList select').html(listOptions.join(''));
		}
	}

	//refresh the data from the board
	function loadData(){
		//reset
		pData.totalCards = 0;
		pData.totalComplete = 0;
		_lists = ModelCache._cache.List;
		_cards = ModelCache._cache.Card;

		//update the drop down
		updateDoneOptions(_lists);

		//for each list
		for(var listID in _lists){
			if(!_lists.hasOwnProperty(listID)){ continue; } //skip if not a list
			if(_lists[listID].attributes.closed){ continue; } //skip if the list is closed

			//loop through each card
			for(var cardID in _cards){
				if(!_cards.hasOwnProperty(cardID)){ continue; } //skip if not a card
				if(_cards[cardID].attributes.closed){ continue; } //skip if the card is closed
				if(_cards[cardID].attributes.idList != listID){ continue; } //skip if the card doesn't belong to this list

				//if allowed count checklists for this card
				var numCheckLists = 0;
				if(set.countCheckLists){
					//loops through available checklists
					for(var i = 0, ii = _cards[cardID].checklistList.length; i < ii; i++){
						//count the number of checklist items towards total
						numCheckLists += _cards[cardID].checklistList.models[i].attributes.checkItems.length;
					}
				}

				//add this card to the total
				pData.totalCards += numCheckLists || 1;

				//if this card is in the "done" list
				if(listID == set.lastSelectedList){
					pData.totalComplete += numCheckLists || 1; //count towards complete
				}
			}
		}

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
		//adjust the progress bar
		$('.bp-progress').width(percentageComplete+'%').find('.bp-pc').text(percentageComplete);
		// console.log('updateProgress()');
	}
})(jQuery);