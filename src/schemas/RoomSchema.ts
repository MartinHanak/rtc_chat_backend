import { Schema } from "redis-om";

export const roomSchema = new Schema("room", {
  name: { type: "string" },
  type: { type: "string" },
  country: { type: "string" },
  description: { type: "text" },
  createdAd: { type: "date" },
  tags: { type: "string[]" },
  privateRoom: { type: "boolean" },
});

export enum roomType {
  video = "video",
  audio = "audio",
  text = "text",
}

export function isValidRoomType(input: string): input is roomType {
  return Object.values(roomType).includes(input as roomType);
}
