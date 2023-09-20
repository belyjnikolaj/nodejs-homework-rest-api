require("dotenv").config();
const nodemailer = require("nodemailer");
const { MAILTRAP_USER, MAILTRAP_PASS, HOST } = process.env;

const transport = nodemailer.createTransport({
  host: HOST,
  port: 2525,
  auth: {
    user: MAILTRAP_USER,
    pass: MAILTRAP_PASS,
  },
});

function sendEmail(message) {
  message.from = "belyjnikolaj318@gmail.com";

  return transport.sendMail(message);
}

module.exports = sendEmail;
