let express = require("express");
let webPush = require("web-push");
let atob = require('atob');
let bodyParser = require('body-parser');
let util = require('util');

let app = express();

let subscribers = [];

let VAPID_SUBJECT =  "mailto:test@test.com";
let VAPID_PUBLIC_KEY = "BA3C1MU1xJ24EBCocG7SijE0tBFVqGc_FHREQDlV5PPMd6VpUgnGhI3fHtSyjoI9erdcSZePI7D9ViYdBAnpt6M";
let VAPID_PRIVATE_KEY = "4pOjwfqjfo2DGUpHbX_V7Rl_4Aow2Zqei4QW_S4AD3c";

//Auth secret used to authentication notification requests.
let AUTH_SECRET = "qwertyuiop";

if (!VAPID_SUBJECT) {
    return console.error('VAPID_SUBJECT environment variable not found.')
} else if (!VAPID_PUBLIC_KEY) {
    return console.error('VAPID_PUBLIC_KEY environment variable not found.')
} else if (!VAPID_PRIVATE_KEY) {
    return console.error('VAPID_PRIVATE_KEY environment variable not found.')
} else if (!AUTH_SECRET) {
    return console.error('AUTH_SECRET environment variable not found.')
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

webPush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

app.use(express.static('static'));

app.get('/status', function (req, res) {
    res.send('Server Running!')
});

app.get('/notify/all', function (req, res) {
    if(req.get('auth-secret') != AUTH_SECRET) {
        console.log("Missing or incorrect auth-secret header. Rejecting request.");
        return res.sendStatus(401);
    }
    console.log(req.body);
    console.log("above");
    let message = req.body.message || `chocolate is the best!`;
    let clickTarget = req.body.clickTarget || `http://www.turmswear.com`;
    let title = req.body.title || `Push notification received!`;
    let icon  =  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSb3s6QjLM7-USMkra-cCcLXDBbHSOCuNyf6N1Ure26QlWUetRR";

    subscribers.forEach(pushSubscription => {
        //Can be anything you want. No specific structure necessary.
        let payload = JSON.stringify({message : message, clickTarget: clickTarget, title: title,icon: icon});
        // webPush
        // .sendNotification(pushSubscription, payload)
        // .catch(err => console.error(err));
        webPush.sendNotification(pushSubscription, payload, {}).then((response) =>{
            console.log("Status : "+util.inspect(response.statusCode));
            console.log("Headers : "+JSON.stringify(response.headers));
            console.log("Body : "+JSON.stringify(response.body));
        }).catch((error) =>{
            console.log(pushSubscription);
            console.log("here");
            console.log("Status : "+util.inspect(error.statusCode));
            console.log("Headers : "+JSON.stringify(error.headers));
            console.log("Body : "+JSON.stringify(error.body));
        });
    });

    res.send('Notification sent!');
});

app.post('/subscribe', function (req, res) {
    let endpoint = req.body['notificationEndPoint'];
    let publicKey = req.body['publicKey'];
    let auth = req.body['auth'];
    
    let pushSubscription = {
        'endpoint': endpoint,
        'keys': {
            'p256dh': publicKey,
            'auth': auth
        }
    };
    
    subscribers.push(pushSubscription);

    res.send('Subscription accepted!');
});

app.post('/unsubscribe', function (req, res) {
    let endpoint = req.body['notificationEndPoint'];
    
    subscribers = subscribers.filter(subscriber => { endpoint == subscriber.endpoint });

    res.send('Subscription removed!');
});

let PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
    console.log(`push_server listening on port ${PORT}!`)
});
