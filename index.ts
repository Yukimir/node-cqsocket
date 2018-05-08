import * as dgram from 'dgram'
import * as iconv from 'iconv-lite'

class ServerHelloEvent {
    clientTimeOut: number = 0;
    prefixSize: number = 0;
    payloadSize: number = 0;
    frameSize: number = 0;
    static Create(payload: Array<any>) {

    }
}
class PrivateMessageEvent {
    qq: number;
    message: string;
    static Create(payload: Array<any>) {

    }
}
class GroupMessageEvent {
    ID: number;
    qq: number;
    message: string;
    static Create(payload: Array<any>) {

    }
}
class GroupMemberChangeEvent {
    ID: number;
    qq: number;
    operatedQQ: number;
    static Create(payload: Array<any>) {

    }
}

class EventMap {
    'server-hello': ServerHelloEvent = null;
    'private-message': PrivateMessageEvent = null;
    'group-message': GroupMessageEvent = null;
    'discuss-message': GroupMessageEvent = null;
    'group-member-decrease': GroupMemberChangeEvent = null;
    'group-member-increase': GroupMemberChangeEvent = null;
    'error': Error = null;
}
const PrefixList = {
    'ServerHello': ServerHelloEvent.Create,
    'PrivateMessage': PrivateMessageEvent.Create,
    'GroupMessage': GroupMessageEvent.Create,
    'DiscussMessage': GroupMessageEvent.Create,
    'GroupMemberDecrease': GroupMemberChangeEvent.Create,
    'GroupMemberIncrease': GroupMemberChangeEvent.Create
}

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
            console.log(msg);
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
                const gbk = iconv.encode(v, 'gbk18030');
                payload[key] = gbk.toString('base64');
            }
        }
        const message = type + ' ' + this.genPayLoad(payload);
        console.log(message);
        this.socketServer.send(message, this.hostPort, this.host)
    }
    private heartBeat() {
        this.sendMessage('ClientHello', this.port);
    }
    public listen(port: number, callback?: (socket: cqsocket) => void) {
        this.port = port;
        // 启动心跳
        setInterval(() => {
            this.heartBeat();
        }, 250000);
        // 在这里启动监听
        this.socketServer.bind(port, () => {
            if (callback) callback(this);
        })
    }
    public on<K extends keyof EventMap>(type: K, cb: (event: EventMap[K]) => any) {
        this.eventStore.get(type).push(cb);
    }
    private dispatch<K extends keyof EventMap>(type: K, event: EventMap[K]) {
        const list = this.eventStore.get(type);
        for (const fn of list) {
            fn(event);
        }
    }
    // 增加主动操作
}

const cq = new cqsocket('127.0.0.1', 9001);
cq.listen(9002);