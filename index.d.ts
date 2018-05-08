export declare class ServerHelloEvent {
    clientTimeOut: number;
    prefixSize: number;
    payloadSize: number;
    frameSize: number;
    static Create(payload: Array<string>): {};
}
export declare class PrivateMessageEvent {
    qq: number;
    message: string;
    static Create(payload: Array<string>): PrivateMessageEvent;
}
export declare class GroupMessageEvent {
    ID: number;
    qq: number;
    message: string;
    static Create(payload: Array<string>): GroupMessageEvent;
}
export declare class GroupMemberChangeEvent {
    ID: number;
    qq: number;
    operatedQQ: number;
    static Create(payload: Array<string>): GroupMemberChangeEvent;
}
export declare class EventMap {
    'ServerHello': ServerHelloEvent;
    'PrivateMessage': PrivateMessageEvent;
    'GroupMessage': GroupMessageEvent;
    'DiscussMessage': GroupMessageEvent;
    'GroupMemberDecrease': GroupMemberChangeEvent;
    'GroupMemberIncrease': GroupMemberChangeEvent;
    'error': Error;
}
export declare class cqsocket {
    private port;
    private host;
    private hostPort;
    private eventStore;
    private socketServer;
    constructor(host: string, port: number);
    private genPayLoad(payload);
    private sendMessage(type, ...payload);
    private heartBeat();
    listen(port: number, callback?: (socket: cqsocket) => void): void;
    on<K extends keyof EventMap>(type: K, cb: (event: EventMap[K]) => any): void;
    private dispatch(type, event);
    SendPrivateMessage(qq: number, message: string): void;
    SendGroupMessage(id: number, message: string): void;
    SendDiscussMessage(id: number, message: string): void;
}
