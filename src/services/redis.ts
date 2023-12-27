import { createClient } from "redis";
import { EntityId, Repository, Entity } from "redis-om";
import { isValidRoomType, roomSchema, roomType } from "../schemas/RoomSchema";
import { notifySubscribers } from "../controllers/roomSSE";
import { userSchema } from "../schemas/UserSchema";
import { userInfo } from "../types";

export class RedisService {
  private _client: any;

  private _roomRepository: Repository;
  private _userRepository: Repository;

  constructor() {
    // Connect to localhost on port 6379
    this._client = createClient();
    this._client.on("error", (err: Error) =>
      console.log("Redis Client Error", err)
    );

    // repositories
    this._roomRepository = new Repository(roomSchema, this._client);
    this._userRepository = new Repository(userSchema, this._client);
  }

  async connectToDatabase() {
    await this._client.connect();

    // create indexes for all repositories
    // only called if schema changed
    const indexPromises = Promise.all([
      this._roomRepository.createIndex(),
      this._userRepository.createIndex(),
    ]);

    return indexPromises;
  }

  async createRoom(
    name: string,
    type: string,
    country: string,
    description: string = "",
    tags: string[],
    privateRoom: boolean
  ) {
    if (!isValidRoomType(type)) {
      type = roomType.video;
    }

    let room = {
      name: decodeURIComponent(name),
      type: type,
      country: country,
      description: description,
      createdAt: Date.now() / 1000, // in seconds
      tags: tags,
      privateRoom: privateRoom,
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

  async getUser(socketId: string) {
    const user = await this._userRepository
      .search()
      .where("socketId")
      .equals(socketId)
      .return.first();

    if (user && typeof user.username === "string") {
      return user;
    } else {
      console.log(`No user found for the socket id ${socketId}.`);
      return null;
    }
  }

  async saveUser(socketId: string, username: string, color?: string) {
    let user: Entity = {
      socketId,
      username,
    };

    if (color) {
      user.color = color;
    }

    let userEntity = await this._userRepository.save(user);

    return userEntity;
  }

  async updateUserInfo(socketId: string, newInfo: userInfo) {
    let userEntity = await this._userRepository
      .search()
      .where("socketId")
      .equals(socketId)
      .return.first();

    if (!userEntity) {
      console.error(`User with the socketId: ${socketId} not found.`);
      return;
    }

    for (const prop in newInfo) {
      userEntity[prop] = newInfo[prop as keyof userInfo];
    }

    return await this._userRepository.save(userEntity);
  }
}
