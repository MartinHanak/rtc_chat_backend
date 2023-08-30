import { Response, Router } from "express";
import { RedisSession } from "..";


const subscribers = new Set<Response>();


export const roomSSERouter = Router();

// SSE route for the list of available rooms
roomSSERouter.get('/', async (req, res) => {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);

    subscribers.add(res);

    // send 1st notification
    const rooms = await RedisSession.getAllRooms();

    res.write(`data: ${JSON.stringify(rooms)}\n\n`);

    req.on('error', () => {
        res.status(500).json({message: `Rooms SSE controller internal server error.`})
    });

    req.on('close', () => {
        console.log('SSE connection closed');
        res.end();
        subscribers.delete(res);
    })

})


// all notifications after the 1st one come from calling this function
export async function notifySubscribers() {

    const rooms = await RedisSession.getAllRooms();

    subscribers.forEach((sub) => {
        sub.write(`data: ${JSON.stringify(rooms)}\n\n`);
    })

}