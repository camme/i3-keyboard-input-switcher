const exec = require('child_process').exec;
const i3 = require('i3');

const http = require('http');
const path = require('path');
const fs = require('fs');

const appPath = (path.join(process.env.HOME, './.config/i3-keyboard-switcher'));
let current = {};

let currentInstance = '';
let index = 0;

let defaults = {
    port: 18888,
    inputs: ['us', 'se'],
    predefined: { },
    logFile: '/var/log/i3-keyboard-switcher.log',
    historyFile: path.join(appPath, '.history'),
    log: 'console',
};

let config = {};

try {
    config = {
        ...defaults,
        ...require(path.join(appPath, './config.json')),
    };
} catch (_) {
    config = defaults;
}

const writeHistory = () => new Promise((resolve, reject) => {
    if (config.historyFile) {
        fs.writeFile(config.historyFile, JSON.stringify(current, null, 4), 'utf8', (err) => {
            if (err) {
                return eject(err);
            }
            resolve();
        });
    }
});

const log = (message) => {
    if (config.log) {
        if (config.log === 'console') {
            console.log(message);
        } else {
            fs.appendFileSync(config.logFile, `${message}\r\n`);
        }
    }
};

const setKeyboardLayout = (layout = 'us') => new Promise((resolve, reject) => {
    exec(`setxkbmap ${layout}`, function(err, stdout, stderr) {
        if (err) {
            return resolve(false);
        }
        if (stderr) {
            return resolve(false);
        }
        return resolve(true);
    });
});

const switchLayout = async (layout = '') => new Promise((resolve, reject) => {

    const callback = (response) => {
        let done = false;
        let body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            if (!done) {
                done = true;
                resolve(body);
            }
        });
        response.on('error', function () {
            if (!done) {
                done = true;
                reject(body);
            }
        });
    };

    http
        .request({
            method: 'GET',
            host: '127.0.0.1',
            port: config.port,
            path: `/?layout${layout}`,
        }, callback)
        .end();

});

const start = (layoutList) => {

    if (layoutList.length === 0 && config.inputs) {
        layoutList = config.inputs;
    }

    try {
        current = JSON.parse(fs.readFileSync(config.historyFile, 'utf8'));
    } catch (err) {
        console.log(err);
        log('no history');
    }

    const i3Client = i3.createClient();

    const requestListener = (req, res) => {
        const layoutRe = /layout=(\w\w)/;
        const match = layoutRe.exec(req.url);
        let layout = '';
        if (match) {
            layout = match[1];
        } else {
            index++;
            if (index >= layoutList.length) {
                index = 0;
            }
            layout = layoutList[index];
        }
        setImmediate(async () => {
            const ok = await setKeyboardLayout(layout);
            if (ok) {
                if (currentInstance) {
                    log(`remember ${currentInstance} ${layout}`);
                    current[currentInstance] = layout;
                    writeHistory();
                }
                return res.end('ok -- ' + layout + ' ' + index);
            }
            res.end('error');
        });
    };

    const server = http.createServer(requestListener);
    server.listen(config.port);

    i3Client.on('window', function(e) {
        if (e.container.focused) {
            currentInstance = e.container.window_properties.instance;
            if (config.predefined && config.predefined[currentInstance]) {
                log(`predefined ${currentInstance} ${config.predefined[currentInstance]}`);
                setKeyboardLayout(config.predefined[currentInstance]);
             } else if (current[currentInstance]) {
                log(`remember ${currentInstance} ${current[currentInstance]}`);
                setKeyboardLayout(current[currentInstance]);
            }
        }
    });

    log('start with ' + layoutList.join(' & ') + ' on port ' + config.port);

    process.on( 'SIGTERM', function () {
        server.close(function () {
            process.exit(0);
        });
    });

};

exports.start = start;
exports.switchLayout = switchLayout;
exports.log = log;
