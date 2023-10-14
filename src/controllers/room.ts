import { Router } from "express";
import { RedisSession } from "..";

export const roomRouter = Router();

roomRouter.get("/", async (req, res) => {
  const type = req.query.type as string;

  if (type) {
    const rooms = await RedisSession.getRoomsOfType(type);
    res.status(200).json(rooms);
  } else {
    const rooms = await RedisSession.getAllRooms();
    res.status(200).json(rooms);
  }
});

roomRouter.get("/:id", async (req, res) => {
  const id = req.params.id;

  const room = await RedisSession.getRoomByName(id);

  if (room) {
    res.status(200).json(room);
  } else {
    res.status(404).json({ message: `No room with the name ${id} found.` });
  }
});

roomRouter.post("/", async (req, res) => {
  const name = req.body.name;
  const type = req.body.type;
  const description = req.body.description ? req.body.description : "";
  const privateRoom = req.body.privateRoom ? true : false;

  const existingRoom = await RedisSession.getRoomByName(name);

  if (existingRoom) {
    res
      .status(409)
      .json({ message: `Room with the name ${name} already exists` });
    return;
  }

  try {
    const EntityId = await RedisSession.createRoom(
      name,
      type,
      description,
      privateRoom
    );
    res.status(201).json({ EntityId: EntityId });
  } catch {
    res.status(500).json({
      message: `Could not create room with name ${name} and type ${type}.`,
    });
  }
});

roomRouter.delete("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await RedisSession.deleteRoom(id);
    res.json({ message: `Room ${id} deleted successfully.` });
  } catch {
    res.json({
      message: `No room with the name ${id} found and so it was not deleted.`,
    });
  }
});
