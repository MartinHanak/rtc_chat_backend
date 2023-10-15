import { Schema } from "redis-om";

export const userSchema = new Schema("user", {
  socketId: { type: "string" },
  username: { type: "string" },
  color: { type: "string" },
});
