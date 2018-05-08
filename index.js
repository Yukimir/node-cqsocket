"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    constructor(port) {
        this.eventStore = new Map();
        this.port = port;
        for (let key in (new EventMap())) {
            this.eventStore.set(key, []);
        }
    }
    listen(callback) {
        callback();
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
//# sourceMappingURL=index.js.map