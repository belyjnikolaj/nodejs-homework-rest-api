const crypto = require("node:crypto");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("node:path");
const fs = require("node:fs/promises");
const Jimp = require("jimp");

const { User } = require("../models/user");

const { HttpError, wrapController } = require("../helpers");

const { SECRET_KEY, BASE_URL } = process.env;

const verificationToken = crypto.randomUUID();

const sendEmail = require("../helpers/sendEmail");

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcryptjs.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  await sendEmail({
    to: email,
    subject: `Welcome on board, ${email}`,
    html: `
    <p>To confirm your registration, please click on link below</p>
    <p>
      <a href="${BASE_URL}/users/verify/${verificationToken}">Click me</a>
    </p>
    `,
    text: `To confirm your registration, please click on link below\n
    ${BASE_URL}/users/verify/${verificationToken}`,
  });

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }
  const passwordCompare = await bcryptjs.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }
  if (!user.verify) {
    throw HttpError(401, "Please verify your email");
  }
  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.json({
    email,
    subscription,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).json();
};

const updateSubscription = async (req, res) => {
  const { subscription } = req.body;
  const { _id } = req.user;

  if (!["starter", "pro", "business"].includes(subscription)) {
    throw HttpError(400, "Invalid subscription value");
  }

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    { subscription },
    { new: true }
  );

  res.json({
    email: updatedUser.email,
    subscription: updatedUser.subscription,
  });
};

const updateAvatar = async (req, res) => {
  const { path: tempUpload, filename } = req.file;
  const resultUpload = path.join(avatarsDir, filename);
  const avatarURL = `avatars/${filename}`;

  await fs.rename(tempUpload, resultUpload);

  try {
    const image = await Jimp.read(resultUpload);
    await image.resize(250, 250).write(resultUpload);
  } catch (error) {
    console.error("Error while processing the avatar:", error);
    return res
      .status(500)
      .json({ message: "Error while processing the avatar" });
  }

  const doc = await User.findByIdAndUpdate(
    req.user.id,
    { avatarURL },
    { new: true }
  ).exec();

  if (doc === null) {
    throw HttpError(404, "User not found");
  }

  res.json({
    avatarURL,
  });
};

const verify = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken }).exec();

  if (!user) {
    throw HttpError(404, "User not found");
  }

  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: null,
  }).exec();

  res.json({ message: "Verification successful" });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(400, "missing required field email");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }
  await sendEmail({
    to: email,
    subject: `Welcome on board, ${email}`,
    html: `
    <p>To confirm your registration, please click on link below</p>
    <p>
      <a href="${BASE_URL}/users/verify/${user.verificationToken}">Click me</a>
    </p>
    `,
    text: `To confirm your registration, please click on link below\n
    ${BASE_URL}/users/verify/${user.verificationToken}`,
  });

  res.json({ message: "Verification email sent" });
};

module.exports = {
  register: wrapController(register),
  login: wrapController(login),
  getCurrent: wrapController(getCurrent),
  logout: wrapController(logout),
  updateSubscription: wrapController(updateSubscription),
  updateAvatar: wrapController(updateAvatar),
  verify: wrapController(verify),
  resendVerifyEmail: wrapController(resendVerifyEmail),
};
