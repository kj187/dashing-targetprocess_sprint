
var targetprocessApi = require('tp-api');
var config = require("../config/config.targetprocess_sprint");
var cronJob = require('cron').CronJob;
var strsplit = require('strsplit');
var moment = require('moment');

try {
    var apiClient = targetprocessApi({
        domain: config.api.host,
        token: config.api.token,
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

    var update = function() {
        var sprint = { points: { effort: 0, done: 0, remain: 0, inProgress: { all: 0, inTesting: 0, approval: 0 } }};
        var collectedSources = 0;

        var whereClause = "(TeamIteration.IsCurrent eq 'true')";
        if (config.api.team) {
            whereClause += " and (Team.Id eq" + config.api.team + ")";
        }

        var updateProgressbar = function(sprint) {
            send_event(config.eventName, {
                sprintPointsRemain: Math.round(sprint.points.remain),
                sprintPointsInProgressAll: Math.round(sprint.points.inProgress.all),
                sprintPointsInProgressInTesting: Math.round(sprint.points.inProgress.inTesting),
                sprintPointsInProgressApproval: Math.round(sprint.points.inProgress.approval),
                sprintPointsDone: Math.round(sprint.points.done)
            })
        };

        var updateSprintData = function(error, data) {
            collectedSources += 1;
            if (error) return console.log('Error:', error);
            if (data.length > 0) {
                data.forEach(function (entity) {
                    sprint.points.effort += entity.Effort;
                    if (entity.EntityState.Name != 'Open' && entity.EntityState.Name != 'Done') {
                        sprint.points.inProgress.all += entity.Effort;
                    }
                    if (entity.EntityState.Name == 'Done') {
                        sprint.points.done += entity.EffortCompleted;
                    }
                    if (entity.EntityState.Name == 'Open') {
                        sprint.points.remain += entity.EffortToDo;
                    }

                    if (entity.EntityState.Name == 'In Testing') {
                        sprint.points.inProgress.inTesting += entity.Effort;
                    }
                    if (entity.EntityState.Name == 'Approval') {
                        sprint.points.inProgress.approval += entity.Effort;
                    }
                });
            }

            if (collectedSources == 2) {
                updateProgressbar(sprint);
            }
        };

        apiClient('UserStories').where(whereClause).context(config.api.context).then(updateSprintData);
        apiClient('Bugs').where(whereClause).context(config.api.context).then(updateSprintData);

        var whereClause = "(IsCurrent eq 'true')";
        if (config.api.team) {
            whereClause += " and (Team.Id eq" + config.api.team + ")";
        }

        apiClient('TeamIterations')
            .where(whereClause)
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
    };

    module.exports.update = update;

    new cronJob(config.cronInterval, update, null, true, null);

} catch(error) {
    console.log('Exception:', error);
}