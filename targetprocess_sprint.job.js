
var targetprocessApi = require('tp-api');
var config = require("../config/config.targetprocess_sprint");
var cronJob = require('cron').CronJob;
var strsplit = require('strsplit');
var moment = require('moment');

try {
    var apiClient = targetprocessApi({
        domain: config.api.host,
        token: config.api.token,
        //acid: config.api.context,
        version: config.api.version,
        protocol: config.api.protocol,
    });

    var getEndDateObject = function(sprint) {
        var endDate = strsplit(sprint.EndDate, '(')[1];
        endDate = strsplit(endDate, '+')[0];
        endDate = parseInt(endDate);
        return moment(endDate);
    };

    var getLeftDaysWithoutWeekendDays = function(startDate, endDate) {
        if(!moment.isMoment(startDate)) throw new Error('start date is not a moment');
        if(!moment.isMoment(endDate)) throw new Error('end date is not a moment');
        if(startDate > endDate) throw new Error('start date cannot be greater than end date');

        var format = 'DD-MM-YYYY';
        var dateIterator = startDate;
        var index = 0;
        while (dateIterator.format(format) != endDate.format(format)) {
            var dayOfWeek = dateIterator.format('ddd');
            if (dayOfWeek != "Sun" && dayOfWeek != "Sat") {
                index++;
            }
            dateIterator.add(1, 'days');
        }
        return index;
    };

    new cronJob(config.cronInterval, function() {

        var sprint = {
            points: {
                effort: 0,
                inProgress: 0,
                remain: 0,
                done: 0
            }
        }

        apiClient('UserStories')
            .where("Teamiteration.IsCurrent eq 'true'")
            .context(config.api.context)
            .then(function(error, data) {
                if (error) return console.log('Error:', error)
                if (data.length > 0) {
                    data.forEach(function (story) {
                        sprint.points.effort += story.Effort;
                        sprint.points.done += story.EffortCompleted;
                        sprint.points.remain += story.EffortToDo;
                        if (story.EntityState.Name != 'Open' && story.EntityState.Name != 'Done') {
                            sprint.points.inProgress += story.Effort;
                        }
                    });

                    var inProgress = Math.ceil(sprint.points.inProgress);
                    var remain = Math.ceil(sprint.points.remain) - inProgress;
                    var done = Math.ceil(sprint.points.done);

                    send_event(config.eventName, {
                        sprintPointsRemain: remain,
                        sprintPointsInProgress: inProgress,
                        sprintPointsDone: done,
                        sprintHealth: true
                    })
                }
            });


        apiClient('TeamIterations')
            .where("IsCurrent eq 'true'")
            .context(config.api.context)
            .then(function(error, data) {
                if (error) return console.log('Error:', error)
                var sprint = data[0];
                var sprintName = 'No current sprint';
                var daysLeft = ':-(';
                var endDate = '';

                if (data.length > 0) {
                    var endDateObject = getEndDateObject(sprint);
                    sprintName = strsplit(sprint.Name, ' -')[0];
                    daysLeft = getLeftDaysWithoutWeekendDays(moment(), endDateObject);
                    endDate = endDateObject.format('ddd DD.MM.YYYY');
                }

                send_event(config.eventName, {
                    sprintName: sprintName,
                    sprintDaysLeft: daysLeft,
                    sprintEndDate: endDate
                })
            });
    }, null, true, null);

} catch(error) {
    console.log('Exception:', error);
}