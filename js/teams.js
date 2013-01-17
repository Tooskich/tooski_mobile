//Announcement of the Namespace
var tooskiTeams = {
	//TODO: Change this line:
	ServerUrl: 'http://tooski.ch/api/',
	storage: localStorage,
	nbNewsToShow: 1000,
	nbEventsToShow: 1000,
	
	
	makeRequest: function(page, object, cbFunction) {
		$.ajax(tooskiTeams.ServerUrl+page+'.php', {
			data: object,
			dataType: 'jsonp',
			type: 'POST',
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
		var identifier = tooskiTeams.getUniqueIdentifier();
		//Storing the Important data.
		tooskiTeams.storage.user = pseudo;
		tooskiTeams.storage.password = password;
		tooskiTeams.storage.secret = ''+identifier;
		tooskiTeams.makeRequest('login', {
			login: pseudo,
			pass: tooskiTeams.encrypt(password, password), 
			id: identifier
		}, function(data) {
			var response = $.parseJSON(data);
			if (response.state == 1) {
				tooskiTeams.storage.keyId = response.id;
				$('#loginMessage').html('<center><p><i><font color="green">'+response.message+'</font></i></p></center>');
				setTimeout(function() {
					window.location = 'index.html';
					//window.location.reload();
				}, 1000);
			}
			else if (response.state == 0) {
				$('#loginMessage').html('<center><p><i><font color="red">'+response.message+'</font></i></p></center>');
			}
			else {
				$('#loginMessage').html('<center><p><i><font color="red">Problèmes de connexion avec le serveur.</font></i></p></center>');
			}
			tooskiTeams.loadLoginPage();
		});
	},
	
	getUniqueIdentifier: function() {
		return (new Date().getTime() + '' + Math.random().toString(36).substring(7)).substring(0, 22);
	},
	
	loadLoginPage: function() {
		$.mobile.changePage('#login',{role:'dialog'});
		$('div[data-role="header"] > a[data-icon="delete"]').hide();
	},


	getNewsIntoDB: function(teamId) {
		tooskiTeams.makeRequest('news', {
			id: tooskiTeams.storage.keyId,
			team: teamId
		}, function (data) {
			var json = tooskiTeams.decrypt(data, tooskiTeams.storage.secret);
			var db = $.parseJSON(tooskiTeams.storage.db);
			db.team[teamId].news = json;
			tooskiTeams.storage.db = JSON.stringify(db);
			if ($('#tabs a.ui-btn-active ')[0].id == 'menu-news') {
				tooskiTeams.showListNewsFromDb(teamId);
			}
		}); 
	},
	
	showNews: function(newsId, teamId) {
		$('#menu-news').removeClass('ui-btn-active');
		$('#content').scrollTop();
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
		var obj = $.parseJSON(tooskiTeams.storage.db);
		var obj = $.parseJSON(obj.team[teamId].news);
		var html = '<center>';
		for (var i=0; i < obj.news.length && i < tooskiTeams.nbNewsToShow; i++) {
			var title = tooskiTeams.urldecode(obj.news[i].title);
			var text = tooskiTeams.urldecode(obj.news[i].text);
			var id = tooskiTeams.urldecode(obj.news[i].id);
			html += tooskiTeams.createTeamNewsPreview(title, text, id, teamId);
		}
		html += '</center>';
		tooskiTeams.message('hide', '');
		$('#content').html(html);
	},
	
	hasNewsInDB: function(teamId) {
		if (typeof $.parseJSON(tooskiTeams.storage.db).team[teamId].news != 'undefined') {
			return true;
		}
		return false;
	},
	
	loadTeamNews: function(teamId) {
		tooskiTeams.message('show', 'Chargement des News...');
		if (tooskiTeams.hasNewsInDB(teamId)) {
			tooskiTeams.showListNewsFromDb(teamId);
		}
		tooskiTeams.getNewsIntoDB(teamId);
	},
	
	hasEventsInDB: function(teamId) {
		if (typeof $.parseJSON(tooskiTeams.storage.db).team[teamId].events != 'undefined') {
			return true;
		}
		return false;
	},
	
	getEventsIntoDB: function(teamId) {
		tooskiTeams.makeRequest('events', {
			id: tooskiTeams.storage.keyId,
			team: teamId
		}, function(data) {
			var json = tooskiTeams.decrypt(data, tooskiTeams.storage.secret);
			var db = $.parseJSON(tooskiTeams.storage.db);
			db.team[teamId].events = json;
			tooskiTeams.storage.db = JSON.stringify(db);
			if ($('#tabs a.ui-btn-active ')[0].id == 'menu-calendar') {
				tooskiTeams.showListEventsFromDb(teamId);
			}
		});
	}, 
	
	createTeamEventView: function(title, description, date, place, file, email) {
		date = new Date(date * 1000);
		date = 'Le ' + date.getDate() + '.' + date.getMonth() + '.' + date.getFullYear();
		return '<div class="eventContainer"><div class="eventHeader"><h2 align="left" class="eventHeaderTitle">'+title+'</h2><p align="right" class="eventHeaderDate">'+date+'</p></div><div class="eventContent"><p align="justify">'+description+'</p></div><div class="eventFooter"><table width="100%"><tr><td><h3>Quand</h3><p>'+date+'</p></td><td><h3>Où</h3><p><a href="http://maps.google.com/maps?hl=en&amp;q='+encodeURI(place)+'" rel="external"><img src ="images/map@2x.png" height="30px" /><br />'+place+'</a></p></td></tr><tr><td><h3>Contact</h3><p><a data-role="button" data-inline="true" data-mini="true" href="mailto:'+email+'"><img src="images/email.png" height="25px" /></a></td><td><h3>Infos</h3><p><a data-role="button" data-inline="true" data-mini="true" href="'+file+'"><img src="images/notepad.png" height="25px" /></a></p></td></tr></table></div></div>';
	},
	
	showListEventsFromDb: function(teamId) {
		var obj = $.parseJSON(tooskiTeams.storage.db);
		var email = obj.team[teamId].email;
		var obj = $.parseJSON(obj.team[teamId].events);
		var html = '<center>';
		for (var i=0; i < obj.event.length && i < tooskiTeams.nbEventsToShow; i++) {
			var title = tooskiTeams.urldecode(obj.event[i].title);
			var description = tooskiTeams.urldecode(obj.event[i].description);
			var date = tooskiTeams.urldecode(obj.event[i].date);
			var place = tooskiTeams.urldecode(obj.event[i].place);
			var file = tooskiTeams.urldecode(obj.event[i].file);
			html += tooskiTeams.createTeamEventView(title, description, date, place, file, email);
		}
		html += '</center>';
		tooskiTeams.message('hide', 'Chargement des Calendrier...');
		$('#content').html(html);
		$('#content').trigger('create');
	},
	
	loadTeamCalendar: function(teamId) {
		tooskiTeams.message('show', 'Chargement du Calendrier...');
		if (tooskiTeams.hasEventsInDB(teamId)) {
			tooskiTeams.showListEventsFromDb(teamId);
		}
		tooskiTeams.getEventsIntoDB(teamId);
	},
	
	hasPhotosInDB: function(teamId, albumId) {
		if (typeof $.parseJSON(tooskiTeams.storage.db).team[teamId].photos != 'undefined' && typeof $.parseJSON(tooskiTeams.storage.db).team[teamId].photos[albumId] != 'undefined') {
			return true;
		}
		return false;
	},
	
	generatePhotoGallery: function(teamId, albumId)  {
		var obj = $.parseJSON(tooskiTeams.storage.db);
		var obj = $.parseJSON(obj.team[teamId].photos[albumId]);
		var html = '<center>';
		for (var i=0; i < obj.photo.length; i++) {
			var filename = tooskiTeams.urldecode(obj.photo[i].filename);
			var description = tooskiTeams.urldecode(obj.photo[i].description);
			html += '<a class="imgContainer" href="http://res.cloudinary.com/tooski/image/upload/'+filename+'"><img src="http://res.cloudinary.com/tooski/image/upload/c_fill,w_300/'+filename+'" width="150px" alt="'+description+'" /></a>';
		}
		tooskiTeams.message('hide', 'Chargement des Photos...');
		html += '</center>';$('#photoLibrary').html(html);
		$("#photoLibrary a").photoSwipe({
			enableMouseWheel: false , 
			enableKeyboard: false ,
			jQueryMobile: true,
			loop:false
		});
		$('#content').trigger('create');
	},
	
	selectPicture: function(src) {
		if (src == 'camera') {
			navigator.camera.getPicture( tooskiTeams.setAttributePicture, tooskiTeams.cameraError, {destinationType: navigator.camera.DestinationType.FILE_URI, sourceType: navigator.camera.PictureSourceType.CAMERA} );
		}
		else {
			navigator.camera.getPicture( tooskiTeams.setAttributePicture, tooskiTeams.cameraError, {destinationType: navigator.camera.DestinationType.FILE_URI, sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY} );
		}
	},
	
	openNewUploadImageScreen: function(teamId, src, albumId) {
		$('#photoUpload').html('<a onClick="tooskiTeams.selectPicture(\''+src+'\');" id="pictureSelection" data-role="button">Photo</a><br /><input type="text" id="description" placeholder="Description de la photo" /><br /><div data-role="fieldcontain">Photo réservée à la Team ?&nbsp;&nbsp;&nbsp;<select name="private" id="private" data-role="slider"><option value="0">Non</option><option value="1">Oui</option></select></div><br /><input type="button" data-role="button" value="Envoyer l\'image" onClick="tooskiTeams.sendImageToServer('+teamId+', '+albumId+')" />');
		$('#content').trigger('create');
	},
	
	cameraError: function() {
		navigator.notification.alert('Pas de photo uploadée.', function(){}, 'Information');
	},
	
	setAttributePicture: function(data) {
		$('#pictureSelection').attr('picture',data);
	},
	
	sendImageToServer: function(teamId, albumId) {
		navigator.notification.alert('Upload de la photo vers le serveur en cours.', function(){}, 'Upload');
		var private = $('#private').val();
		var description= $('#description').val();
		var imageURI = $('#pictureSelection').attr('picture');
		if ((typeof imageURI == 'undefined') || imageURI == '') {
			navigator.notification.alert('Sélectionnez une image s.v.p.');
			return false;
		}
		var options = new FileUploadOptions();
        	options.fileKey="file";
        	options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        	options.mimeType="image/jpeg";

        	var params = {
			id: tooskiTeams.storage.keyId,
			team: tooskiTeams.encrypt(teamId,tooskiTeams.storage.secret),
			private: tooskiTeams.encrypt(private,tooskiTeams.storage.secret),
			description: tooskiTeams.encrypt(description,tooskiTeams.storage.secret),
			album: albumId
		};
        	options.params = params;
        	var ft = new FileTransfer();
        	ft.upload(imageURI, tooskiTeams.ServerUrl+"sendImage.php", function(r) {
        	    navigator.notification.alert(r.response);
        	    tooskiTeams.getPhotoListIntoDB(teamId, albumId);
        	}, function(error) {
        	    alert("An error has occurred: Code = " = error.code);
        	}, options);
	},
	
	preparePhotoPage: function(teamId, albumId) {
		$('#content').html('<div id="photoUpload"><center><fieldset class="ui-grid-a resp-grid"><div class="ui-block-a"><button href="#" data-role="button" data-icon="plus" onClick="tooskiTeams.openNewUploadImageScreen('+teamId+', \'library\', '+albumId+');" >Choisir une Photo&nbsp;&nbsp;<img src="images/photos.png" height="15px" /></button></div><div class="ui-block-b"><button href="#" data-role="button" data-icon="plus" onClick="tooskiTeams.openNewUploadImageScreen('+teamId+', \'camera\', '+albumId+');" >Prendre une Photo&nbsp;&nbsp;<img src="images/photoup.png" height="15px" /></button></div></fieldset></center></div><br /><hr size="2px" width="100%" /><h3><a onclick="$(\'#menu-photos\').click();" data-role="button" data-inline="true" data-mini="true">Retour aux Albums</a>&nbsp;&nbsp;Galerie Photo</h3><div id="photoLibrary"></div>');
		$('#content').trigger('create');
	},
	
	getPhotoListIntoDB: function(teamId, albumId) {
		tooskiTeams.makeRequest('photo', {
			id: tooskiTeams.storage.keyId,
			team: teamId,
			album: albumId
		}, function (data) {
			var json = tooskiTeams.decrypt(data, tooskiTeams.storage.secret);
			var db = $.parseJSON(tooskiTeams.storage.db);
			if (typeof db.team[teamId].photos != 'array') {
				db.team[teamId].photos = new Array();
			}
			db.team[teamId].photos[albumId] = json;
			tooskiTeams.storage.db = JSON.stringify(db);
			if ($('#tabs a.ui-btn-active ')[0].id == 'menu-photos') {
				tooskiTeams.generatePhotoGallery(teamId, albumId);
			}
		});
	},
	
	hasAlbumsInDB: function (teamId) {
		if (typeof $.parseJSON(tooskiTeams.storage.db).team[teamId].albums != 'undefined') {
			return true;
		}
		$.parseJSON(tooskiTeams.storage.db).team[teamId].photos = '';
		return false
	},
	
	generateAlbumsGallery: function(teamId) {
		var obj = $.parseJSON(tooskiTeams.storage.db);
		var obj = $.parseJSON(obj.team[teamId].albums);
		var html = '<div align="left" style=""><h3>Albums Photo</h3>';
		for (var i=0; i < obj.album.length; i++) {
			var title = tooskiTeams.urldecode(obj.album[i].title);
			var cover = tooskiTeams.urldecode(obj.album[i].cover);
			var id = tooskiTeams.urldecode(obj.album[i].id);
			html += '<div onclick="tooskiTeams.loadTeamPhoto('+teamId+', '+id+')" style="display:inline-block;width:300px;padding:5px;margin:5px;border:solid black 1px;-webkit-border-radius: 5px;-moz-border-radius: 5px;border-radius: 5px;" align="center"><img src="http://res.cloudinary.com/tooski/image/upload/c_fill,w_300/'+cover+'" /><h4>'+title+'</h4></div>';
		}
		tooskiTeams.message('hide', 'Chargement des Photos...');
		html += '</div>';
		$('#content').html(html);
	},
	
	getAlbumsListIntoDB: function (teamId) {
		tooskiTeams.makeRequest('album', {
			id: tooskiTeams.storage.keyId,
			team: teamId
		}, function (data) {
			var json = tooskiTeams.decrypt(data, tooskiTeams.storage.secret);
			var db = $.parseJSON(tooskiTeams.storage.db);
			db.team[teamId].albums = json;
			tooskiTeams.storage.db = JSON.stringify(db);
			if ($('#tabs a.ui-btn-active ')[0].id == 'menu-photos') {
				tooskiTeams.generateAlbumsGallery(teamId);
			}
		});
	},
	
	loadTeamAlbum: function (teamId) {
		tooskiTeams.message('show', 'Chargement des Albums...');
		if (tooskiTeams.hasAlbumsInDB(teamId)) {
			tooskiTeams.generateAlbumsGallery(teamId);
		}
		tooskiTeams.getAlbumsListIntoDB(teamId);
	},
	
	loadTeamPhoto: function(teamId, albumId) {
		tooskiTeams.message('show', 'Chargement des Photos...');
		tooskiTeams.preparePhotoPage(teamId, albumId);
		if (tooskiTeams.hasPhotosInDB(teamId, albumId)) {
			tooskiTeams.generatePhotoGallery(teamId, albumId);
		}
		tooskiTeams.getPhotoListIntoDB(teamId, albumId);
	},
	
	selectTeam: function(teamId) {
		$('[id*="panel-team-"]').removeClass('selectedTeam');
		$('#panel-team-'+teamId).addClass('selectedTeam');
		$('#panel').panel('close', {display: 'reveal'});
		$('#content').scrollTop(0);
		var name = $.parseJSON(tooskiTeams.storage.db).team[teamId].name;
		$('#header h1').text(name);
		$('#tabs').removeClass('invisible');
		$('#menu-news').attr('onclick', 'tooskiTeams.loadTeamNews('+teamId+')');
		$('#menu-news').bind('tap', function(){tooskiTeams.loadTeamNews(teamId)});
		$('#menu-photos').attr('onclick', 'tooskiTeams.loadTeamAlbum('+teamId+')');
		$('#menu-photos').bind('tap', function(){tooskiTeams.loadTeamAlbum(teamId)});
		$('#menu-calendar').attr('onclick', 'tooskiTeams.loadTeamCalendar('+teamId+')');
		$('#menu-calendar').bind('tap', function(){tooskiTeams.loadTeamCalendar(teamId)});
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
					html += '<div id="panel-team-'+team[i].id+'" onClick="tooskiTeams.selectTeam('+team[i].id+');" style="padding-left:5px;border-bottom:solid black 2px;padding-top:0px;padding-bottom:0px;margin-top:0px;margin-bottom:0px;"><h4 style="padding-top:16px;padding-bottom:12px;margin-top:0px;margin-bottom:0px;"><img src="'+team[i].logo+'" style="max-height:30px;max-width:50px;margin-right:10px;vertical-align:middle;" />'+team[i].name+'</h4></div>';
				}
				else {
					html += '<div id="panel-team-'+team[i].id+'" onClick="tooskiTeams.selectTeam('+team[i].id+');" style="padding-left:5px;border-bottom:solid black 2px;padding-top:0px;padding-bottom:0px;margin-top:0px;margin-bottom:0px;"><h4 style="padding-top:10px;padding-bottom:8px;margin-top:0px;margin-bottom:0px;"><img src="'+team[i].logo+'" style="max-height:30px;max-width:50px;margin-right:10px;vertical-align:middle;" />'+team[i].name+'</h4></div>';
				}
			}
		}
		html += '<br /><br /><br /><div style="position:fixed;bottom:15%;width:100%;"><h3 style="margin-bottom:0px;margin-top:10px;margin-left:15px;" align="center">Options</h3><hr style="maring-left:5px;" align="center" height="10px" width="90%" /><hr color="black" size="2px" width="100%" style="margin-bottom:0px;"><div id="panel-team-logout" style="padding-left:5px;border-bottom:solid black 2px;padding-top:0px;padding-bottom:0px;margin-top:0px;margin-bottom:0px;"><h4 onClick="tooskiTeams.logout();" style="padding-top:16px;padding-bottom:12px;margin-top:0px;margin-bottom:0px;"><img src="images/power@2x.png" style="max-height:30px;max-width:50px;margin-right:10px;vertical-align:middle;" />Se déconnecter</h4></div></div>';
		$('#panel').append(html);
	},
	
	logout: function() {
		alert('Vous êtes déconnecté !');
		tooskiTeams.storage.clear();
		tooskiTeams.loadLoginPage();
	},
	
	dbError: function(tx, e) {
		alert('Problème lors de la connexion à la base de donnée. Veuillez relancer l\'app en cas de récidive.' + e.message);
	},
	
	getWelcomePage: function() {
		tooskiTeams.change('welcome');
	},
	
	message: function(state, text) {
		$.mobile.loading(state, {
			text:text, 
			textonly:false, 
			textVisible:true
		});
	},
	
	loggedIn: function() {
		if (tooskiTeams.storage.user && tooskiTeams.storage.secret && tooskiTeams.storage.keyId) {
			return true;
		}
		return false;
	},

	getTeamFromServer: function() {
		tooskiTeams.makeRequest('team', {
			id: tooskiTeams.storage.keyId
		}, function(data){
			var json = tooskiTeams.decrypt(data, tooskiTeams.storage.secret);
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
		
	},
	
	initializeDatabase: function() {
		var db = {"team": []};
		tooskiTeams.storage.db = JSON.stringify(db);
	},
	
	getTeamSettings: function() {
		//tooskiTeams.initializeDatabase();
		tooskiTeams.getTeamFromServer();
	},
	
	hasTeamSettings: function () {
		if (typeof tooskiTeams.storage.db != 'undefined') {
			return true;
		}
		return false
	},
	
	/*
	 * The first function to be called when the app is started.
	 */
	init: function() {
		tooskiTeams.message('show', 'Chargement en cours...');
		if (tooskiTeams.loggedIn()) {
			if (!tooskiTeams.hasTeamSettings()) {
				tooskiTeams.getTeamSettings();
			}
			else {
				tooskiTeams.generateTeamMenu();
			}
			tooskiTeams.getWelcomePage();
			$('#login, #welcome').html('');
		}
		else {
			tooskiTeams.loadLoginPage();
		}
		tooskiTeams.message('hide', 'Chargement en cours...');
	},
	
	/*
	 * Use this function when you want to call a page,
	 * and then execute a specific function.
	 */
	change: function(page, functionToCall) {
		$('#content').html($('#'+page).html());
		if (functionToCall) {
			functionToCall();
		}
	}
}


