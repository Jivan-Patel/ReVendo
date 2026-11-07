const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const outputFolder = path.join(__dirname, "../../uploads");
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

module.exports = async function (req, res, next) {
  if (!req.files || req.files.length === 0) return next();

  req.images = [];

  const host = req.get("host");
  const baseUrl = process.env.BASE_URL || `http://${host}`;

  try {
    await Promise.all(
      req.files.map(async (file, index) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fullFilename = `${uniqueSuffix}_full.jpg`;
        const thumbFilename = `${uniqueSuffix}_thumb.jpg`;

        // Full size image
        await sharp(file.buffer)
          .resize(1000, 1000, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(path.join(outputFolder, fullFilename));

        // Thumbnail preview
        await sharp(file.buffer)
          .resize(200, 200, { fit: "cover" })
          .jpeg({ quality: 50 })
          .toFile(path.join(outputFolder, thumbFilename));

        req.images.push({
          url: `${baseUrl}/uploads/${fullFilename}`,
          thumbnailUrl: `${baseUrl}/uploads/${thumbFilename}`,
        });
      })
    );

    next();
  } catch (error) {
    console.error("Image processing error:", error);
    return res.status(500).send({ error: "Could not process images." });
  }
};
