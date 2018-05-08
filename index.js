"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dgram = require("dgram");
const iconv = require("iconv-lite");
function decodeText(text) {
    return iconv.decode(new Buffer(text, 'base64'), 'gb18030');
}
class ServerHelloEvent {
    constructor() {
        this.clientTimeOut = 0;
        this.prefixSize = 0;
        this.payloadSize = 0;
        this.frameSize = 0;
    }
    static Create(payload) {
        return {};
    }
}
class PrivateMessageEvent {
    static Create(payload) {
        const r = new PrivateMessageEvent();
        r.qq = parseInt(payload[1]);
        r.message = decodeText(payload[2]);
        return r;
    }
}
class GroupMessageEvent {
    static Create(payload) {
        const r = new GroupMessageEvent();
        r.ID = parseInt(payload[1]);
        r.qq = parseInt(payload[2]);
        r.message = decodeText(payload[3]);
        return r;
    }
}
class GroupMemberChangeEvent {
    static Create(payload) {
        const r = new GroupMemberChangeEvent();
        r.ID = parseInt(payload[1]);
        r.qq = parseInt(payload[2]);
        r.operatedQQ = parseInt(payload[3]);
        return r;
    }
}
class EventMap {
    constructor() {
        this['ServerHello'] = null;
        this['PrivateMessage'] = null;
        this['GroupMessage'] = null;
        this['DiscussMessage'] = null;
        this['GroupMemberDecrease'] = null;
        this['GroupMemberIncrease'] = null;
        this['error'] = null;
    }
}
const PrefixList = new Map([
    ['ServerHello', ServerHelloEvent.Create],
    ['PrivateMessage', PrivateMessageEvent.Create],
    ['GroupMessage', GroupMessageEvent.Create],
    ['DiscussMessage', GroupMessageEvent.Create],
    ['GroupMemberDecrease', GroupMemberChangeEvent.Create],
    ['GroupMemberIncrease', GroupMemberChangeEvent.Create]
]);
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
            const s = msg.toString('utf-8');
            const args = s.split(' ');
            const factory = PrefixList.get(args[0]);
            if (factory)
                this.dispatch(args[0], factory(args));
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
                const gbk = iconv.encode(v, 'gb18030');
                payload[key] = gbk.toString('base64');
            }
        }
        const message = type + ' ' + this.genPayLoad(payload);
        this.socketServer.send(message, this.hostPort, this.host);
    }
    heartBeat() {
        this.sendMessage('ClientHello', this.port);
    }
    listen(port, callback) {
        this.port = port;
        this.socketServer.bind(port, () => {
            if (callback)
                callback(this);
        });
        this.heartBeat();
        setInterval(() => {
            this.heartBeat();
        }, 250000);
    }
    on(type, cb) {
        this.eventStore.get(type).push(cb);
    }
    dispatch(type, event) {
        const list = this.eventStore.get(type);
        if (list) {
            for (const fn of list) {
                fn(event);
            }
        }
    }
    SendPrivateMessage(qq, message) {
        this.sendMessage('PrivateMessage', qq, message);
    }
    SendGroupMessage(id, message) {
        this.sendMessage('GroupMessage', id, message);
    }
    SendDiscussMessage(id, message) {
        this.sendMessage('DiscussMessage', id, message);
    }
}
exports.cqsocket = cqsocket;
//# sourceMappingURL=index.js.map