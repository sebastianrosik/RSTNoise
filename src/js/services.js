angular.module('services',[])

.factory('notification', function(enviroment){
  if ( enviroment.type === 'desktop' ) {
    var notifier = require('node-notifier');
    var path = require('path');

    return {
      open : function( title, message ){
        notifier.notify({
          title: title || '',
          message: message || '',
          icon : path.join(process.cwd(), '/src/images/icon128.png')
        });
      }
    }
  } else if( enviroment.type === 'browser') {
    var _prev = null;

    function _open( title, message ) {
      if ( _prev ) {
        _prev.close();
        _prev = null;
      }
      _prev = new Notification(title, {
          body : message,
          icon : 'src/images/icon128.png'
      });
    }

    return {
      open : function(title, message){
        if (Notification.permission === "granted") {
          _open(title, message);

        } else if (Notification.permission !== 'danied') {
          Notification.requestPermission(function (permission) {
            if (!('permission' in Notification)) {
              Notification.permission = permission;
            }

            if (permission === "granted") {
              _open(title, message);
            }
          });
        }
      }
    }
  }
})

.factory('enviroment', function(){
  var EMPTY = function(){};
  var KEY_F12 = 123;


  function isDesktop () {
    return window.process &&
           window.process.versions &&
           window.process.versions['node-webkit'];
  }

  function _readFile(file, cb){
    if (file.type.match(/audio.*/)) {
      var reader = new FileReader();
      reader.onload = function( data ) {
        var audio = new Audio( data.target.result );
        audio.autoplay = false;
        audio.preload = 'auto';
        audio.loop = false;

        audio.fileName = file.name;
        audio.filePath = file.filePath;

        cb( audio );
      };
      reader.readAsDataURL(file);
    }
  }


  if ( isDesktop() ) {
    var gui = require('nw.gui');
    var win = gui.Window.get();
    var path = require('path');
    var fs = require('fs');

    var APP_DIR = 'RST Noise';
    var USER_DIR = require('userdir');
    var PLAYLIST_FILE = 'playlist.json';
    var PROJECT_PATH = path.join(USER_DIR, APP_DIR);
    var PLAYLIST_PATH = path.join( PROJECT_PATH, PLAYLIST_FILE );

    if ( !fs.existsSync(PROJECT_PATH)) {
      fs.mkdirSync(PROJECT_PATH);
    }

    window.addEventListener('keydown', function(e){
      if ( e.keyCode == KEY_F12 ) {
        win.showDevTools();
      }
    });


    function _createAudioFrom(filePath){
      var audio = new Audio( filePath );
      audio.autoplay = false;
      audio.preload = 'auto';
      audio.loop = false;
      audio.fileName = filePath.split(path.sep).pop();
      audio.filePath = filePath;
      return audio;
    }

    win.on('close', function() {
      this.hide();
      this.close(true);
    });


    return {
      window : win,

      type : 'desktop',

      close : function(){
        win.close();
      },

      minimize : function(){
        win.minimize()
      },

      maximize : function(){
        win.maximize();
      },

      unmaximize : function(){
        win.unmaximize();
      },

      openDialog : function( cb ){
        var self = this;
        var chooser = document.querySelector('input[type=file]');
        chooser.addEventListener("change", function(evt) {
          var audioFiles = [];

          this.value.split(';').forEach(function( path ){
            audioFiles.push( _createAudioFrom(path) );
          });

          cb( audioFiles );
        }, false);
        chooser.click();
      },

      saveFiles : function( list ){
        var pathlist = [];

        list.forEach(function( audio ){
          console.log( audio.filePath );
          if ( audio.filePath ) {
            pathlist.push( audio.filePath );
          }
        });
        console.log('SAVING', pathlist, list.length)
        fs.writeFileSync( PLAYLIST_PATH, JSON.stringify( pathlist ) );
      },

      restoreFiles : function( cb ){
        var list = '[]';
        if ( fs.existsSync(PLAYLIST_PATH)) {
          list = fs.readFileSync(PLAYLIST_PATH, 'utf8');
        }
        
        var audioFiles = [];
        try {
           list = JSON.parse(list);
           list.forEach(function( path ){
             audioFiles.push(_createAudioFrom( path ));
           });
          cb(audioFiles);
        } catch(e){
          console.error('Cannot read saved file list');
        }
      },

      readFile : function(file, cb){
        if (file.type.match(/audio.*/)) {
            var audio = new Audio( file.path );

            audio.autoplay = false;
            audio.preload = 'auto';
            audio.loop = false;

            audio.fileName = file.name;
            audio.filePath = file.path;
            cb( audio );
        }
      }
    }
  } else {
    return {
      window : window,
      type : 'browser',
      close : EMPTY,
      minimize : EMPTY,
      maximize : EMPTY,
      restore : EMPTY,
      openDialog : EMPTY,
      saveFiles : EMPTY,
      restoreFiles : EMPTY,
      readFile : function(file, cb){
        if (file.type.match(/audio.*/)) {
          var reader = new FileReader();
          reader.onload = function( data ) {
            var audio = new Audio( data.target.result );
            audio.autoplay = false;
            audio.preload = 'auto';
            audio.loop = false;

            audio.fileName = file.name;
            audio.filePath = file.filePath;

            cb( audio );
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }
});
