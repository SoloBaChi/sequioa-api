// CORE MODULES
const express = require("express");
const cors = require("cors");
const { json, urlencoded } = require("body-parser");
const morgan = require("morgan");

// Third Party Modules
const { body } = require("express-validator");

// Custom Modules
const { connectToDb } = require("./services/db.connection");
const userRouter = require("./routes/user.route");
const { signUp, activateUser, login } = require("./controller/auth.controller");
const protect = require("./middlewares/auth.middleware");

// configure dot env
require("dotenv").config();

// Create the APP
const app = express();

//** Core Midddlewares
app.use(cors({ origin: "*" }));
app.use(urlencoded({ extended: true }));
app.use(json());
app.use(morgan("tiny"));
app.disable("x-powered-by"); //less hacker know about our stack

// APP ROUTES
/*** Default Route */
app.get("/", (req, res) => {
  return res.status(200).json({
    message: `Welcome to Sequioa API`,
    statusCode: 200,
    status: "success",
  });
});

///////////////////////
///Regkister account
app.post(
  "/register",
  body("firstName")
    .isString()
    .isLength({
      min: 3,
      max: 100,
    })
    .withMessage("First Name must be at least 3 characters"),
  body("lastName")
    .isString()
    .isLength({
      min: 3,
      max: 100,
    })
    .withMessage("Last Name must be at least 3 characters"),
  body("email").isEmail().withMessage("Please enter a valid email address"),
  body("password")
    .isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minSymbols: 1,
      minLowercase: 1,
    })
    .withMessage(
      `Password must be 8 characters and should include numbers,symbols and uppercase`,
    ),
  body("confirmPassword")
    .isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minSymbols: 1,
      minLowercase: 1,
    })
    .withMessage(
      `Confirm Password must be 8 characters and should include numbers,symbols and uppercase`,
    ),
  signUp,
);
app.post(
  "/login",
  body("email").isEmail().withMessage("Please enter a valid email address"),
  body("password")
    .isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minSymbols: 1,
      minLowercase: 1,
    })
    .withMessage(
      `Password must be 8 characters and should include numbers,symbols and uppercase`,
    ),
  login,
);

//Activate user account
app.get("/activate", activateUser);

// //////////////////
//Authenticated Routes
// app.use("/api/v1", protect);
app.use("/api/v1/", userRouter);

/***Not Found Route */
app.use("*", (req, res) => {
  return res.status(400).json({
    message: `Page Not Found`,
    statusCode: 400,
    status: "error",
  });
});

// create a Port
const port = process.env.PORT || 4000;
// Start the Server
const start = async () => {
  // connect to the database
  await connectToDb();
  app.listen(port, () => {
    console.log(`server runs at localhost:${port} `);
  });
};

module.exports = start;
