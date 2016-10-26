/*
AUTHOR
	Cycododge

UPDATED
	10/25/2016
*/

(function bpExt($){
	/* "GLOBAL" VARS */

	//initialize variables.
	var releaseVersion = '1.2.4', _lists = [], _cards = [], browser = {}, bp = {}, curBoard = '', firstVisit = false,
		injectedHTML = '<div class="ext-bp">'+
			'<div class="bp-optionsIcon icon-sm icon-checklist bp-button"></div>'+
				'<div class="bp-barContainer">'+
					'<div class="bp-progress" style="width:0%;">'+
						'<span class="bp-pc">0%</span>'+
					'</div>'+
				'</div>'+
				'<div class="bp-settings">'+
					'<div class="bp-column"><div class="bp-title">Track Against</div><select class="bp-doneList" multiple size="5"></select></div>'+
					'<div class="bp-column">'+
						'<div class="bp-inputContainer">'+
							'<span class="bp-title">Track:</span>'+
							'<label for="bp-cards">Cards</label>'+
							'<input value="false" name="bp-tracking" data-setting="tracking" id="bp-cards" type="radio" />'+
							'<label for="bp-points">Points</label>'+
							'<input value="true" name="bp-tracking" data-setting="tracking" id="bp-points" type="radio" />'+
						'</div>'+
						'<div class="bp-inputContainer">'+
							'<input data-setting="countCheckLists" class="bp-indent" type="checkbox" />Track Checklists'+
						'</div>'+
						'<div class="bp-inputContainer countCheckListsTowardsComplete">'+
							'<input data-setting="countCheckListsTowardsComplete" class="bp-indentLevel2" type="checkbox" />Track Completed Items'+
						'</div>'+
					'</div>'+
					'<div class="bp-version">v'+releaseVersion+'</div>'+
					'<div class="bp-saveSettings bp-button">Close</div>'+
				'</div>'+
			'</div>';

	//get the current board, then fire the script
	var curBoardInterval = setInterval(function(){
		curBoard = getBoard(); //set as current board to avoid additional loop

		//if something was returned, exit loop and continue script
		if(curBoard.hasOwnProperty('id')){
			curBoard = curBoard.id; //reset itself to the
			clearInterval(curBoardInterval); //exit the loop
			initScript(); //start the script
		}
	},50);

	//start running the rest of the script and init events
	function initScript(){
		//grab the setup
		browser = loadLocal(); //load user saved
		bp = resetVars(); //create script vars
		initEvents(); //attach listeners and start loop
	}

	//reset everything
	function resetVars(){
		//check to see if this board exists in browser{}
		if(!browser[curBoard]){ browser[curBoard] = {}; firstVisit = true; }

		//give back the refreshed settings
		return {
			math:{
				progressMax:0,
				progressComplete:0,
				lastPercentage:0, //percentage before last change
				nextPercentage:0 //percentage after last change
			},
			user:{ //default user settings
				//count scrum points instead of cards/checklists
				tracking:browser[curBoard].tracking || 'false',
				//if card checklists should be counted towards total
				countCheckLists:(typeof browser[curBoard].countCheckLists == 'boolean' ? browser[curBoard].countCheckLists : false),
				//if completed checklist items should be tracked towards the total
				countCheckListsTowardsComplete:(typeof browser[curBoard].countCheckListsTowardsComplete == 'boolean' ? browser[curBoard].countCheckListsTowardsComplete : false)
			},
			sys:{ //default system settings
				lastSelectedList:browser[curBoard].lastSelectedList || [], //id of the selected list
				refreshTime:500, //how often to loop and re-check data (milliseconds)
				lastMenuOpen:'', //if the right menu is open
				settingsOpen:(typeof browser[curBoard].settingsOpen == 'boolean' ? browser[curBoard].settingsOpen : true), //if the settings are visible
				lastBoardURL:curBoard //board shortURL element
			},
			percentageComplete:0,
			backupKeywords:['{bp-done}','done','live','complete','finished','closed'], //in order of priority
			lastDoneList:[] //contains current drop list data to compare against
		};
	}

	//setup the events
	function initEvents(){
		//check that the UI still exists
			//and load the data continuously (can't figure out how to inject working listeners!)
		injectUI(); //initial call
		setInterval(injectUI,bp.sys.refreshTime);

		//settings: track status of radio buttons
		$('body').on('change','.ext-bp .bp-settings input[type="radio"]',function(){
			var $this = $(this),
				group = $this.prop('name'), //get the group name
				selected = $this.parent().find('input[name="'+group+'"]:checked'), //find the checked item in the group
				setting = $this.data('setting'); //get the setting name

			bp.user[setting] = selected.val(); //save the radio value to the local settings
			saveLocal(setting,bp.user[setting]); //save the radio value to the browser settings
		});

		//settings: track status of checkboxes
		$('body').on('change','.ext-bp .bp-settings input[type="checkbox"]',function(){
			//save the new status
			var setting = $(this).data('setting');
			bp.user[setting] = $(this).prop('checked');
			saveLocal(setting,bp.user[setting]); //save to the browser
		});

		//special condition for counting checklist items setting
		$('body').on('change','.ext-bp .bp-settings input[data-setting="countCheckListsTowardsComplete"]',function(){
			//if tracking points
			if(bp.user.tracking == 'true'){
				//if not already clicked
				if(!$('.ext-bp input[data-setting="countCheckListsTowardsComplete"]').prop('checked')){
					//auto-uncheck tracking checklist items
					$('.ext-bp input[data-setting="countCheckLists"]').click();
				}
			}
		});

		//special condition for counting checklist setting
		$('body').on('change','.ext-bp .bp-settings input[data-setting="countCheckLists"]',function(){
			//if checked
			if($(this).prop('checked')){
				//show option for checklist items
				$('.ext-bp input[data-setting="countCheckListsTowardsComplete"]').parent().slideDown();

				//check if counting points
				if(bp.user.tracking == 'true'){
					//if not already checked
					if(!$('.ext-bp input[data-setting="countCheckListsTowardsComplete"]').prop('checked')){
						//force counting checklist items
						$('.ext-bp input[data-setting="countCheckListsTowardsComplete"]').click();
					}
				}
			}else{
				//hide option for checklist items
				$('.ext-bp input[data-setting="countCheckListsTowardsComplete"]').parent().slideUp();
			}
		});

		//special condition for switching between counting cards and points
		$('body').on('change','.ext-bp .bp-settings input[data-setting="tracking"]',function(){
			//if tracking points
			if($(this).prop('id') == 'bp-points'){
				//disable the input for tracking completed items
				if(!$('.ext-bp input[data-setting="countCheckListsTowardsComplete"]').prop('checked')){
					$('.ext-bp input[data-setting="countCheckListsTowardsComplete"]').click();
				}
			}
		});

		//reload when the done list setting is changed
		$('body').on('change','.ext-bp .bp-doneList',function(){
			//reset the selected list
			bp.sys.lastSelectedList = [];

			//loop through selected lists
			$.each($(this).find('option:selected'),function(i,v){
				bp.sys.lastSelectedList.push(v.value); //save the input value
			});

			//save the newly selected list
			// bp.sys.lastSelectedList = $(this).find('option:selected').val(); //update in script
			saveLocal('lastSelectedList',bp.sys.lastSelectedList); //save to the browser

			//update the progress
			loadData();
		});

		//listen for the window to be resized and update bar width
		$(window).on('resize',function(){
			$('.ext-bp .bp-barContainer,.ext-bp .bp-settings').animate({ width: window.innerWidth - 40 });
		});

		//open/close settings
		$('body').on('click','.ext-bp .bp-optionsIcon',function(){
			var $this = $(this);

			//if not open, open it
			if(!$this.hasClass('bp-active')){
				bp.sys.settingsOpen = true; //update script
				$this.addClass('bp-active'); //mark as open
				$('.ext-bp .bp-settings').slideDown('fast'); //open the menu
			}else{
				bp.sys.settingsOpen = false; //update script
				$this.removeClass('bp-active'); //remove mark
				$('.ext-bp .bp-settings').slideUp(); //close the menu
			}

			//save the new setting
			saveLocal('settingsOpen',bp.sys.settingsOpen);
		});

		//close settings
		$('body').on('click','.ext-bp .bp-saveSettings',function(){
			$('.ext-bp .bp-optionsIcon').trigger('click'); });
	}

	//get the board data
	function getBoard(){
		var curShortLink = window.location.pathname.split('/')[2];
		//get the current board id from the shortLink in the url
		return { id:(IdCache.getBoardId(curShortLink) || IdCache.getBoardIdForCard(curShortLink)) };
	}

	//save the settings back to the browser
	function saveLocal(key,val){
		if(!curBoard){ return; } //error check
		browser[curBoard][key] = val; //save the value locally
		localStorage.setItem('ext-bp',JSON.stringify(browser)); //save to the browser
	}

	//load settings from the browser
	function loadLocal(){
		//load the settings from localStorage
		var local = JSON.parse(localStorage.getItem('ext-bp') || '{}');

		//check that the current board has saved settings
		if(!local[curBoard]){ local[curBoard] = {}; }

		//send it back up top
		return local;
	}

	//push the progress bar to the UI if it doesn't exist
	function injectUI(){
		//check if on the same board and reset variables
		curBoard = getBoard().id;
		if(curBoard != bp.sys.lastBoardURL){ bp = resetVars(); bp.sys.lastBoardURL = curBoard; }

		//if the UI doesn't exist
		if(!document.getElementsByClassName('ext-bp').length){
			$('.board-header').after(injectedHTML); //add html to the page

			/* CREATE THE INITIAL SETTINGS */
			//determine tracking
			$('.ext-bp input[data-setting="tracking"][value="'+(browser[curBoard].tracking || 'false')+'"]').prop('checked',true);
			//counting checklist
			$('.ext-bp input[data-setting="countCheckLists"]').prop('checked',browser[curBoard].countCheckLists);
			//counting checklist items
			$('.ext-bp input[data-setting="countCheckListsTowardsComplete"]').prop('checked',browser[curBoard].countCheckListsTowardsComplete);
			//if checklist items should be shown
			if(browser[curBoard].countCheckLists){ $('.ext-bp input[data-setting="countCheckListsTowardsComplete"]').parent().slideDown(); }

			//open the progress bar
			$('.ext-bp').slideDown(continueLoad);
		}else{ continueLoad(); }

		//allows inject animation to complete
		function continueLoad(){
			//detect width changes
			var curMenuOpen = !$('.board-wrapper').hasClass('disabled-all-widgets');
			if(bp.sys.lastMenuOpen !== curMenuOpen){
				//save for next check
				bp.sys.lastMenuOpen = curMenuOpen;

				//if menu open
				var newWidth = window.innerWidth - 40;
				if(curMenuOpen){
					//set width to header
					// newWidth = $('.board-header').width();
				}

				//set the UI width
				$('.ext-bp .bp-barContainer,.ext-bp .bp-settings').delay(100).animate({width:newWidth}).find('.bp-pc').slideDown();
			}

			//if supposed to be open, but not
			if(bp.sys.settingsOpen && !$('.ext-bp .bp-optionsIcon').hasClass('bp-active')){ $('.ext-bp .bp-optionsIcon').trigger('click'); }

			//reload the data
			loadData();
		}
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

		//if there are no lists, exit
		if(!nextDoneList.length){ return false; }

		//if a selected list hasn't been specified
		if(!bp.sys.lastSelectedList.length){
			//loop through list of keywords to check titles against
			for(var i = 0, ii = bp.backupKeywords.length; i < ii; i++){
				//loop through each list title
				for(var x = 0, xx = nextDoneList.length; x < xx; x++){
					//if this keyword exists in this lists title
					if(nextDoneList[x].title.toLowerCase().indexOf(bp.backupKeywords[i].toLowerCase()) >= 0){
						bp.sys.lastSelectedList.push(nextDoneList[x].id); //add this list as selected
						// bp.sys.lastSelectedList = nextDoneList[x].id; //set this list as selected
						// ii = xx = 0; //selection found, break out of all loops
					}
				}
			}

			//set the first list as selected if still not set
			if(!bp.sys.lastSelectedList.length){ bp.sys.lastSelectedList.push(nextDoneList[0].id); }
		}

		//compare the nextDoneList with lastDoneList
		if(JSON.stringify(nextDoneList) != JSON.stringify(bp.lastDoneList)){
			//update lastDoneList with nextDoneList
			bp.lastDoneList = JSON.parse(JSON.stringify(nextDoneList));

			//loop through nextDoneList
			for(var n = 0, nn = nextDoneList.length; n < nn; n++){
				//create the option lists AND set selected
				listOptions.push('<option value="'+nextDoneList[n].id+'"'+(bp.sys.lastSelectedList.indexOf(nextDoneList[n].id) >= 0 ? ' selected':'')+'>'+nextDoneList[n].title+'</option>');
				// listOptions.push('<option value="'+nextDoneList[n].id+'"'+(nextDoneList[n].id == bp.sys.lastSelectedList ? ' selected':'')+'>'+nextDoneList[n].title+'</option>');
			}

			//output the list to the page
			$('.ext-bp .bp-doneList').html(listOptions.join(''));
		}

		return true; //let the parent know to continue
	}

	//refresh the data from the board
	function loadData(){
		//reset
		bp.math.progressMax = 0;
		bp.math.progressComplete = 0;

		//config
		var boardId = 'board_' + getBoard().id;
		_lists = window.ModelCache._cache.List;
		_cards = window.ModelCache._cache.Card;

		//try updating the drop down. If there are no lists, try again (with buffer).
		if(!updateDoneOptions(_lists)){ setTimeout(loadData,100); return; }

		//for each list
		for(var listID in _lists){
			if(!_lists.hasOwnProperty(listID)){ continue; } //skip if not a list
			if(_lists[listID].attributes.closed){ continue; } //skip if the list is closed

			//loop through each card
			for(var cardID in _cards){
				if(!_cards.hasOwnProperty(cardID)){ continue; } //skip if not a card
				if(_cards[cardID].attributes.closed){ continue; } //skip if the card is closed
				if(_cards[cardID].attributes.idList != listID){ continue; } //skip if the card doesn't belong to this list

				//cache
				var currentCard = _cards[cardID];

				//track card worth and location
				var inComplete = false, toComplete = 0, toMax = 0;

				//detect if in "complete" list
				inComplete = (bp.sys.lastSelectedList.indexOf(listID) >= 0);

				//count checklists?
				if(bp.user.countCheckLists){
					//loop through each checklist for this card
					for(var i = 0, ii = currentCard.checklistList.length; i < ii; i++){
						var checklistItems = currentCard.checklistList.models[i].attributes.checkItems; //cache

						//skip if there are no items
						if(!checklistItems){
							continue;
						}

						//count items toComplete?
						if(bp.user.countCheckListsTowardsComplete){
						//yes
							toMax++; //count card as 1
							if(inComplete){ toComplete++; } //if card is in complete list, count it.

							//loop through each checklist item
							for(var a = 0, aa = checklistItems.length; a < aa; a++){
								//toMax + 1
								toMax++;

								//if item is checked, toComplete
								if(checklistItems[a].state == 'complete'){ toComplete++; }
							}
						}
						//no
						else{
							//track total toMax (ex 10)
							toMax += checklistItems.length;

							//if inComplete, track (ex 10) toComplete
							if(inComplete){ toComplete += checklistItems.length; }
						}
					}
				}

				/* UPDATE TRACKERS */
				//track scrum points
				if(bp.user.tracking == 'true'){
					//determine the number of points on the card
					var cardPoints = Number((_cards[cardID].attributes.name.match(/\([0-9.]+(?=\))/gi) || ['(0'])[0].split('(')[1]);

					//if this card has points AND checklists were found
					if(cardPoints && toMax){
						//find number of points complete with a percentage, replace toComplete
						toComplete = cardPoints * (toComplete / toMax);
					}else{
						//if inComplete, add (ex 10) to toComplete //else reset in case checklist are counted
						if(inComplete){ toComplete = cardPoints; }else{ toComplete = 0; }
					}

					//track total points toMax (ex 10)
					toMax = cardPoints;

					//if inComplete, count all towards complete
					if(inComplete){ toComplete = cardPoints; }
				}
				//or track cards
				else{
					//if card not counted via checklists already
					if(!toMax){
						//track 1 toMax
						toMax++;

						//if inComplete, add 1 to toComplete
						if(inComplete){ toComplete++; }
					}
				}

				bp.math.progressMax += toMax; //add toMax to global
				bp.math.progressComplete += toComplete; //add toComplete to global
			}
		}

		//update the progress on the board
		updateProgress();
	}

	//update the progress bar
	function updateProgress(){
		var newPercent = 0, //default
			animateSpeed = 400;

		//if total is 0, show 100% completion
		if(!bp.math.progressMax){
			bp.math.progressComplete = 1;
			bp.math.progressMax = 1;
		}

		//determine new percentage
		newPercent = Math.floor((bp.math.progressComplete / bp.math.progressMax) * 100);

		//don't update if nothing changed from last time
		if(bp.math.nextPercentage == newPercent){ return; }

		//update the global var for next check
		bp.math.nextPercentage = newPercent;

		//adjust the progress bar width
		$('.bp-progress').animate({width:newPercent+'%'},animateSpeed);

		//determine how to add/remove to the text
		var diff = (newPercent - bp.math.lastPercentage).toFixed(0);

		//change the text over the course of animateSpeed
		var numLoops = 0, stepLength = 25;
		var animate = setInterval(function(){
			numLoops += stepLength;

			//update the percentage text
			$('.bp-progress .bp-pc').text(Math.floor(Math.abs(bp.math.lastPercentage += (diff/(animateSpeed/stepLength))))+'%');

			//determine if text should be updated again
			if(numLoops >= animateSpeed){
				//reset last percentage to the new one
				bp.math.lastPercentage = newPercent;

				//stop looping
				clearInterval(animate);

				//output the final percentage (accounts for any errors)
				$('.bp-progress .bp-pc').text(newPercent+'%');
			}
		},stepLength);
	}
})(jQuery);