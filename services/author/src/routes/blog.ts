import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import uploadFile from "../middlewares/multer.js";
import { aiBlogResponse, aiDescriptionResponse, aiTitleResponse, createBlog, deleteBlog, updateBlog } from "../controllers/blog.js";
import { writeLimiter, normalLimiter } from "../utils/rateLimiter.js";

const router = express.Router();

router.post("/blog/new",        writeLimiter,  isAuth, uploadFile, createBlog);  // 10/min - prevent spam
router.post("/blog/:id",        writeLimiter,  isAuth, uploadFile, updateBlog);  // 10/min
router.delete("/blog/:id",      writeLimiter,  isAuth, deleteBlog);              // 10/min
router.post("/ai/title",        normalLimiter, aiTitleResponse);                 // 30/min
router.post("/ai/descripiton",  normalLimiter, aiDescriptionResponse);           // 30/min
router.post("/ai/blog",         normalLimiter, aiBlogResponse);                  // 30/min

export default router;