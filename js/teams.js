//Announcement of the Namespace
var tooskiTeams = {
	//TODO: Change this line:
	ServerUrl: 'http://localhost/tooski/api/',
	storage: window.localStorage,
	
	
	makeRequest: function(page, object) {
		var response;
		$.ajax(this.ServerUrl+page+'.php', {
			data: object,
			type: 'POST',
			success: function(){
				
			}
		});
	},
	
	encrypt: function(message, key) {
		return Aes.Ctr.encrypt(message, key, 256);
	},
	
	decrypt: function(message, key) {
		return Aes.Ctr.decrypt(message, key, 256);
	},
	
	login: function() {
		var pseudo = $('#pseudo').val();
		var password = $('#password').val();
		var identifier = this.getUniqueIdentifier();
		alert(identifier);
		this.makeRequest('login', {
			login: pseudo,
			pass: password, 
			id: identifier
		});
	},
	
	getUniqueIdentifier: function() {
		return (new Date().getTime() + '' + Math.random().toString(36).substring(7)).substring(0, 22);
	},
	
	loadLoginPage: function() {
		$.mobile.changePage('html/login.html', {
			role: 'dialog'
		});
	},
	//TODO: Implement function.
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


