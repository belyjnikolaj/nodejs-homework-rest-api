const multer = require("multer");
const path = require("node:path");
const crypto = require("node:crypto"); 

const multerConfig = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, path.join(__dirname, "../", "tmp"));
  },
    filename: (_, file, cb) => {
        const extname = path.extname(file.originalname);
        const basename = path.basename(file.originalname, extname);
        const suffix = crypto.randomUUID();
    cb(null, `${basename}-${suffix}${extname}`);
  },
});

const upload = multer({
  storage: multerConfig,
});

module.exports = upload;