import 'dotenv/config'
import { FRONTEND_URL } from './util/config';
import { RedisService } from './services/redis';
import { httpServer } from './app';

const PORT = 5000;

export const RedisSession = new RedisService();

RedisSession.connectToDatabase()
.then(() => {
    console.log(`Connected to Redis successfully`);

    httpServer.listen(PORT, () => {
        console.log(`Server is listening on http://localhost:${PORT}`);
        console.log(`Running in ${process.env.NODE_ENV} mode`);
        console.log(`Connected to ${FRONTEND_URL}`)
    })
})
.catch((err) => {
    console.log(err)
})

