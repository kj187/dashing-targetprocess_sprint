class Dashing.TargetprocessSprint extends Dashing.Widget

  ready: ->
    # This is fired when the widget is done being rendered

  onData: (data) ->

    if data.sprintHealth
      $('.sprint-points-health .done').css('width', data.sprintPointsDone + '%')
      $('.sprint-points-health .remain').css('width', (100 - (data.sprintPointsDone + data.sprintPointsInProgress)) + '%')
      $('.sprint-points-health .in-progress').css('width', data.sprintPointsInProgress + '%')