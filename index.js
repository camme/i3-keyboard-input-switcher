const exec = require('child_process').exec;
const i3 = require('i3');

const http = require('http');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const log = (message) => {
    fs.appendFileSync(path.join(__dirname, './test.log'), `${message}\r\n`);
};

const current = {};
let currentInstance = '';
let index = 0;

const setKeyboardLayout = (layout = 'us') => new Promise((resolve, reject) => {
    exec(`setxkbmap ${layout}`, function(err, stdout, stderr) {
        if (err) {
            console.log(err);
            return resolve(false);
        }
        if (stderr) {
            console.log(stderr);
            return resolve(false);
        }
        return resolve(true);
    });
});


const switchLayout = async (layout = '') => {
    return await fetch(`http://127.0.0.1:18888?layout=${layout}`);
};

const start = (layoutList) => {

    const i3Client = i3.createClient();

    const requestListener = async (req, res) => {
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
        const ok = await setKeyboardLayout(layout);
        if (ok) {
            if (currentInstance) {
                console.log('remember ', currentInstance, layout);
                current[currentInstance] = layout;
            }
            log('----' + ok);
            return res.end('ok -- ' + layout + ' ' + index);
        }
        log('errroooorr');
        res.end('error');
    };

    const server = http.createServer(requestListener);
    server.listen(18888);

    i3Client.on('window', function(e) {
        if (e.container.focused) {
            currentInstance = e.container.window_properties.instance;
            if (current[currentInstance]) {
                console.log('remember ', currentInstance, current[currentInstance]);
                setKeyboardLayout(current[currentInstance]);
            }
        }
    });

    console.log('start with', layoutList.join(' & '));
    log('start');

    process.on( 'SIGTERM', function () {
        server.close(function () {
            console.log("Finished all requests");
            process.exit(0);
        });
    });

};

exports.start = start;
exports.switchLayout = switchLayout;

