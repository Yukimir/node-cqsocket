import * as dgram from 'dgram'
import * as iconv from 'iconv-lite'

function decodeText(text: string) {
    return iconv.decode(new Buffer(text, 'base64'), 'gb18030');
}

class ServerHelloEvent {
    clientTimeOut: number = 0;
    prefixSize: number = 0;
    payloadSize: number = 0;
    frameSize: number = 0;
    static Create(payload: Array<string>) {
        return {};
    }
}
class PrivateMessageEvent {
    qq: number;
    message: string;
    static Create(payload: Array<string>) {
        const r = new PrivateMessageEvent();
        r.qq = parseInt(payload[1]);
        r.message = decodeText(payload[2]);
        return r;
    }
}
class GroupMessageEvent {
    ID: number;
    qq: number;
    message: string;
    static Create(payload: Array<string>) {
        const r = new GroupMessageEvent();
        r.ID = parseInt(payload[1]);
        r.qq = parseInt(payload[2]);
        r.message = decodeText(payload[3]);
        return r;
    }
}
class GroupMemberChangeEvent {
    ID: number;
    qq: number;
    operatedQQ: number;
    static Create(payload: Array<string>) {
        const r = new GroupMemberChangeEvent();
        r.ID = parseInt(payload[1]);
        r.qq = parseInt(payload[2]);
        r.operatedQQ = parseInt(payload[3]);
        return r;
    }
}

class EventMap {
    'ServerHello': ServerHelloEvent = null;
    'PrivateMessage': PrivateMessageEvent = null;
    'GroupMessage': GroupMessageEvent = null;
    'DiscussMessage': GroupMessageEvent = null;
    'GroupMemberDecrease': GroupMemberChangeEvent = null;
    'GroupMemberIncrease': GroupMemberChangeEvent = null;
    'error': Error = null;
}
const PrefixList = new Map<string, (payload: string[]) => any>([
    ['ServerHello', ServerHelloEvent.Create],
    ['PrivateMessage', PrivateMessageEvent.Create],
    ['GroupMessage', GroupMessageEvent.Create],
    ['DiscussMessage', GroupMessageEvent.Create],
    ['GroupMemberDecrease', GroupMemberChangeEvent.Create],
    ['GroupMemberIncrease', GroupMemberChangeEvent.Create]
]);

export class cqsocket {
    private port: number;
    private host: string;
    private hostPort: number;
    private eventStore = new Map<string, Array<any>>();
    private socketServer: dgram.Socket = dgram.createSocket('udp4')
    constructor(host: string, port: number) {
        this.host = host;
        this.hostPort = port;
        for (let key in (new EventMap())) {
            this.eventStore.set(key, []);
        }
        // 处理消息
        this.socketServer.on('message', (msg, rinfo) => {
            const s = msg.toString('utf-8');
            const args = s.split(' ');
            const factory = PrefixList.get(args[0]);
            if (factory) this.dispatch(args[0], factory(args));
        })
        // 处理错误
        this.socketServer.on('error', (err) => {
            this.dispatch('error', err);
        })
    }
    private genPayLoad(payload: any) {
        let s = ""
        for (let v of payload) {
            s += `${v.toString()} `;
        }
        return s.trimRight();
    }
    private sendMessage(type: string, ...payload: any[]) {
        for (let key in payload) {
            const v = payload[key];
            if (typeof v === 'string') {
                // base64
                const gbk = iconv.encode(v, 'gb18030');
                payload[key] = gbk.toString('base64');
            }
        }
        const message = type + ' ' + this.genPayLoad(payload);
        this.socketServer.send(message, this.hostPort, this.host)
    }
    private heartBeat() {
        this.sendMessage('ClientHello', this.port);
    }
    public listen(port: number, callback?: (socket: cqsocket) => void) {
        this.port = port;
        // 在这里启动监听
        this.socketServer.bind(port, () => {
            if (callback) callback(this);
        })
        // 启动心跳
        this.heartBeat();
        setInterval(() => {
            this.heartBeat();
        }, 250000);
    }
    public on<K extends keyof EventMap>(type: K, cb: (event: EventMap[K]) => any) {
        this.eventStore.get(type).push(cb);
    }
    private dispatch(type: string, event: any): void;
    private dispatch<K extends keyof EventMap>(type: K, event: EventMap[K]) {
        const list = this.eventStore.get(type);
        if (list) {
            for (const fn of list) {
                fn(event);
            }
        }
    }
    // 增加主动操作
    public SendPrivateMessage(qq: number, message: string) {
        this.sendMessage('PrivateMessage', qq, message);
    }
    public SendGroupMessage(id: number, message: string) {
        this.sendMessage('GroupMessage', id, message);
    }
    public SendDiscussMessage(id: number, message: string) {
        this.sendMessage('DiscussMessage', id, message);
    }
}

const cq = new cqsocket('127.0.0.1', 9001);
cq.listen(9002);

cq.on('GroupMessage', (event) => {
    if(event.ID === 630035378){
        cq.SendGroupMessage(event.ID,event.message);
    }
})