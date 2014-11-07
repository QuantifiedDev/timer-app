angular.module('starter.controllers', [])

    .controller('DashCtrl', function($scope, $ionicModal, $cordovaToast, $filter, ActivityTimingService, ActivityEventService, API, ActivitiesService, AuthenticationService) {
	$scope.activities = ActivityTimingService.getAllActivities();

	$scope.toggleActivity = function(activity) {

	    var status = ActivityTimingService.toggleActivity(activity);
	    if (!status.running) {
		var message = status.title + " for " + $filter('millisecondsToStringFilter')(status.duration);
		try {
		    $scope.showToast(message);
		} catch (e) {
		    console.error(e);
		}

                var event = $filter('buildEventFilter')(activity, status);

		ActivityEventService.queueEvent(event);
	    }
	};

	$scope.showToast = function(message) {
	    $cordovaToast.show(message, 'long', 'bottom')
		.then(function(success) {
		    console.log("The toast was shown");
		}, function(error) {
		    console.log("The toast was not shown due to " + error);
		});
	};
    })

    .controller('HistoryCtrl', function(moment, $scope, ActivityEventService) {
        var grouped_events = (function(){
            var events = ActivityEventService.getQueue();
            var groups = {};
            events.forEach(function(event){
                var date = event.dateTime.split('T')[0];
                if(!groups[date]){
                    groups[date] = [];
                }
                
                groups[date].unshift(event);
            });

            return groups;
        })();
        
        $scope.events = grouped_events;
        $scope.event_dates = Object.keys(grouped_events).sort().reverse();

        $scope.format_time = function(secs, type){
            var duration = moment.duration(secs * 1000);
            return duration[type]();
        };
    })



    .controller('ChartsCtrl', function(API, $scope, ActivitiesService, AuthenticationService, $sce) {
        $scope.activities = ActivitiesService.listActivities();
        $scope.chart = {};

        $scope.showChart =  function(){
            var activity = $scope.chart.type;
            if(AuthenticationService.authenticated()){
                var api_credentials = angular.fromJson(window.localStorage.api_credentials),
                tags = ActivitiesService.getTags(activity),
                uri = API.endpoint + "/v1/streams/" +
                    api_credentials.streamid + "/events/" +
                    tags.objectTags.join(',') + "/" +
                    tags.actionTags.join(',') +
                    "/sum(duration)/daily/barchart";

                $scope.chart.url = $sce.trustAsResourceUrl(uri);
            }else{
                AuthenticationService.authenticate(true);
            }
        };
    });