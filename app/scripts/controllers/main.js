'use strict';

/**
 * @ngdoc function
 * @name piClockApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the piClockApp
 */
angular.module('piClockApp')
  .controller('MainCtrl', function ($scope, $http) {
      $scope.showAlert = false;
      $scope.form = {};
      $scope.alertMsg = '';
      $http.get('/config')
        .then(function(result) {
          $scope.form = result.data;
        });
      $scope.saveSettings = function() {
        $scope.form.wakeTime.mon = $scope.form.wakeTime.sun;
        $scope.form.wakeTime.tue = $scope.form.wakeTime.sun;
        $scope.form.wakeTime.wed = $scope.form.wakeTime.sun;
        $scope.form.wakeTime.thu = $scope.form.wakeTime.sun;
        $scope.form.wakeTime.fri = $scope.form.wakeTime.sun;
        $scope.form.wakeTime.sat = $scope.form.wakeTime.sun;
        $http.post('/config', $scope.form)
          .then(function(result) {
            $scope.showAlert = true;
            $scope.alertMsg = result.data;
            setTimeout(function() {
              $scope.showAlert = false;
              $scope.$apply();
            }, 2000);
          });
      };
      $scope.resetSettings = function() {
        $http.get('/configreset')
          .then(function(result) {
            console.log('configreset: ');
            console.log(result.data);
            $scope.form = result.data;
          }, function(err) {
            throw(err);
          });
      };
      $scope.shutdown = function() {
        $http.get('/shutdown');
        alert('Raspberry Pi shutting down');
      };
      $http.get('/lightState')
        .then(function(result) {
          $scope.stateStyle = result.data;
          $scope.$apply();
        });
    });
