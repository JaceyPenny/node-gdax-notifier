const GTT = require('gdax-trading-toolkit');
const request = require('request');

const GDAXFeed = GTT.Exchanges.GDAXFeed;
const GDAXAPI = GTT.Factories.GDAX.DefaultAPI;
const getSubscribedFeeds = GTT.Factories.GDAX.getSubscribedFeeds;

const gdaxAuth = {
    key: process.env.GDAX_API_KEY,
    secret: process.env.GDAX_API_SECRET,
    passphrase: process.env.GDAX_API_PASSPHRASE
};

const IFTTTTrigger = process.env.MAKER_TRIGGER;
const IFTTTKey = process.env.MAKER_KEY;
const IFTTTRequestUrl = "https://maker.ifttt.com/trigger/" + IFTTTTrigger + "/with/key/" + IFTTTKey;

const pairs = ["ETH-BTC", "LTC-BTC", "ETH-USD", "BTC-USD", "LTC-USD"];

let activeTrades = {};
let partialTrades = {};

const options = {
    wsUrl: 'wss://ws-feed.gdax.com',
    apiUrl: 'https://api.gdax.com',
    channels: ['user'],
    logger: console,
    auth: gdaxAuth
};

let gdax = new GDAXAPI();
gdax.auth = gdaxAuth;
console.log(gdax);

gdax.loadAllOrders().then((orders) => {
    orders.forEach((order) => {
        console.log('Added', order.side, 'in', order.productId);
        activeTrades[order.id] = order;
    });
});

function sendNotification(result) {
    request.post(IFTTTRequestUrl, { json: result }, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            console.log(body);
        } else {
            console.log("error sending request to ifttt:");
            console.log(error);
        }
    });
};

getSubscribedFeeds(options, pairs).then((feed) => {
    feed.on('data', (message) => {
        if (message.type == 'myOrderPlaced') {
            activeTrades[message.orderId] = message;
        } else if (message.type == 'tradeFinalized' && parseFloat(message.remainingSize) == 0.0) {
            let resultBody = {
                value1: "",
                value2: "",
                value3: ""
            };

            try {
                trade = activeTrades[message.orderId];
                result.value1 = message.productId;
                result.value2 = message.side;
                result.value3 = "" + message.size + " @ " + message.price;

                sendNotification(result);
            } catch (e) {

            }
        }
    });
});