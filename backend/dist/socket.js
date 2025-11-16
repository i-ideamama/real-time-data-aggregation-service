"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
let ioInstance = null;
function initSocket(server) {
    var _a;
    if (ioInstance)
        return ioInstance;
    const opts = {
        cors: {
            origin: (_a = process.env.CORS_ORIGIN) !== null && _a !== void 0 ? _a : '*',
            methods: ['GET', 'POST'],
        },
        serveClient: false,
    };
    ioInstance = new socket_io_1.Server(server, opts);
    ioInstance.on('connection', (socket) => {
        console.log('[socket] connected', socket.id);
        socket.on('disconnect', () => console.log('[socket] disconnected', socket.id));
    });
    console.info('[socket] server initialized');
    return ioInstance;
}
function getIO() {
    return ioInstance;
}
// import exp from 'constants';
// import {Server as HTTPServer} from 'http';
// import {Socket ,Server} from 'socket.io';
// import {v4} from 'uuid';
// export class ServerSocket{ 
//     public static instance : ServerSocket;
//     public io: Server;
//     // list of all users
//     public users : { [uid : string] : string};
//     constructor(server:HTTPServer){
//         ServerSocket.instance = this;
//         this.users = {};
//         this.io = new Server(server, {
//             serveClient : false,
//             pingInterval : 10000,
//             pingTimeout : 5000,
//             cookie : false,
//             cors : {
//                 origin : '*'
//             }
//         });
//         this.io.on('connect' , this.StartListeners);
//         console.info('socket IO started!');
//     }
//     // add events that you want to pick up from each socket
//     StartListeners = (socket : Socket) => {
//         console.info('message from  ' + socket.id);
//         socket.on('handshake' , () => {
//             console.info('handshake from ' + socket.id);
//         });
//         socket.on('disconnect', () => {
//             console.info('disconnect received from ' + socket.id);
//         });
//     }
// }
