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
			complete: cbFunction
		}).done(cbFunction);
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
		this.storage.secret = ''+identifier;
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

	//TODO: Implement server side.
	getNewsIntoDB: function(teamId) {
		tooskiTeams.makeRequest('news', {
			id: this.storage.keyId,
			team: teamId
		}, function (data) {
			var json = tooskiTeams.decrypt(data.responseText, tooskiTeams.storage.secret);
			var db = $.parseJSON(tooskiTeams.storage.db);
			db.team[teamId].news = json;
			tooskiTeams.storage.db = JSON.stringify(db);
			tooskiTeams.showListNewsFromDb(teamId);
			//TODO: Uncomment: this.storage.hasNewsInDB = true;
		}); 
	},
	
	showNews: function(newsId, teamId) {
		var team = $.parseJSON(tooskiTeams.storage.db).team[teamId];
		var news = $.parseJSON(team.news).news;
		news = $.grep(news, function(n, i) {return parseInt(tooskiTeams.urldecode(n.id)) == parseInt(newsId);});
		news = news[0];
		tooskiTeams.change('news', function(){
			var date = new Date(tooskiTeams.urldecode(news.date) * 1000);
			$('#newsTitle').html(tooskiTeams.urldecode(news.title));
			$('#newsDate').html(date.getDate()+'.'+date.getMonth()+'.'+date.getFullYear()+' à '+date.getHours()+':'+date.getMinutes());
			$('#newsContent').html(tooskiTeams.urldecode(news.text));
		});
	},
	
	createTeamNewsPreview: function(title, text, id, teamId) {
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
			var div = document.createElement("div");
			div.innerHTML = text;
			var content = '<p align="justify">'+(div.textContent || div.innerText || "").substring(0, 300)+'...'+'</p>';
		}
		return '<div onclick="tooskiTeams.showNews('+id+', '+teamId+');" class="team-news-div-preview"><div><h2 style="margin:0px;padding:5px;">'+title+'</h2></div><div>'+content+'</div></div>';
	},
	
	sortByDate: function (a, b) {
		if (parseInt(a.date) > parseInt(b.date)) {
			return -1;
		}
		if (parseInt(a.date) < parseInt(b.date)) {
			return 1;
		}
		return 0
	},
	
	urldecode: function(url) {
  		return decodeURIComponent(url.replace(/\+/g, ' '));
	},
	
	showListNewsFromDb: function(teamId) {
		var obj = $.parseJSON(this.storage.db);
		var obj = $.parseJSON(obj.team[teamId].news);
		obj.news.sort(this.sortByDate);
		var html = '<center>';
		for (var i=0; i < obj.news.length && i < tooskiTeams.nbNewsToShow; i++) {
			var title = this.urldecode(obj.news[i].title);
			var text = this.urldecode(obj.news[i].text);
			var id = this.urldecode(obj.news[i].id);
			html += tooskiTeams.createTeamNewsPreview(title, text, id, teamId);
		}
		html += '</center>';
		$('#content').html(html);
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
		this.makeRequest('events', {
			id: tooskiTeams.storage.keyId,
			team: teamId
		}, function(data) {
			var json = tooskiTeams.decrypt(data.responseText, tooskiTeams.storage.secret);
			var db = $.parseJSON(tooskiTeams.storage.db);
			db.team[teamId].events = json;
			tooskiTeams.storage.db = JSON.stringify(db);
			tooskiTeams.showListEventsFromDb(teamId);
			//TODO: Uncomment: this.storage.hasEventsInDB = true;
		});
	}, 
	
	createTeamEventView: function(title, description, date, place, file) {
		date = new Date(date * 1000);
		date = 'Le ' + date.getDate() + '.' + date.getMonth() + '.' + date.getFullYear();
		return '<div class="eventContainer"><div class="eventHeader"><h2 align="left" class="eventHeaderTitle">'+title+'</h2><p align="right" class="eventHeaderDate">'+date+'</p></div><div class="eventContent"><p align="justify">'+description+'</p></div><div class="eventFooter"><table width="100%"><tr><td><h3>Quand</h3><p>'+date+'</p></td><td><h3>Où</h3><p>'+place+'</p></td><td><h3>Infos</h3><p><a data-role="button" data-icon="info" data-inline="true" data-mini="true" href="'+file+'">Télécharger</a></p></td></tr></table></div></div>';
	},
	
	showListEventsFromDb: function(teamId) {
		var obj = $.parseJSON(this.storage.db);
		var obj = $.parseJSON(obj.team[teamId].events);
		obj.event.sort(this.sortByDate);
		var html = '<center>';
		for (var i=0; i < obj.event.length && i < tooskiTeams.nbEventsToShow; i++) {
			var title = this.urldecode(obj.event[i].title);
			var description = this.urldecode(obj.event[i].description);
			var date = this.urldecode(obj.event[i].date);
			var place = this.urldecode(obj.event[i].place);
			var file = this.urldecode(obj.event[i].file);
			html += tooskiTeams.createTeamEventView(title, description, date, place, file);
		}
		html += '</center>';
		$('#content').html(html);
		$('#content').trigger('create');
	},
	
	loadTeamCalendar: function(teamId) {
		if (this.hasEventsInDB()) {
			this.showListEventsFromDB(teamId);
		}
		this.getEventsIntoDB(teamId);
		this.showListEventsFromDb(teamId);
	},
	
	hasPhotosInDB: function() {
		if (this.storage.hasPhotosInDB) {
			return true;
		}
		return false;
	},
	
	generatePhotoGallery: function(teamId)  {
		var obj = $.parseJSON(this.storage.db);
		var obj = $.parseJSON(obj.team[teamId].photos);
		obj.photo.sort(this.sortByDate);
		var html = '<center>';
		for (var i=0; i < obj.photo.length; i++) {
			var filename = this.urldecode(obj.photo[i].filename);
			var description = this.urldecode(obj.photo[i].description);
			html += '<a class="imgContainer" href="'+$.cloudinary.url(filename)+'"><img src="'+$.cloudinary.url(filename,{width:300, crop:'fill'})+'" width="150px" alt="'+description+'" /></a>';
		}
		html += '</center>';$('#photoLibrary').html(html);
		$('#loader').trigger('create');
		$("#photoLibrary a").photoSwipe({
			enableMouseWheel: false , 
			enableKeyboard: false ,
			jQueryMobile: true,
			loop:false
		});
		$('#content').trigger('create');
		/*this.db.transaction(function(tx) {
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
		});*/
	},
	
	openNewUploadImageScreen: function(teamId) {
		alert('Upload Screen'+teamId);
	},
	
	preparePhotoPage: function(teamId) {
		$('#content').html('<div id="photoUpload"><center><button href="#" data-role="button" data-icon="plus" onClick="tooskiTeams.openNewUploadImageScreen('+teamId+');" >Ajouter des Photos</button></center></div><br /><hr size="2px" width="100%" /><h3>Galerie Photo</h3><div id="photoLibrary"></div>');
		$('#content').trigger('create');
	},
	
	getPhotoListIntoDB: function(teamId) {
		tooskiTeams.makeRequest('photo', {
			id: tooskiTeams.storage.keyId,
			team: teamId
		}, function (data) {
			var json = tooskiTeams.decrypt(data.responseText, tooskiTeams.storage.secret);
			var db = $.parseJSON(tooskiTeams.storage.db);
			db.team[teamId].photos = json;
			tooskiTeams.storage.db = JSON.stringify(db);
			tooskiTeams.generatePhotoGallery(teamId);
			//TODO: Uncomment: this.storage.hasPhotosInDB = true;
		});
		/*var photosJson = this.getLastPhotosFromServer(teamId);
		var obj = $.parseJSON(photosJson);
		this.db.transaction(function(tx) {
			for (var i=0; i < obj.photo.length; i++) {
				tx.executeSql('INSERT OR REPLACE INTO photos(id, idTeam, filename, description, date) VALUES (?, ?, ?, ?, ?)',
				[obj.photo[i].id, teamId, obj.photo[i].filename, obj.photo[i].description, obj.photo[i].date],
				function(){},
				this.dbError);
			}
		});*/
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
		$('[id*="panel-team-"]').removeClass('selectedTeam');
		$('#panel-team-'+teamId).addClass('selectedTeam');
		$('#panel').panel('close', {display: 'reveal'});
		$('#content').scrollTop();
		$('#tabs').removeClass('invisible');
		$('#menu-news').attr('onclick', 'tooskiTeams.loadTeamNews('+teamId+')');
		$('#menu-photos').attr('onclick', 'tooskiTeams.loadTeamPhoto('+teamId+')');
		$('#menu-calendar').attr('onclick', 'tooskiTeams.loadTeamCalendar('+teamId+')');
		$('#menu-news').trigger('click');
	},
	
	generateTeamMenu: function() {
		$('#panel').html('<h3 style="margin-bottom:0px;margin-top:10px;margin-left:15px;" align="center">Teams</h3><hr style="maring-left:5px;" align="center" height="10px" width="90%" /><hr color="black" size="2px" width="100%" style="margin-bottom:0px;">');
		var team = $.parseJSON(tooskiTeams.storage.db).team;
		var html = '';
		var min = false;
		for (var i=0; i < team.length; i++) {
			if (team[i]) {
				if (!min) {
					min = !min;
					html += '<div id="panel-team-'+team[i].id+'" onClick="tooskiTeams.selectTeam('+team[i].id+');" style="padding-left:5px;border-bottom:solid black 2px;padding-top:0px;padding-bottom:0px;margin-top:0px;margin-bottom:0px;"><h4 style="padding-top:16px;padding-bottom:12px;margin-top:0px;margin-bottom:0px;"><img src="'+team[i].logo+'" style="max-height:30px;max-width:75px;margin-right:10px;vertical-align:middle;" />'+team[i].name+'</h4></div>';
				}
				else {
					html += '<div id="panel-team-'+team[i].id+'" onClick="tooskiTeams.selectTeam('+team[i].id+');" style="padding-left:5px;border-bottom:solid black 2px;padding-top:0px;padding-bottom:0px;margin-top:0px;margin-bottom:0px;"><h4 style="padding-top:10px;padding-bottom:8px;margin-top:0px;margin-bottom:0px;"><img src="'+team[i].logo+'" style="max-height:30px;max-width:75px;margin-right:10px;vertical-align:middle;" />'+team[i].name+'</h4></div>';
				}
			}
		}
		$('#panel').append(html);
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
		if (this.storage.user && this.storage.secret && this.storage.keyId) {
			return true;
		}
		return false;
	},
	//TODO: Implement with this.makeRequest and server side.
	getTeamFromServer: function() {
		this.makeRequest('team', {
			id: tooskiTeams.storage.keyId
		}, function(data){
			var json = tooskiTeams.decrypt(data.responseText, tooskiTeams.storage.secret);
			var obj = $.parseJSON(json);
			var db = {team: []};
			$.each(obj.team, function(i, item) {
				db.team[parseInt(item.id)] = {
					logo: tooskiTeams.urldecode(item.logo),
					name: tooskiTeams.urldecode(item.name),
					email: tooskiTeams.urldecode(item.email),
					id: item.id
				};
			});
			tooskiTeams.storage.db = JSON.stringify(db);
			tooskiTeams.generateTeamMenu();
		});
		//return '{"length":3, "name":["Tooski Team", "Ski-Romand Junior", "Guggen"],"id":["6", "10", "11"], "logo":["http://tooski.ch/assets/uploads/files/header.png", "http://www.ski-romand.ch/themes/skiromand-2/templates/logo.png", "http://seba1511.com/LogoTooskiTeam/image.php?w=187&h=73&t=Guggenmusik"], "email":["info@tooski.ch", "pokerstar1511@gmail.com", "test@test.com"] }';
	},
	
	initializeDatabase: function() {
		tooskiTeams.db.transaction(function(tx){
			tx.executeSql('CREATE TABLE IF NOT EXISTS teams(id INTEGER PRIMARY KEY ASC, name TEXT, logo TEXT, email TEXT)', [],function(){} ,this.dbError);
		});
		tooskiTeams.db.transaction(function(tx){
			tx.executeSql('CREATE TABLE IF NOT EXISTS photos(id INTEGER PRIMARY KEY ASC, idTeam TEXT, filename TEXT, description TEXT, date TEXT)', [],function(){} ,this.dbError);
			
		});
		tooskiTeams.db.transaction(function(tx){
			tx.executeSql('CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY ASC, idTeam TEXT, title TEXT, description TEXT, date TEXT, place TEXT, file TEXT)', [],function(){} ,this.dbError);
			
		});
		tooskiTeams.db.transaction(function(tx) {
			tx.executeSql('CREATE UNIQUE INDEX events_idx ON events(id))', [],function(){} ,this.dbError);
			tx.executeSql('CREATE UNIQUE INDEX photos_idx ON photos(id))', [],function(){} ,this.dbError);
		});
		var db = {"team": []};
		tooskiTeams.storage.db = JSON.stringify(db);
	},
	
	getTeamSettings: function() {
		this.initializeDatabase();
		this.getTeamFromServer();
	},
	
	/*
	 * The first function to be called when the app is started.
	 */
	init: function() {
		this.message('show', 'Chargement en cours...');
		if (this.loggedIn()) {
			this.getTeamSettings();
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


