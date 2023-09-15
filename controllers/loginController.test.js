require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const { User } = require("../models/user");

mongoose.set("strictQuery", false);

const { TEST_DB_URI } = process.env;

describe("register", () => {
  beforeAll(async () => {
      await mongoose.connect(TEST_DB_URI);
      await request(app).post("/register").send({
        password: "123456",
        email: "tester@gmail.com",
      });
  });

      afterAll(async () => {
        User.findOneAndDelete();
        await mongoose.disconnect(); 
      });

  test("відповідь повина мати статус-код 200", async () => {
    const res = await request(app).post("/users/login").send({
      email: "tester@gmail.com",
      password: "123456",
    });
    expect(res.status).toBe(200);
  });

  test("у відповіді повинен повертатися токен", async () => {
    const res = await request(app).post("/users/login").send({
      email: "tester@gmail.com",
      password: "123456",
    });
    expect(res.body.token).toBeDefined();
  });

  test("у відповіді повинен повертатися об'єкт user з 2 полями email и subscription з типом даних String", async () => {
    const res = await request(app).post("/users/login").send({
      email: "tester@gmail.com",
      password: "123456",
    });
    const user = res.body.user;

    expect(user).toBeDefined();
    expect(typeof user.email).toBe("string");
    expect(typeof user.subscription).toBe("string");
  });
});
