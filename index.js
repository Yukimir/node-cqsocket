"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dgram = require("dgram");
const iconv = require("iconv-lite");
class ServerHelloEvent {
    constructor() {
        this.clientTimeOut = 0;
        this.prefixSize = 0;
        this.payloadSize = 0;
        this.frameSize = 0;
    }
    static Create(payload) {
    }
}
class PrivateMessageEvent {
    static Create(payload) {
    }
}
class GroupMessageEvent {
    static Create(payload) {
    }
}
class GroupMemberChangeEvent {
    static Create(payload) {
    }
}
class EventMap {
    constructor() {
        this['server-hello'] = null;
        this['private-message'] = null;
        this['group-message'] = null;
        this['discuss-message'] = null;
        this['group-member-decrease'] = null;
        this['group-member-increase'] = null;
        this['error'] = null;
    }
}
const PrefixList = {
    'ServerHello': ServerHelloEvent.Create,
    'PrivateMessage': PrivateMessageEvent.Create,
    'GroupMessage': GroupMessageEvent.Create,
    'DiscussMessage': GroupMessageEvent.Create,
    'GroupMemberDecrease': GroupMemberChangeEvent.Create,
    'GroupMemberIncrease': GroupMemberChangeEvent.Create
};
class cqsocket {
    constructor(host, port) {
        this.eventStore = new Map();
        this.socketServer = dgram.createSocket('udp4');
        this.host = host;
        this.hostPort = port;
        for (let key in (new EventMap())) {
            this.eventStore.set(key, []);
        }
        this.socketServer.on('message', (msg, rinfo) => {
            console.log(msg);
        });
        this.socketServer.on('error', (err) => {
            this.dispatch('error', err);
        });
    }
    genPayLoad(payload) {
        let s = "";
        for (let v of payload) {
            s += `${v.toString()} `;
        }
        return s.trimRight();
    }
    sendMessage(type, ...payload) {
        for (let key in payload) {
            const v = payload[key];
            if (typeof v === 'string') {
                const gbk = iconv.encode(v, 'gbk18030');
                payload[key] = gbk.toString('base64');
            }
        }
        const message = type + ' ' + this.genPayLoad(payload);
        console.log(message);
        this.socketServer.send(message, this.hostPort, this.host);
    }
    heartBeat() {
        this.sendMessage('ClientHello', this.port);
    }
    listen(port, callback) {
        this.port = port;
        setInterval(this.heartBeat, 250);
        this.socketServer.bind(port, () => {
            if (callback)
                callback(this);
        });
    }
    on(type, cb) {
        this.eventStore.get(type).push(cb);
    }
    dispatch(type, event) {
        const list = this.eventStore.get(type);
        for (const fn of list) {
            fn(event);
        }
    }
}
exports.cqsocket = cqsocket;
const cq = new cqsocket('127.0.0.1', 9001);
cq.listen(9002);
//# sourceMappingURL=index.js.map