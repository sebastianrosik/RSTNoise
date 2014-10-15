angular.module('noise', ['controllers', 'services', 'directives']).value('consts', {
  STATE_STOP  : 0,
  STATE_PAUSE : 1,
  STATE_PLAY  : 2,
  KEY_LEFT : 37,
  KEY_UP : 38,
  KEY_RIGHT : 39,
  KEY_DOWN : 40,
  KEY_ENTER : 13
});
