angular.module('controllers',[])

.controller('winctrl', function($scope, $rootScope, enviroment){
  $scope.close = function(){
     enviroment.close();
  }

  $scope.minimize = function(){
    enviroment.minimize();
  }

  $scope.maximize = function(){
    enviroment.maximize();
  }

  $scope.unmaximize = function(){
    enviroment.unmaximize();
  }

  $scope.winState = 1;

  $scope.$on('window:minimize', function(){
    $scope.$apply(function(){
      $scope.winState = 0;
    });
  });

  $scope.$on('window:unmaximize', function(){
    $scope.$apply(function(){
      $scope.winState = 1;
    });
  });

  $scope.$on('window:maximize', function(){
    $scope.$apply(function(){
      $scope.winState = 2;
    });
  });

  if( enviroment.window.on ) {
    ['minimize', 'maximize', 'unmaximize', 'focus'].forEach(function(evName){
      enviroment.window.on(evName, function(){
        $rootScope.$broadcast('window:'+evName);
      });
    });
  }
})

.controller('main', function($scope, consts, enviroment, notification){
	function prevent(e){
    e.stopPropagation();
    e.preventDefault();
  }

  function drop(e){
    prevent(e);
    var dt = e.dataTransfer;
    $scope.$apply(function(){
      $scope.addFiles(dt.files);
    });
  }

  var dropArea = document.body;

  dropArea.addEventListener("dragenter", prevent, false);
  dropArea.addEventListener("dragover", prevent, false);
  dropArea.addEventListener("drop", drop, false);

  $scope.state = consts.STATE_STOP;
  $scope.currentSongIndex = null;
  $scope.selected = null;

  $scope.isPlaying = function(){
    return $scope.state === consts.STATE_PLAY;
  }

  $scope.isDesktop = function(){
    return enviroment.type === 'desktop';
  }

  $scope.hasSelection = function(){
    return $scope.selected != null;
  }

  $scope.seek = function(){
    var song = $scope.getCurrentSong();
    if ( song instanceof Audio ) {
      song.currentTime = song.duration * $scope.progress;
    }
  }

  $scope.play = function( index ){
    if ( !$scope.playlist.length ) {
      return;
    }

    if ( typeof index === 'undefined' ) {
      index = $scope.selected || 0;
    }

    $scope.state = consts.STATE_PLAY;
    if ( typeof $scope.playlist[index] !== 'undefined') {
      $scope.currentSongIndex = index;
      var song = $scope.getCurrentSong();
      if ( song instanceof Audio ) {
        song.play();
        notification.open('Current song', song.fileName);
      }
    }
  }

  $scope.pause = function(){
    $scope.state = consts.STATE_PAUSE;
    if ( typeof $scope.playlist[$scope.currentSongIndex ] !== 'undefined') {
      var song = $scope.getCurrentSong();
      if ( song instanceof Audio ) {
        song.pause();
      }
    }
  }

  $scope.stop = function(){
    $scope.state = consts.STATE_STOP;
    if ( typeof $scope.playlist[$scope.currentSongIndex] !== 'undefined') {
      var song = $scope.getCurrentSong();
      if ( song instanceof Audio ) {
        song.pause();
        song.currentTime = 0;
      }
    }
    $scope.currentSongIndex = null;
  }

  $scope.select = function( index ){
    if ( $scope.exists(index) ) {
      $scope.selected = index;
    }
  }

  $scope.exists = function( index ){
    return typeof $scope.playlist[index] !== 'undefined';
  }

  $scope.prev = function(){
    if ( $scope.selected === null || $scope.selected === 0 ) {
      $scope.select($scope.playlist.length-1);
    } else {
      $scope.select($scope.selected-1);
    }
  }

  $scope.next = function(){
    if ( $scope.selected === null || $scope.selected === $scope.playlist.length - 1 ) {
      $scope.select(0);
    } else {
      $scope.select($scope.selected+1);
    }
  }

  $scope.nextSong = function(){
    $scope.next();
    $scope.play();
  }

  $scope.prevSong = function(){
    $scope.prev();
    $scope.play();
  }

  $scope.addMusic = function(){
    enviroment.openDialog(function( audioFiles ){
      audioFiles.forEach(function(audio){
        $scope.appendSong(audio);
      });
      enviroment.saveFiles( $scope.playlist );
      $scope.$apply();
   });
  }

  $scope.appendSong = function( audio ){
    var index;

    $scope.playlist.push( audio );
    index = $scope.playlist.length - 1;

    ['play', 'pause', 'ended', 'timeupdate'].forEach(function(evName){
      audio.addEventListener(evName, function() {
        $scope.$emit(evName, audio, index);
      }, true);
    });
  }

  $scope.getCurrentSong = function(){
    return $scope.playlist[ $scope.currentSongIndex ];
  }

  $scope.getCurrentSongName = function(){
    if ( $scope.playlist[ $scope.currentSongIndex ] instanceof Audio ) {
      var arr = $scope.playlist[ $scope.currentSongIndex ].fileName.split('.');
      if ( arr.length > 1 ) {
        arr.pop();
      }
      return arr.join('.');
    }
    return '';
  }

  $scope.addFiles = function( files ){
    var total = files.length,
        read  = 0;
    for ( var i = 0; i < files.length; ++i) {
      $scope.readFile(files[i], function( audio ){
        $scope.appendSong( audio );
        read++;
        if ( read == total ) {
          console.log('presave', $scope.playlist.length);
          enviroment.saveFiles( $scope.playlist );
        }
      });
    };
  }

  $scope.readFile = function( file, cb ) {
    enviroment.readFile( file, cb );
  }

  $scope.$on('play', function(ev, audio, index){
    $scope.playlist.forEach(function(a, i){
      if ( index != i ) {
        a.pause();
        a.currentTime = 0;
      }
    })
  });

  $scope.$on('ended', function(ev, audio, index){
    $scope.$apply(function(){
      $scope.nextSong();
    });
  });

  $scope.$on('timeupdate', function(ev, audio, index){
    $scope.$apply(function(){
      $scope.progress = audio.currentTime / audio.duration;
    });
  });

  $scope.$watch('playlist.length', function(){
    if( $scope.playlist.length === 0 ) {
      $scope.state = consts.STATE_STOP;
      $scope.currentSongIndex = null;
      $scope.selected = null;
    }
  });

  $scope.playlist = [];

  if ( enviroment.type === 'desktop' ) {
    enviroment.restoreFiles(function( audioFiles ){
      audioFiles.forEach(function(audio){
        $scope.appendSong( audio );
      });
    });
  }

  window.addEventListener('keydown', function( e ){
    switch(e.keyCode) {
      case consts.KEY_UP:
        $scope.$apply(function(){
          $scope.prev();
        });
        e.preventDefault();
        break;
      case consts.KEY_DOWN:
        $scope.$apply(function(){
          $scope.next();
        });
        e.preventDefault();
        break;
      case consts.KEY_ENTER:
        $scope.$apply(function(){
          if ( $scope.isPlaying() && $scope.selected === $scope.currentSongIndex ) {
            $scope.pause();
          } else {
            $scope.play($scope.selected);
          }
        });
        e.preventDefault();
    }
  });
});
