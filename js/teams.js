//Announcement of the Namespace
var tooskiTeams = {
	
	login: function() {
		
	},
	
	loadLoginPage: function() {
		$.mobile.changePage('html/login.html', {
			role: 'dialog'
		});
	},
	
	loggedIn: function() {
		return false;
	},
	
	/*
	 * The first function to be called when the app is started.
	 */
	init: function() {
		if (this.loggedIn()) {
			if (this.hasTeamSettings()) {
				this.loadWelcomePage();
			}
			else {
				this.getTeamsSettings();
			}
		}
		else {
			this.loadLoginPage();
		}
	},
	
	/*
	 * Use this function when you want to call a page,
	 * and then execute a specific function.
	 */
	change: function(page, functionToCall) {
		$('#content').load('html/'+page+'.html', function() {
			if (functionToCall) {
					functionToCall();
			}
		});
	}
}


