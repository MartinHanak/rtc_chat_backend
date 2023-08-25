"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("./util/config");
const app_1 = require("./app");
const PORT = 5000;
app_1.httpServer.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
    console.log(`Running in ${process.env.NODE_ENV} mode`);
    console.log(`Connected to ${config_1.FRONTEND_URL}`);
});
//# sourceMappingURL=index.js.map