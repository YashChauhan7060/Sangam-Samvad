import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import getBuffer from "../utils/dataUri.js";
import TryCatch from "../utils/TryCatch.js";
import { sql } from "../utils/db.js";
import cloudinary from "cloudinary";


export const createBlog = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { title, description, blogcontent, category } = req.body;

  const file = req.file;

  if (!file) {
    res.status(400).json({
      message: "No file to upload",
    });
    return;
  }

  const fileBuffer = getBuffer(file);

  if (!fileBuffer || !fileBuffer.content) {
    res.status(400).json({
      message: "Failed to generate buffer",
    });
    return;
  }

  const cloud = await cloudinary.v2.uploader.upload(fileBuffer.content, {
    folder: "blogs",
  });

  const result =
    await sql`INSERT INTO blogs (title, description, image, blogcontent,category, author) VALUES (${title}, ${description},${cloud.secure_url},${blogcontent},${category},${req.user?._id}) RETURNING *`;


  res.json({
    message: "Blog Created",
    blog: result[0],
  });
});


export const updateBlog = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { title, description, blogcontent, category } = req.body;

  const file = req.file;

  const blog = await sql`SELECT * FROM blogs WHERE id = ${id}`;

  if (!blog.length) {
    res.status(404).json({
      message: "No blog with this id",
    });
    return;
  }

  if (blog[0].author !== req.user?._id) {
    res.status(401).json({
      message: "You are not author of this blog",
    });
    return;
  }

  let imageUrl = blog[0].image;

  if (file) {
    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
      res.status(400).json({
        message: "Failed to generate buffer",
      });
      return;
    }

    const cloud = await cloudinary.v2.uploader.upload(fileBuffer.content, {
      folder: "blogs",
    });

    imageUrl = cloud.secure_url;
  }


  const updatedBlog = await sql`UPDATE blogs SET
    title = ${title || blog[0].title},
    description = ${description || blog[0].description},
    image= ${imageUrl},
    blogcontent = ${blogcontent || blog[0].blogcontent},
    category = ${category || blog[0].category}

    WHERE id = ${id}
    RETURNING *
    `;


  res.json({
    message: "Blog Updated",
    blog: updatedBlog[0],
  });
});

export const deleteBlog = TryCatch(async (req: AuthenticatedRequest, res) => {
  const blog = await sql`SELECT * FROM blogs WHERE id = ${req.params.id}`;

  if (!blog.length) {
    res.status(404).json({
      message: "No blog with this id",
    });
    return;
  }

  if (blog[0].author !== req.user?._id) {
    res.status(401).json({
      message: "You are not author of this blog",
    });
    return;
  }

  await sql`DELETE FROM savedblogs WHERE blogid = ${req.params.id}`;
  await sql`DELETE FROM comments WHERE blogid = ${req.params.id}`;
  await sql`DELETE FROM blogs WHERE id = ${req.params.id}`;

  res.json({
    message: "Blog Delete",
  });
});