var Marathon = require('marathon.node'),
    _ = require('underscore'),
    ejs = require('ejs'),
    fs = require('fs');

// TODO read from consul
var MARATHON_API = 'http://10.141.141.10:8080';
var DOMAIN = 'flock.com';

var args = process.argv.slice(2);
var HAPROXY_CONFIG_FILE = args[0] || '/etc/haproxy/haproxy.cfg';

var client = new Marathon({base_url: MARATHON_API});
client.apps.list().then(function(res) {
    var apps = _.map(res.apps, function (app) { return app.id });

    client.tasks.list().then(function(res) {
        var tasks = _.chain(res.tasks)
                     .map(function (task) { return _.pick(task, 'appId', 'host', 'ports') })
                     .groupBy('appId')
                     .value();

        var backups = _.chain(res.tasks)
                       .filter(function (task) { return task.appId.indexOf('/flock-backup') === 0 })
                       .map(function (task) { return _.pick(task, 'appId', 'host', 'ports') })
                       .value();

        var haproxyConfig = render({'apps': apps, 'tasks': tasks, 'backups': backups, 'domain': DOMAIN});

        fs.writeFileSync(HAPROXY_CONFIG_FILE, haproxyConfig);

        console.log('flock-haproxy finished writing to %s', HAPROXY_CONFIG_FILE);
    });
});

ejs.filters.beautify = function(name) {
    var result = name.replace(/\/|-|\./g, '_');
    if (result.indexOf('_') === 0) {
        result = result.substring(1);
    }
    return result;
};

function render(context) {
    var path = __dirname + '/templates/haproxy.ejs';
    var template = fs.readFileSync(path, 'utf8');
    var result = ejs.render(template, context);
    return result.replace(/\n\s*\n/g, '\n'); // remove extra line breaks
}
