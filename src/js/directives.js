angular.module('directives', []).directive('playlist', function( $timeout, consts ){
  return {
    scope : {
      items : '@',
      selected : '='
    },

    link : function( $scope, element, attrs ){
      var direction = 0;

      window.addEventListener('keydown', function( e ){
        switch(e.keyCode) {
          case consts.KEY_UP:
            direction = -1;
            break;
          case consts.KEY_DOWN:
            direction = 1;
            break;
          default:
            direction = 0;
        }
      });

      $scope.$watch('selected', function(){
         $timeout(function(){
           if ( $scope.selected !== null ) {
             var query = document.querySelectorAll('content li');
             if ( query[$scope.selected] ) {
               query[$scope.selected].scrollIntoView( direction < 0 );
             }
           }
         }, 50);
      });
    }
  }
});
