//Announcement of the Namespace
var tooskiTeams = {
	//TODO: Change this line:
	ServerUrl: 'http://localhost/tooski/api/',
	storage: localStorage,
	
	
	//TODO: Implement function:
	getLastNews: function() {
		return true;
	},
	
	makeRequest: function(page, object, callback) {
		$.ajax(this.ServerUrl+page+'.php', {
			data: object,
			type: 'POST'
		}).done(callback);
	},
	
	encrypt: function(message, key) {
		return Aes.Ctr.encrypt(message, '1'+key, 256);
	},
	
	decrypt: function(message, key) {
		return Aes.Ctr.decrypt(message, '1'+key, 256);
	},
	
	login: function() {
		var pseudo = $('#pseudo').val();
		var password = $('#password').val();
		var identifier = this.getUniqueIdentifier();
		this.makeRequest('login', {
			login: pseudo,
			pass: this.encrypt(password, password), 
			id: identifier
		}, function(data) {
			var response = $.parseJSON(data);
			if (response.state == 1) {
				$('#loginMessage').html('<center><p><i><font color="green">'+response.message+'</font></i></p></center>');
				tooskiTeams.storage.keyId = response.id;
				tooskiTeams.init();
			}
			else if (response.state == 0) {
				$('#loginMessage').html('<center><p><i><font color="red">'+response.message+'</font></i></p></center>');
			}
			else {
				$('#loginMessage').html('<center><p><i><font color="red">Problèmes de connexion avec le serveur.</font></i></p></center>');
			}
		});
		//Storing the Important data.
		this.storage.user = pseudo;
		this.storage.password = password;
		this.storage.key = identifier;
	},
	
	getUniqueIdentifier: function() {
		return (new Date().getTime() + '' + Math.random().toString(36).substring(7)).substring(0, 22);
	},
	
	loadLoginPage: function() {
		$.mobile.changePage('html/login.html', {
			role: 'dialog'
		});
	},
	
	loggedIn: function() {
		return (this.storage.user && this.storage.key && this.storage.keyId);
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


