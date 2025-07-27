// routes/wsRouter.js
import { Server } from 'rpc-websockets';
import { Server as HttpServer } from 'http';

export default function createWsRouter(httpServer:HttpServer) {
  const ws = new Server({ server: httpServer, path: '/client-ws' });
  ws.on('connection', (socket) => {
    console.log('WS client connected');
    socket.on('message', (raw:string) => {
      const msg = JSON.parse(raw);
      console.log('Mensaje recibido:', { msg,raw });
      socket.send(JSON.stringify({ echo: msg }));
    });
  });

  return ws;
}