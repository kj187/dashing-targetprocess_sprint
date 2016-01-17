# TargetProcess sprint widget

Author: [Julian Kleinhans](https://github.com/kj187) · Blog: [http://blog.kj187.de](http://blog.kj187.de)

[Dashing-JS](https://github.com/fabiocaseri/dashing-js) is a NodeJS port of [Dashing](http://dashing.io/), an Sinatra based framework that lets you build beautiful dashboards.

The [TargetProcess](https://www.targetprocess.com/) sprint widget is a small widget which provides the team the end date of the current sprint and their left working days count. 
 
## Preview 

![TargetProcess sprint widget](http://res.cloudinary.com/kj187/image/upload/v1452759600/targetprocess_sprint_xqqzeg.png)

## Requirements

[Dashing-JS](https://github.com/fabiocaseri/dashing-js)
```ssh
$ npm install -g dashing-js
```

Widget dependencies
```shell
$ npm install tp-api
$ npm install cron
$ npm install strsplit
$ npm install moment
```

## Installation
```shell
$ dashing-js install https://github.com/kj187/dashing-targetprocess_sprint/archive/master.zip
```
Create a new directory `config` on your root directory.
Move the `widgets/targetprocess_sprint/config.targetprocess_sprint.sample.js` file to this directory and rename it to `config.targetprocess_sprint.js`.
 
```
assets/
  ...
config/
  config.targetprocess_sprint.js
  ...
dashboards/
  ...
jobs/
  ...
...
```

## Usage
To include the widget on your dashboard, add the following snippet to the dashboard layout file:

```html
<li data-row="1" data-col="1" data-sizex="1" data-sizey="1">
  <div data-id="targetprocess_sprint" data-view="TargetprocessSprint"></div>
  <i class="fa fa-clock-o icon-background"></i>
</li>
```
Or if you use Jade as your favorite template engine 
```jade
li(data-row='1', data-col='1', data-sizex='1', data-sizey='1')
  div(data-id='targetprocess_sprint', data-view='TargetprocessSprint', class='widget')
  i(class='fa fa-clock-o icon-background')
```

## Settings

```javascript
module.exports = {

    eventName: 'targetprocess_sprint',
    cronInterval: '15 * * * * *',

    api: {
        host: 'www.host.com',
        context: '2439DD66D093095E290CF98FB987D4B7',
        version: '1',
        protocol: 'https',
        token: 'bcdefabcdefabcdefgbcdefabcdefabcdefg'
        // or instead of an API token
        // username: '',
        // password: '',
    }
}
```

### Global settings
| Setting       | Example              | Description                |
| ------------- |----------------------| ---------------------------|
| eventName     | github_pullrequests  | Event name, must be the same as the `data-id` attribute |
| cronInterval     | 1 * * * * *  | Click [here](https://github.com/ncb000gt/node-cron) for available cron patterns |

### API settings
| Setting       | Example              | Description                |
| ------------- |----------------------| ---------------------------|
| host     | www.host.com  | Host of your TargetProcess |
| protocol     | https  | Http or https |
| context     | 2439DD66D093095E290CF98FB987D4B7 | ACID ID if you want to fetch something from a specific project |
| version     | 1  | TargetProcess API version, dont change |
| token     | bcdefabcdefabcdefgbcdefabcdefabcdefg  | TargetProcess API token |
| username     | julian.kleinhans  | If you dont have an API token, you can also use your username/password. But I highly recommend to use an API token |
| password     | xxxxxxx  | Your TargetProcess password |

## Changelog

### release-1.0.0
* First release

## Other Dashing-JS widgets
Do you know that I also created some other Dashing-JS widgets? Try out

* [Jenkins Job widget](http://kj187.github.io/dashing-jenkins_job/)
* [GitHub PullRequest widget](http://kj187.github.io/dashing-github_pullrequests/)
* [TargetProcess Impediments widget](http://kj187.github.io/dashing-targetprocess_impediments/)
* [TargetProcess Sprint widget](http://kj187.github.io/dashing-targetprocess_sprint/)
* [TargetProcess Burndown widget](http://kj187.github.io/dashing-targetprocess_burndown/)