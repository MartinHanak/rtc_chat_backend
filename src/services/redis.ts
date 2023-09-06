import { createClient } from "redis";
import { EntityId, Repository, Entity } from "redis-om";
import { isValidRoomType, roomSchema, roomType } from "../schemas/RoomSchema";
import { notifySubscribers } from "../controllers/roomSSE";

export class RedisService {
  private _client: any;

  private _roomRepository: Repository;

  constructor() {
    // Connect to localhost on port 6379
    this._client = createClient();
    this._client.on("error", (err: Error) =>
      console.log("Redis Client Error", err)
    );

    // repositories
    this._roomRepository = new Repository(roomSchema, this._client);
  }

  async connectToDatabase() {
    await this._client.connect();

    // create indexes for all repositories
    // only called if schema changed
    const indexPromises = Promise.all([this._roomRepository.createIndex()]);

    return indexPromises;
  }

  async createRoom(name: string, type: string) {
    if (!isValidRoomType(type)) {
      type = roomType.video;
    }

    let room = {
      name: name,
      type: type,
      createdAt: Date.now() / 1000, // in seconds
    };

    // returns copy with new properties like id
    let roomEntity = await this._roomRepository.save(room);
    await notifySubscribers();

    return roomEntity[EntityId];
  }

  async getAllRooms() {
    const rooms = await this._roomRepository.search().return.all();

    return rooms;
  }

  async getRoomsOfType(type: string) {
    if (!isValidRoomType(type)) {
      type = roomType.video;
    }

    const rooms = await this._roomRepository
      .search()
      .where("type")
      .equals(type)
      .return.all();

    return rooms;
  }

  async getRoomByName(name: string) {
    const room = await this._roomRepository
      .search()
      .where("name")
      .equals(name)
      .return.first();

    return room;
  }

  async deleteRoom(name: string) {
    const room = await this._roomRepository
      .search()
      .where("name")
      .equals(name)
      .return.first();

    if (room && room[EntityId]) {
      const idToRemove = room[EntityId];
      await this._roomRepository.remove(idToRemove);
      await notifySubscribers();
    } else {
      console.log(`No room ${name} found.`);
    }
  }
}
