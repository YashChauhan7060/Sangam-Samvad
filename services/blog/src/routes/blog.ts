import express from 'express';
import { getAllBlogs, getSingleBlog, addComment, getAllComments, deleteComment, saveBlog, getSavedBlog } from '../controllers/blog.js';
import { isAuth } from '../middleware/isAuth.js';
import { normalLimiter, readLimiter } from '../utils/rateLimiter.js';

const router = express.Router();

router.get("/blog/all",              readLimiter,   getAllBlogs);           // 100/min - public
router.get("/blog/:id",              readLimiter,   getSingleBlog);        // 100/min - public
router.get("/comment/:id",           readLimiter,   getAllComments);       // 100/min - public
router.post("/comment/:id",          normalLimiter, isAuth, addComment);   // 30/min
router.delete("/comment/:commentid", normalLimiter, isAuth, deleteComment);// 30/min
router.post("/save/:blogid",         normalLimiter, isAuth, saveBlog);     // 30/min
router.get("/blog/saved/all",        normalLimiter, isAuth, getSavedBlog); // 30/min

export default router;

