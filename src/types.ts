export interface userInfo {
  socketId: string;
  username: string;
}

export interface ServerToClientEvents {
  // room events
  "room-users": (users: userInfo[]) => void;

  // webRTC events
  // 1-to-1 connection
  offer: (fromSocketId: string, toSocketId: string, offer: any) => void;
  answer: (fromSocketId: string, toSocketId: string, answer: any) => void;
  "ice-candidate": (
    fromSocketId: string,
    toSocketId: string,
    candidate: any
  ) => void;

  // chat
  // 1-to-many connection
  message: (fromSocketId: string, message: string, time: number) => void;

  // socket.io events
  // only for logs
  reconnect: (attemptNumber: number) => void;
  reconnect_error: (error: any) => void;
  reconnect_failed: () => void;
}

export interface ClientToServerEvents {
  // webRTC events
  // 1-to-1 connection
  offer: (fromSocketId: string, toSocketId: string, offer: any) => void;
  answer: (fromSocketId: string, toSocketId: string, answer: any) => void;
  "ice-candidate": (
    fromSocketId: string,
    toSocketId: string,
    candidate: any
  ) => void;

  // chat
  // 1-to-many connection
  message: (fromSocketId: string, message: string, time: number) => void;
}

export interface InterServerEvents {}

export interface SocketData {}
