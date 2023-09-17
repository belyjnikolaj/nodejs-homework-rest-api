const express = require("express");

const wrap = require("../../controllers/auth")

const { isValidData, authenticate, upload } = require("../../middlewares");
const { schemas } = require("../../models/user");

const router = express.Router();

router.post("/register", isValidData(schemas.registerSchema), wrap.register);
router.post("/login", isValidData(schemas.loginSchema), wrap.login);
router.get("/current", authenticate, wrap.getCurrent);
router.post("/logout", authenticate, wrap.logout);
router.patch("/", authenticate, wrap.updateSubscription);
router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  wrap.updateAvatar
);

module.exports = router;