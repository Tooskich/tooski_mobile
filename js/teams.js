//Announcement of the Namespace
var tooskiTeams = {
	//TODO: Change this line:
	ServerUrl: 'http://192.168.0.106/tooski/api/',
	//TODO: change this line:
	base_url: '',
	storage: localStorage,
	db: openDatabase('tooskiteamDB', '1.0', 'The Tooski Team App Database', 65536),
	nbNewsToShow: 25,
	nbEventsToShow: 25,
	
	
	makeRequest: function(page, object, cbFunction) {
		$.ajax(this.ServerUrl+page+'.php', {
			data: object,
			dataType: 'jsonp',
			type: 'POST',
			success: function (data) {
				cbFunction(data);
			} 
		});
	},
	
	encrypt: function(message, key) {
		return Aes.Ctr.encrypt(''+message, '1'+key, 256);
	},
	
	decrypt: function(message, key) {
		return Aes.Ctr.decrypt(''+message, '1'+key, 256);
	},
	
	login: function() {
		var pseudo = $('#pseudo').val();
		var password = $('#password').val();
		var identifier = this.getUniqueIdentifier();
		//Storing the Important data.
		this.storage.user = pseudo;
		this.storage.password = password;
		this.storage.key = ''+identifier;
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
		this.initializeDatabase();
	},
	//TODO: Implement with server. Note: Server should return only +-100 last news.
	getLastNewsFromServer: function(teamId) {
		tooskiTeams.makeRequest('news', {
			id: this.storage.keyId,
			team: teamId
		}, function (data) {
			tooskiTeams.insertNewsInDB(data);
			alert(data);
		}); 
		//'{"news": [{"title":"Première", "id":"1", "date":"1356889379", "text":"Dernière à afficher. Elle contient une image: <br /><img src=\'http://tooski.ch/assets/uploads/files/header.png\' />" },{"title":"Deuxième", "id":"2", "date":"1356889441", "text":"Mais première à être affichée." },{"title":"Troisième", "id":"3", "date":"1356889421", "text":"Mais c\'est celle du milieu." }]}';
	},
	
	insertNewsInDB: function (newsJson) {
		var obj = $.parseJSON(newsJson);	
		alert('ok')
		this.db.transaction(function(tx) {
			for (i in obj.news) {
				alert('asd')
				var nId = parseInt(this.decrypt(obj.news[i].id, this.storage.key));
				var nTitle = this.decrypt(obj.news[i].title, this.storage.key);
				var nText = this.decrypt(obj.news[i].text, this.storage.key);
				var nDate = this.decrypt(obj.news[i].date, this.storage.key);
				(function(id, idTeam, title, text, date){
					tx.executeSql('INSERT OR REPLACE INTO news(id, idTeam, title, text, date) VALUES (?, ?, ?, ?, ?)',
					[id, idTeam, title, text, date],
					function(){},
					this.dbError);
				})(nId, 6, nTitle, nText, nDate);
			}
		});
		//TODO: Uncomment: this.storage.hasNewsInDB = true;
	},
	
	getNewsIntoDB: function(teamId) {
		this.getLastNewsFromServer(teamId);
	},
	
	showNews: function(newsId) {
		this.db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM news WHERE id=?', 
			[newsId],
			function(tx, rs) {
				news = rs.rows.item(0);
				tooskiTeams.change('news', function(){
					var date = new Date(news.date * 1000);
					$('#newsTitle').html(news.title);
					$('#newsDate').html(date.getDate()+'.'+date.getMonth()+'.'+date.getFullYear()+' à '+date.getHours()+':'+date.getMinutes());
					$('#newsContent').html(news.text);
				});
			},
			tooskiTeams.dbError
			);
		});
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
			var content = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').substring(0, 300)+'...';
		}
		return '<div onclick="tooskiTeams.showNews('+id+');" class="team-news-div-preview"><div><h2 style="margin:0px;padding:5px;">'+title+'</h2></div><div>'+content+'</div></div>';
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
	
	hasEventsInDB: function() {
		if (false){//this.storage.hasEventsInDB) {
			return true;
		}
		return false;
	},
	//TODO: Implement with server connection Note: the server should return ALL events from its database. 
	getLastEventsFromServer: function(teamId) {
		return '{"event":[{"id":"1", "title":"First", "place":"Anywhere", "description":"Description of the last event to show...", "date":"1356905341", "file":"-"},{"id":"2", "title":"Second", "place":"Where you want it", "description":"This one is the second event. Won\'t happen anyway...", "date":"1356905361", "file":"http://www.tooski.ch/randomfile.txt"},{"id":"3", "title":"Third Event yahooooooooo", "place":"????????????", "description":"This one only has extra long texts. This means extra long title, extra long date, extra long description, extralong filename, extralong everything. It is the first one to be showed, and let\'s see if it works correctly...", "date":"1356905380", "file":"http://www.tooski.ch/extra/long/u/r/l/youcannotseewhatiwrite/random/file/yahooooooooooo/google/file.txt"}]}';
	},
	
	getEventsIntoDB: function(teamId) {
		var eventsJson = this.getLastEventsFromServer(teamId);
		var obj = $.parseJSON(eventsJson);
		this.db.transaction(function(tx) {
			for (var i=0; i < obj.event.length; i++) {
				tx.executeSql('INSERT OR REPLACE INTO events(id, idTeam, title, description, date, place, file) VALUES (?, ?, ?, ?, ?, ?, ?)',
				[obj.event[i].id, teamId, obj.event[i].title, obj.event[i].description, obj.event[i].date, obj.event[i].place, obj.event[i].file],
				function(){},
				this.dbError);
			}
		});
		//TODO: Uncomment: this.storage.hasEventsInDB = true;
	}, 
	
	createTeamEventView: function(title, description, date, place, file) {
		date = new Date(date * 1000);
		date = 'Le ' + date.getDate() + '.' + date.getMonth() + '.' + date.getFullYear();
		return '<div class="eventContainer"><div class="eventHeader"><h2 align="left" class="eventHeaderTitle">'+title+'</h2><p align="right" class="eventHeaderDate">'+date+'</p></div><div class="eventContent"><p align="justify">'+description+'</p></div><div class="eventFooter"><table width="100%"><tr><td><h3>Quand</h3><p>'+date+'</p></td><td><h3>Où</h3><p>'+place+'</p></td><td><h3>Infos</h3><p><a data-role="button" data-icon="info" data-inline="true" data-mini="true" href="'+file+'">Télécharger</a></p></td></tr></table></div></div>';
	},
	
	showListEventsFromDB: function(teamId) {
		this.db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM events WHERE idTeam=? ORDER BY date DESC', 
			[teamId],
			function(tx, rs) {
				var html='<center>';
				for (var i=0; i < tooskiTeams.nbEventsToShow && i < rs.rows.length; i++) {
					html += tooskiTeams.createTeamEventView(rs.rows.item(i).title, rs.rows.item(i).description, rs.rows.item(i).date, rs.rows.item(i).place, rs.rows.item(i).file);
				}
				html += '</center>';
				$('#content').html(html);
				$('#content').trigger('create');
			},
			this.dbError);
		});
	},
	
	loadTeamCalendar: function(teamId) {
		if (this.hasEventsInDB()) {
			this.showListEventsFromDB(teamId);
		}
		this.getEventsIntoDB(teamId);
		this.showListEventsFromDB(teamId);
	},
	
	hasPhotosInDB: function() {
		if (this.storage.hasPhotosInDB) {
			return true;
		}
		return false;
	},
	
	generatePhotoGallery: function(teamId)  {
		this.db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM photos WHERE idTeam=? ORDER BY date DESC', 
			[teamId],
			function(tx, rs) {
				var html='<center><div id="photoGallery" class="gallery">';
				for (var i=0; i < rs.rows.length; i++) {
					html += '<a class="imgContainer" href="'+$.cloudinary.url(rs.rows.item(i).filename)+'"><img src="'+$.cloudinary.url(rs.rows.item(i).filename,{width:300, crop:'fill'})+'" width="150px" alt="'+rs.rows.item(i).description+'" /></a>';
				}
				html += '</div></center>';
				$('#photoLibrary').html(html);
				$('#loader').trigger('create');
				$("#photoLibrary a").photoSwipe({
					enableMouseWheel: false , 
					enableKeyboard: false ,
					jQueryMobile: true,
					loop:false
				});
			},
			this.dbError);
		});
	},
	
	openNewUploadImageScreen: function(teamId) {
		alert('Upload Screen'+teamId);
	},
	
	preparePhotoPage: function(teamId) {
		$('#content').html('<div id="photoUpload"><center><button href="#" data-role="button" data-icon="plus" onClick="tooskiTeams.openNewUploadImageScreen('+teamId+');" >Ajouter des Photos</button></center></div><br /><hr size="2px" width="100%" /><h3>Galerie Photo</h3><div id="photoLibrary"></div>');
		$('#content').trigger('create');
	},
	//TODO: Implement with server connection. Should only return <= 100 results.
	getLastPhotosFromServer: function(teamId) {
		return '{"photo":[{"id":"1", "filename":"test.jpg", "description":"La première Photo", "date":"1357133799"}, {"id":"2", "filename":"test2.jpg", "description":"La deuxième photo", "date":"1357133815"}, {"id":"3", "filename":"test.jpg", "description":"La troisième Photo", "date":"1357133828"}, {"id":"4", "filename":"test4.jpg", "description":"La troisième Photo", "date":"1357133828"}, {"id":"5", "filename":"test5.jpg", "description":"La troisième Photo", "date":"1357133828"}, {"id":"6", "filename":"test6.jpg", "description":"La troisième Photo", "date":"1357133828"}]}';
	},
	
	getPhotoListIntoDB: function(teamId) {
		var photosJson = this.getLastPhotosFromServer(teamId);
		var obj = $.parseJSON(photosJson);
		this.db.transaction(function(tx) {
			for (var i=0; i < obj.photo.length; i++) {
				tx.executeSql('INSERT OR REPLACE INTO photos(id, idTeam, filename, description, date) VALUES (?, ?, ?, ?, ?)',
				[obj.photo[i].id, teamId, obj.photo[i].filename, obj.photo[i].description, obj.photo[i].date],
				function(){},
				this.dbError);
			}
		});
		//TODO: Uncomment: this.storage.hasPhotosInDB = true;
	},
	
	loadTeamPhoto: function(teamId) {
		this.preparePhotoPage(teamId);
		if (this.hasPhotosInDB()) {
			this.generatePhotoGallery(teamId);
		}
		this.getPhotoListIntoDB(teamId);
		this.generatePhotoGallery(teamId);
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
	
	dbError: function(tx, e) {
		alert('Problème lors de la connexion à la base de donnée. Veuillez relancer l\'app en cas de récidive.' + e.message);
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
		tooskiTeams.db.transaction(function(tx){
			tx.executeSql('CREATE TABLE IF NOT EXISTS teams(id INTEGER PRIMARY KEY ASC, name TEXT, logo TEXT, email TEXT)', [],function(){} ,this.dbError);
		});
		tooskiTeams.db.transaction(function(tx){
			tx.executeSql('CREATE TABLE IF NOT EXISTS news(id INTEGER PRIMARY KEY ASC, idTeam TEXT, title TEXT, text TEXT, date TEXT)', [],function(){} ,this.dbError);
		});
		tooskiTeams.db.transaction(function(tx){
			tx.executeSql('CREATE TABLE IF NOT EXISTS photos(id INTEGER PRIMARY KEY ASC, idTeam TEXT, filename TEXT, description TEXT, date TEXT)', [],function(){} ,this.dbError);
			
		});
		tooskiTeams.db.transaction(function(tx){
			tx.executeSql('CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY ASC, idTeam TEXT, title TEXT, description TEXT, date TEXT, place TEXT, file TEXT)', [],function(){} ,this.dbError);
			
		});
		tooskiTeams.db.transaction(function(tx) {
			tx.executeSql('CREATE UNIQUE INDEX news_idx ON news(id))', [],function(){} ,this.dbError);
			tx.executeSql('CREATE UNIQUE INDEX events_idx ON events(id))', [],function(){} ,this.dbError);
			tx.executeSql('CREATE UNIQUE INDEX photos_idx ON photos(id))', [],function(){} ,this.dbError);
		});
	},
	
	getTeamSettings: function() {
		this.initializeDatabase();
		var teamJson = this.getTeamFromServer();
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
		this.initializeDatabase();
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
			$('#content').trigger('create');
			if (functionToCall) {
					functionToCall();
			}
		});
	}
}


