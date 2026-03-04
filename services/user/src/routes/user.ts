import express from "express";
import {
  getUserProfile,
  loginUser,
  myProfile,
  updateProfilePic,
  updateUser,
} from "../controllers/user.js";
import { isAuth } from "../middleware/isAuth.js";
import uploadFile from "../middleware/multer.js";
import { normalLimiter, strictLimiter } from "../utils/rateLimiter.js";

const router = express.Router();

router.post("/login",            strictLimiter, loginUser);               // 5/min - brute force guard
router.get("/me",                normalLimiter, isAuth, myProfile);       // 30/min
router.get("/user/:id",          normalLimiter, getUserProfile);          // 30/min
router.post("/user/update",      normalLimiter, isAuth, updateUser);      // 30/min
router.post("/user/update/pic",  normalLimiter, isAuth, uploadFile, updateProfilePic); // 30/min

export default router;