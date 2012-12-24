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
		$.mobile.changePage('html/'+page+'.html', {
			transition: 'pop'
		});
		if (functionToCall) {
			$(document).bind('pagechange', function() {
				functionToCall();
				$(document).unbind('pagechange');
			})
		}
	}
}


