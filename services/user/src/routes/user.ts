import express from "express";
import { getUserProfile, loginUser, myProfile } from "../controllers/user.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();

router.post("/login",loginUser)
router.get("/me",isAuth,myProfile)
router.get("/user/:id",getUserProfile)

export default router;