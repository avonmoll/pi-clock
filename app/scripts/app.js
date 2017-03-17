'use strict';

/**
 * @ngdoc overview
 * @name piClockApp
 * @description
 * # piClockApp
 *
 * Main module of the application.
 */
var app = angular
  .module('piClockApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap'
  ]);

app.config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/log', {
        templateUrl: 'views/log.html',
        controller: 'LogCtrl',
        controllerAs: 'log'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
  
app.run(function ($rootScope, $location) {
    $rootScope.isActive = function (path) {
      return $location.path().substr(0, path.length) === path;
    };
    $rootScope.atHome = function() {
      return $location.path() === "/";
    };
});
