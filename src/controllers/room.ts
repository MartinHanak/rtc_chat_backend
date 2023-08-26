import { Router } from "express";


export const roomRouter = Router();

roomRouter.get('/', async (req,res) => {
    res.status(200).json({message: 'router is working'})
});