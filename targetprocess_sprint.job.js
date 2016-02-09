
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

    var getSprintPointHealthWidths = function(effort, remain, inProgress, done) {
        var width = {};
        var maxWidth = 100;
        var counter = 0;

        if (effort > maxWidth) {
            var maxWidthPerColumn = Math.floor(maxWidth / 3);
            if (remain > maxWidthPerColumn) counter += 1;
            if (inProgress > maxWidthPerColumn) counter += 1;
            if (done > maxWidthPerColumn) counter += 1;
            var subtractiveWidthPerColumn = Math.floor((effort - maxWidth) / counter);
            if (remain > maxWidthPerColumn) {
                width.sprintPointsRemain = remain - subtractiveWidthPerColumn;
            }
            if (inProgress > maxWidthPerColumn) {
                width.sprintPointsInProgress = inProgress - subtractiveWidthPerColumn;
            }
            if (done > maxWidthPerColumn) {
                width.sprintPointsDone = done - subtractiveWidthPerColumn;
            }
        } else {
            var maxWidthPerColumn = 8;
            if (remain > maxWidthPerColumn) counter += 1;
            if (inProgress > maxWidthPerColumn) counter += 1;
            if (done > maxWidthPerColumn) counter += 1;
            var additionalWidthPerColumn = Math.floor((maxWidth - effort) / counter);
            if (remain > additionalWidthPerColumn) {
                width.sprintPointsRemain = remain + additionalWidthPerColumn;
            }
            if (inProgress > additionalWidthPerColumn) {
                width.sprintPointsInProgress = inProgress + additionalWidthPerColumn;
            }
            if (done > additionalWidthPerColumn) {
                width.sprintPointsDone = done + additionalWidthPerColumn;
            }
        }
        return width;
    };

    new cronJob(config.cronInterval, function() {
        var sprint = { points: { effort: 0, done: 0, remain: 0, inProgress: 0 }};
        apiClient('UserStories')
            .where("Teamiteration.IsCurrent eq 'true'")
            .context(config.api.context)
            .then(function(error, data) {
                if (error) return console.log('Error:', error)
                if (data.length > 0) {
                    data.forEach(function (story) {
                        sprint.points.effort += story.Effort;
                        if (story.EntityState.Name != 'Open' && story.EntityState.Name != 'Done') {
                            sprint.points.inProgress += story.Effort;
                        }
                        if (story.EntityState.Name == 'Done') {
                            sprint.points.done += story.EffortCompleted;
                        }
                        if (story.EntityState.Name == 'Open') {
                            sprint.points.remain += story.EffortToDo;
                        }
                    });

                    var inProgress = Math.floor(sprint.points.inProgress);
                    var done = Math.floor(sprint.points.done);
                    var remain = Math.floor(sprint.points.remain);

                    send_event(config.eventName, {
                        sprintPointsRemain: remain,
                        sprintPointsInProgress: inProgress,
                        sprintPointsDone: done,
                        width: getSprintPointHealthWidths(sprint.points.effort, remain, inProgress, done)
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