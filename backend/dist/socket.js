"use strict";
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
