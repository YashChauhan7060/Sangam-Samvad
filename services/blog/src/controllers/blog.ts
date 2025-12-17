import { sql } from "../utils/db";
import TryCatch from "../utils/TryCatch";
import axios from "axios";
import { redisClient } from "../server";

export const getAllBlogs = TryCatch(async (req, res) => {
  const { searchQuery = "", category = "" } = req.query;

  // 1. Check Redis Cache first
  const cacheKey = `blogs:${searchQuery}:${category}`;
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    console.log("Serving from Redis cache");
    res.json(JSON.parse(cached));
    return;
  }

  let blogs;
  console.log("Searching for:", searchQuery); 

  // 2. Database Query (With the "blogcontent" fix)
  if (searchQuery && category) {
    blogs = await sql`
      SELECT * FROM blogs 
      WHERE (title ILIKE ${"%" + searchQuery + "%"} 
         OR description ILIKE ${"%" + searchQuery + "%"} 
         OR blogcontent ILIKE ${"%" + searchQuery + "%"}
      ) AND category = ${category} 
      ORDER BY create_at DESC`;
  } 
  else if (searchQuery) {
    blogs = await sql`
      SELECT * FROM blogs 
      WHERE (title ILIKE ${"%" + searchQuery + "%"} 
         OR description ILIKE ${"%" + searchQuery + "%"} 
         OR blogcontent ILIKE ${"%" + searchQuery + "%"}
      ) ORDER BY create_at DESC`;
  } 
  else if (category) {
    blogs = await sql`
      SELECT * FROM blogs 
      WHERE category=${category} 
      ORDER BY create_at DESC`;
  } 
  else {
    blogs = await sql`SELECT * FROM blogs ORDER BY create_at DESC`;
  }

  console.log("Serving from db");

  // 3. Save to Redis (Cache for 1 hour)
  await redisClient.set(cacheKey, JSON.stringify(blogs), { EX: 3600 });

  res.json(blogs);
});

export const getSingleBlog = TryCatch(async (req, res) => {
  const blogid = req.params.id;
  const cacheKey = `blog:${blogid}`;

  // 1. Check Cache
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log("Serving single blog from Redis cache");
    res.json(JSON.parse(cached));
    return;
  }

  // 2. Fetch from DB
  const blog = await sql`SELECT * FROM blogs WHERE id = ${blogid}`;

  if (blog.length === 0) {
    res.status(404).json({
      message: "no blog with this id",
    });
    return;
  }

  // 3. Fetch Author details
  const { data } = await axios.get(
    `${process.env.USER_SERVICE}/api/v1/user/${blog[0].author}`
  );

  const responseData = { blog: blog[0], author: data };

  // 4. Save to Cache
  await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 3600 });

  res.json(responseData);
});