import express from 'express';
import { getAllBlogs,getSingleBlog,getSavedBlogs } from '../controllers/blog.js';

const router=express.Router();

router.get("/blog/all",getAllBlogs);
router.get("/blog/:id", getSingleBlog);
router.get("/blog/saved/all", getAllBlogs);

export default router;