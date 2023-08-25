import 'dotenv/config'
import { FRONTEND_URL } from './util/config';
import { httpServer } from './app';

const PORT = 5000;

httpServer.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
    console.log(`Running in ${process.env.NODE_ENV} mode`);
    console.log(`Connected to ${FRONTEND_URL}`)
})