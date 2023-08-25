
export type RTCSessionDescriptionInit = {
   sdp?: undefined | string,
   type: "offer" | "pranswer" | "answer" | "rollback"
}


export interface ServerToClientEvents {
    // room events, specific for one socket
    "created": (hostId: string) => void,
    "joined": (hostId: string) => void,
    "full": () => void,
    // webRTC events
    "offer": (fromSocketId: string, offer: RTCSessionDescriptionInit) => void,
    "answer": (fromSocketId: string, answer: RTCSessionDescriptionInit) => void,
    "ice-candidate": (fromSocketId: string, candidate: any) => void,
    "ready": (fromSocketId: string, username?:string) => void,
    "leave": (fromSocketId: string,) => void,
    // chat
    "message": (fromSocketId: string, message: string) => void
}

export interface ClientToServerEvents {
    // webRTC events
    "offer": (fromSocketId: string, offer: RTCSessionDescriptionInit) => void,
    "answer": (fromSocketId: string, answer: RTCSessionDescriptionInit) => void,
    "ice-candidate": (fromSocketId: string, candidate: any ) => void,
    "ready": (fromSocketId: string, username?:string ) => void,
    "leave": (fromSocketId: string,) => void,
    // chat
    "message": (fromSocketId: string, message: string) => void
}

export interface InterServerEvents {

}

export interface SocketData  {

}
