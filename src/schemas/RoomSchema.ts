import { Schema } from "redis-om";

export const roomSchema = new Schema("room", {
  name: { type: "string" },
  type: { type: "string" },
  description: { type: "text" },
  createdAd: { type: "date" },
});

export enum roomType {
  video = "video",
  audio = "audio",
  text = "text",
}

export function isValidRoomType(input: string): input is roomType {
  return Object.values(roomType).includes(input as roomType);
}
