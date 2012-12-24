//Announcement of the Namespace
var tooskiTeams = {
	
	/*
	 * The first function to be called when the app is started.
	 */
	init: function() {
		
	},
	
	/*
	 * Use this function when you want to call a page,
	 * and then execute a specific function.
	 */
	change: function(page, functionToCall) {
		/*
		 $.mobile.changePage('html/'+page+'.html', {
			transition: 'pop'
		});
		*/
		$('#content').load('html/'+page+'.html', function() {
			if (functionToCall) {
					functionToCall();
			}
		});
	}
}


