//Announcement of the Namespace
var tooskiTeams = {
	//TODO: Change this line:
	ServerUrl: 'http://192.168.0.106/tooski/api/',
	//TODO: change this line:
	base_url: '',
	storage: localStorage,
	db: null,
	
	
	//TODO: Implement function:
	getLastNews: function() {
		return true;
	},
	
	makeRequest: function(page, object, cbFunction) {
		$.ajax(this.ServerUrl+page+'.php', {
			data: object,
			dataType: 'jsonp',
			type: 'POST'
		}).done(cbFunction);
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
		//Storing the Important data.
		this.storage.user = pseudo;
		this.storage.password = password;
		this.storage.key = identifier;
		this.makeRequest('login', {
			login: pseudo,
			pass: this.encrypt(password, password), 
			id: identifier
		}, function(data) {
			var response = $.parseJSON(data);
			if (response.state == 1) {
				$('#loginMessage').html('<center><p><i><font color="green">'+response.message+'</font></i></p></center>');
				tooskiTeams.storage.keyId = response.id;
				$(document).bind('pagechange', function() {
					tooskiTeams.init();
				});
				$.mobile.changePage('index.html', {reloadPage:true, allowSamePageTransition:true});
			}
			else if (response.state == 0) {
				$('#loginMessage').html('<center><p><i><font color="red">'+response.message+'</font></i></p></center>');
			}
			else {
				$('#loginMessage').html('<center><p><i><font color="red">Problèmes de connexion avec le serveur.</font></i></p></center>');
			}
		});
	},
	
	getUniqueIdentifier: function() {
		return (new Date().getTime() + '' + Math.random().toString(36).substring(7)).substring(0, 22);
	},
	
	loadLoginPage: function() {
		$.mobile.loadPage(this.base_url+'html/login.html', {
			role: 'dialog'
		}).done(function() {
			$('div[data-url="/tooski_mobile/html/login.html"]').attr('id', 'loginPage');
			$.mobile.changePage('#loginPage');
			$('div[data-role="header"] > a[data-icon="delete"]').hide();
		});
	},
	
	getLastNewsFromServer: function(teamId) {
		this.storage.hasNewsInDB = true;
		return
	},
	
	showListNewsFromDb: function(teamId) {
		
	},
	
	hasNewsInDB: function() {
		if (this.storage.hasNewsInDB) {
			return true;
		}
		return false;
	},
	
	loadTeamNews: function(teamId) {
		$('#panel').panel('close', {display: 'reveal'});
		this.message('show', '');
		if (this.hasNewsInDB()) {
			this.showListNewsFromDb(teamId);
			this.message('hide', '');
		}
		this.getLastNewsFromServer(teamId);
		this.showListNewsFromDb(teamId);
	},
	
	generateTeamMenu: function() {
		$('#panel').html('<h3 style="margin-bottom:0px;margin-top:10px;margin-left:15px;" align="center">Teams</h3><hr style="maring-left:5px;" align="center" height="10px" width="90%" /><hr color="black" size="2px" width="100%" style="margin-bottom:10px;">');
		this.db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM teams',
			[],
			function(tx, rs){
				var html = '';
				for (var i=0; i < rs.rows.length; i++) {
					html += '<div onClick="tooskiTeams.loadTeamNews('+rs.rows.item(i).id+');" style="padding-left:5px;border-bottom:solid black 2px;padding-top:0px;padding-bottom:0px;margin-top:0px;margin-bottom:0px;"><h4 style="padding-top:5px;padding-bottom:4px;margin-top:5px;margin-bottom:4px;"><img src="'+rs.rows.item(i).logo+'" style="max-height:30px;max-width:75px;margin-right:10px;vertical-align:middle;" />'+rs.rows.item(i).name+'</h4></div>';
				}
				$('#panel').append(html);
			},
			tooskiTeams.dbError
			);
		});
	},
	
	dbError: function() {
		alert('Problème lors de la connexion à la base de donnée. Veuillez relancer l\'app en cas de récidive.');
	},
	
	getWelcomePage: function() {
		this.change('welcome');
	},
	
	message: function(state, text) {
		$.mobile.loading(state, {
			text:text, 
			textonly:false, 
			textVisible:true
		});
	},
	
	loggedIn: function() {
		if (this.storage.user && this.storage.key && this.storage.keyId) {
			return true;
		}
		return false;
	},
	//TODO: Implement with this.makeRequest and server side.
	getTeamFromServer: function() {
		return '{"length":3, "name":["Tooski Team", "Ski-Romand Junior", "Guggen"],"id":["6", "10", "11"], "logo":["http://tooski.ch/assets/uploads/files/header.png", "http://www.ski-romand.ch/themes/skiromand-2/templates/logo.png", "http://seba1511.com/LogoTooskiTeam/image.php?w=187&h=73&t=Guggenmusik"], "email":["info@tooski.ch", "pokerstar1511@gmail.com", "test@test.com"] }';
	},
	
	storeTeamsInDatabase: function(teamJson) {
		var team = $.parseJSON(teamJson);
		this.db.transaction(function(tx){
			for (var i=0; i<team.length; i++) {
				tx.executeSql('INSERT INTO teams(id, name, logo, email) VALUES (?, ?, ?, ?)',
					[team.id[i], team.name[i], team.logo[i], team.email[i]],
					function() {},
					this.dbError
				);
			}
		});
		this.storage.hasTeamSettings = true;
	},
	
	initializeDatabase: function() {
		this.db = openDatabase('teamDB', '1.0', 'The Tooski Team App Database', 65536);
		this.db.transaction(function(tx){
			tx.executeSql('CREATE TABLE IF NOT EXISTS teams(id INTEGER PRIMARY KEY ASC, name TEXT, logo TEXT, email TEXT)', [],function(){} ,this.dbError);
		});
	},
	
	getTeamSettings: function() {
		var teamJson = this.getTeamFromServer();
		this.initializeDatabase();
		this.storeTeamsInDatabase(teamJson);
	},
	
	hasTeamSettings: function() {
		return false;//this.storage.hasTeamSettings;//check in db !
	},
	
	/*
	 * The first function to be called when the app is started.
	 */
	init: function() {
		this.message('show', 'Chargement en cours...');
		if (this.loggedIn()) {
			if (!this.hasTeamSettings()) {
				this.getTeamSettings();
			}
			this.generateTeamMenu();
			this.getWelcomePage();
		}
		else {
			this.loadLoginPage();
		}
		this.message('hide', 'Chargement en cours...');
	},
	
	/*
	 * Use this function when you want to call a page,
	 * and then execute a specific function.
	 */
	change: function(page, functionToCall) {
		$('#content').load(this.base_url+'html/'+page+'.html', function() {
			if (functionToCall) {
					functionToCall();
			}
		});
	}
}


