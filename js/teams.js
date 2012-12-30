//Announcement of the Namespace
var tooskiTeams = {
	//TODO: Change this line:
	ServerUrl: 'http://192.168.0.106/tooski/api/',
	//TODO: change this line:
	base_url: '',
	storage: localStorage,
	db: null,
	nbNewsToShow: 25,
	
	
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
		return '{"news": [{"title":"Première", "id":"1", "date":"1356889379", "text":"Dernière à afficher. Elle contient une image: <br /><img src=\'http://tooski.ch/assets/uploads/files/header.png\' />" },{"title":"Deuxième", "id":"2", "date":"1356889441", "text":"Mais première à être affichée." },{"title":"Troisième", "id":"3", "date":"1356889421", "text":"Mais c\'est celle du milieu." }]}';
	},
	
	getNewsIntoDB: function(teamId) {
		var newsJson = this.getLastNewsFromServer(teamId);
		var obj = $.parseJSON(newsJson);
		this.db.transaction(function(tx) {
			for (var i=0; i < obj.news.length; i++) {
				tx.executeSql('INSERT OR REPLACE INTO news(id, idTeam, title, text, date) VALUES (?, ?, ?, ?, ?)',
				[obj.news[i].id, teamId, obj.news[i].title, obj.news[i].text, obj.news[i].date],
				function(){},
				this.dbError);
			}
		});
		//TODO: Uncomment: this.storage.hasNewsInDB = true;
	},
	
	createTeamNewsPreview: function(title, text, id) {
		if (text.indexOf('<img') != -1) {
			var image = text.substring(text.indexOf('<img'));
			image = image.substring(0, image.indexOf('>')+1);
			image = image.substring(image.indexOf('src=')+5);
			if (image.indexOf('\'') != -1) {
				image = image.substring(0, image.indexOf('\''));
			}
			if (image.indexOf('"') != -1) {
				image = image.substring(0, image.indexOf('"'));
			}
			var content = '<img src="'+image+'" width="100%" />';
		}
		else {
			var content = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').substring(0, 125)+'...';
		}
		return '<div onclick="alert('+id+');" style="border:solid black 1px; display:block;margin:25px;"><div><h2 style="margin:0px;padding:5px;">'+title+'</h2></div><div>'+content+'</div></div>';
	},
	
	showListNewsFromDb: function(teamId) {
		this.db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM news WHERE idTeam=? ORDER BY date DESC', 
			[teamId],
			function(tx, rs) {
				var html='<center>';
				for (var i=0; i < tooskiTeams.nbNewsToShow && i < rs.rows.length; i++) {
					html += tooskiTeams.createTeamNewsPreview(rs.rows.item(i).title, rs.rows.item(i).text, rs.rows.item(i).id);
				}
				html += '</center>';
				$('#content').html(html);
			},
			this.dbError);
		});
	},
	
	hasNewsInDB: function() {
		if (false) {//(this.storage.hasNewsInDB) {
			return true;
		}
		return false;
	},
	
	loadTeamNews: function(teamId) {
		if (this.hasNewsInDB()) {
			this.showListNewsFromDb(teamId);
		}
		this.getNewsIntoDB(teamId);
		this.showListNewsFromDb(teamId);
	},
	
	loadTeamCalendar: function(teamId) {
		alert('Calendar');
	},
	
	loadTeamPhoto: function(teamId) {
		alert('Photos');
	},
	
	selectTeam: function(teamId) {
		$('[id*="panel-team-"]').css('background-color', '');
		$('#panel-team-'+teamId).css('background-color', '#2cabec');
		$('#panel').panel('close', {display: 'reveal'});
		$('#menu-news').attr('onclick', 'tooskiTeams.loadTeamNews('+teamId+')');
		$('#menu-photos').attr('onclick', 'tooskiTeams.loadTeamPhoto('+teamId+')');
		$('#menu-calendar').attr('onclick', 'tooskiTeams.loadTeamCalendar('+teamId+')');
		this.loadTeamNews(teamId);
	},
	
	generateTeamMenu: function() {
		$('#panel').html('<h3 style="margin-bottom:0px;margin-top:10px;margin-left:15px;" align="center">Teams</h3><hr style="maring-left:5px;" align="center" height="10px" width="90%" /><hr color="black" size="2px" width="100%" style="margin-bottom:0px;">');
		this.db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM teams',
			[],
			function(tx, rs){
				var html = '';
				for (var i=0; i < rs.rows.length; i++) {
					if (i == 0) {
						html += '<div id="panel-team-'+rs.rows.item(i).id+'" onClick="tooskiTeams.selectTeam('+rs.rows.item(i).id+');" style="padding-left:5px;border-bottom:solid black 2px;padding-top:0px;padding-bottom:0px;margin-top:0px;margin-bottom:0px;"><h4 style="padding-top:16px;padding-bottom:12px;margin-top:0px;margin-bottom:0px;"><img src="'+rs.rows.item(i).logo+'" style="max-height:30px;max-width:75px;margin-right:10px;vertical-align:middle;" />'+rs.rows.item(i).name+'</h4></div>';
					}
					else {
						html += '<div id="panel-team-'+rs.rows.item(i).id+'" onClick="tooskiTeams.selectTeam('+rs.rows.item(i).id+');" style="padding-left:5px;border-bottom:solid black 2px;padding-top:0px;padding-bottom:0px;margin-top:0px;margin-bottom:0px;"><h4 style="padding-top:10px;padding-bottom:8px;margin-top:0px;margin-bottom:0px;"><img src="'+rs.rows.item(i).logo+'" style="max-height:30px;max-width:75px;margin-right:10px;vertical-align:middle;" />'+rs.rows.item(i).name+'</h4></div>';
					}
					
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
			tx.executeSql('CREATE TABLE IF NOT EXISTS news(id INTEGER PRIMARY KEY ASC, idTeam TEXT, title TEXT, text TEXT, date TEXT)', [],function(){} ,this.dbError);
			tx.executeSql('CREATE UNIQUE INDEX news_idx ON news(id))', [],function(){} ,this.dbError);
			tx.executeSql('CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY ASC, idTeam TEXT, title TEXT, description TEXT, date TEXT, place TEXT, file TEXT)', [],function(){} ,this.dbError);
			tx.executeSql('CREATE UNIQUE INDEX events_idx ON events(id))', [],function(){} ,this.dbError);
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


