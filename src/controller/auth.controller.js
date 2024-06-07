const fs = require("fs");
const url = require("url");
const validationResult = require("express-validator").validationResult,
  bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken"),
  nodemailer = require("nodemailer");

// const sendActivationToken = require("../services/sendActivationEmail");
const generateActivationToken = require("../utils/generateActivationToken");
const generateRandomDigit = require("../utils/generateRandomDigit");

//*** local modules */
const ResponseMessage = require("../utils/responseMessage"),
  userModel = require("../models/user.model");
const { send } = require("process");

// get the logo image
// const logoBuffer = fs.readFileSync(`${__dirname}/../assets/sequioa-logo.png`);
// Convert the image buffer to a base64 string
// const logoBase64 = logoBuffer.toString("base64");
// const logoSrc = `,`;
// console.log(logoSrc);
// Read the logo image as a binary buffer
const logoPath = `${__dirname}/../assets/sequioa-logo.png`;
const logoBuffer = fs.readFileSync(logoPath);

// Convert the image buffer to a base64 string
const logoBase64 = logoBuffer.toString("base64");
const logoSrc = `data:image/png;base64,${logoBase64}`;

const auth = {};

const newToken = (user) =>
  jwt.sign({ id: user._id }, process.env.AUTHENTICATION_SECRET_KEY);

// Verify Jwt Token
const verifyToken = (token) =>
  jwt.verify(token, process.env.AUTHENTICATION_SECRET_KEY);

// Register a user
auth.signUp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ResponseMessage("error", 400, errors.array()));
  }

  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;
    // check if the email exist
    const existingUser = await userModel.findOne({ email: email });
    if (existingUser) {
      return res
        .status(400)
        .json(new ResponseMessage("error", 400, "Email already exist!"));
    }

    // Check if the password matches
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json(new ResponseMessage("error", 400, "Password does not match!"));
    }

    // hash the user password
    // Generate Activation Token
    const activationToken = await generateActivationToken();

    // Create a User Without Saving to the database
    const newUser = await userModel.create({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 10),
      confirmPassword: await bcrypt.hash(confirmPassword, 10),
      activationToken,
    });

    // Create an activation link
    const activationLink = `https://sequioa-api.vercel.app/activate?email="${email}"&token="${activationToken}"`;

    // Send the Activation link to the email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Activate Your Account",
      html: `
      <body style="padding:0.8rem">
      <div style="display:inline-block">
       <img src="data:image/png;base64,${logoBase64}" alt="logo"/>
      </div>
      <h3 style="font-size:1rem;font-weight:800">Dear Sequioa Trader,</h3>
      <p style="font-size:1.2rem;line-height:1.5">
       Your account <a href="#" style="color:#00f">${email}</a> has been successfully created at<br>
      <a style="text-decoration:none;font-size:1.4rem;font-weight:600;color:#ef5533" href="https://sequioa-one.vercel.app/">SEQUIOA</a>
      <br>
       To activate, Please click on the link below
      </p>
      <button 
      style="border:none;box-shadow:none;font-size:1.1rem;display:block;width:70%;border-radius:8px;background:#ef5533;cursor:pointer;padding:0;margin-bottom:1rem">
      <a style="text-decoration:none;color:#fff;border:1px solid red;display:block;padding:0.75rem;border-radius:inherit;" href="${activationLink}">Verify your account</a>
      </button>
      <small>If the above link cannot be clicked, please copy it to your browser address bar to enter the access, the link is valid within 24 hours</small>
      </body>
        `,
    };
    transporter.sendMail(mailOptions, (error, success) => {
      if (error) {
        console.log(`Error sending Activation Email`, error);
      }

      return res
        .status(200)
        .json(
          new ResponseMessage(
            "success",
            200,
            "Activation link sent to your email",
          ),
        );
    });
    console.log(newUser);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json(new ResponseMessage("error", 500, "Internal Server Error"));
  }
};

// Activate user account
auth.activateUser = async (req, res) => {
  // const {
  //   pathname,
  //   query: { email, token },
  // } = url.parse(req.url, true);
  // console.log(token);
  const { email, token } = req.query;

  // send email for account comfirmation
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const sendActivationEmail = async (email) => {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Customer Account Confirmation",
      html: `
      <body style="padding:0.8rem">
      <h1 style="font-family:sans-serif;font-weight:600;font-size:1.8rem">Welcome to Sequioa!</h1>
      <h5>Dear valued Trader</h6>
      <p style="font-size:1.2rem;line-height:1.5">
       You customer account has been activated <br>
      </p>
      <small>Kindly visit <a style="text-decoration:none;color:#fff;border:1px solid red;display:block;padding:0.75rem;border-radius:inherit;" href="https://sequioa-one.vercel.app/login">sequioa</a></small>
      </body>
      `,
    };

    return transporter.sendMail(mailOptions);
  };

  try {
    const user = await userModel.findOne({
      activationToken: token,
    });
    if (!user) {
      console.log("user does not exist");
      return res
        .status(404)
        .json(new ResponseMessage("error", 404, "invalid activation token"));
    }
    // Activate the user and save to the DB
    user.isActive = true;
    // user.activationToken = null; //reset the activation token to null
    await user.save();
    console.log("saved");

    // send activation email
    await sendActivationEmail(email);

    // Generate Access token
    // const accessToken = await newToken(user);

    // return res.status(200).json(
    //   new ResponseMessage("success", 200, "user activated successfully", {
    //     accessToken,
    //   }),
    // );

    return res.redirect(
      `https://sequioa-one.vercel.app/activate?email=${email}&token=${activationToken}`,
    );
  } catch (err) {
    return res
      .status(500)
      .json(new ResponseMessage("error", 500, "Internal Server Error"));
  }
};

// Login a user
auth.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ResponseMessage("error", 400, errors.array()));
  }
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email: email });
    // Check if email does not exist
    if (!user) {
      return res
        .status(400)
        .json(new ResponseMessage("error", 400, "Invalid Email!"));
    }

    // check if the user has been activated
    console.log(user.isActive);
    if (!user.isActive) {
      return res
        .status(400)
        .json(
          new ResponseMessage(
            "error",
            400,
            "Verification failed!\n use the link sent to your email and activate your account",
          ),
        );
    }
    //Check the if the password is correct
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      return res
        .status(400)
        .json(new ResponseMessage("error", 400, "Invalid Password!"));
    }

    // Genearate token
    const accessToken = await newToken(user);

    return res.status(200).json(
      new ResponseMessage("success", 200, "Login Successfully", {
        accessToken,
      }),
    );
  } catch (err) {
    return res
      .status(500)
      .json(new ResponseMessage("error", 500, "Internal Sever Error"));
  }
};

// ////////////
///FORGOT PASSWORD
auth.sendResetPassowrdToken = async (req, res) => {
  // const {email} = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ResponseMessage("error", 400, errors.array()));
  }
  try {
    // Get the user email
    const { email } = req.body;

    // Check if the user exist
    const user = await userModel.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json(
          new ResponseMessage(
            "error",
            400,
            "No account associated with this email",
          ),
        );
    }

    // Generate random Digit and update the user authToken
    const authCode = generateRandomDigit();
    console.log(authCode);
    const updatedUser = await userModel.findByIdAndUpdate(
      {
        _id: user._id,
      },
      { authCode: await bcrypt.hash(authCode, 10) },
      { new: true },
    );

    //Generate an access Token
    const authToken = await newToken(updatedUser);
    console.log(updatedUser);

    //Send the Generated token to the user email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Customer Reset Password Token",
      html: `
      <body style="padding:0.8rem">
      <h1 style="font-family:sans-serif;font-weight:600;font-size:1.8rem">You Requested for forgot Password</h1>
     <p style="font-size:1.2rem;line-height:1.5">
      Use the token below to reset your password <br>
      </p>
      <button 
      style="border:none;box-shadow:none;display:block;width:100%;border-radius:8px;background:#ef5533;cursor:pointer;padding:0">
      <a style="text-decoration:none;color:#fff;border:1px solid red;display:block;padding:0.75rem;border-radius:inherit;font-weight:700;font-family:sans-serif;font-size:2rem;letter-spacing:5px">${authCode}</a></button>
      </body>
      `,
    };
    transporter.sendMail(mailOptions, (error, success) => {
      if (error) {
        console.log(`Error sending comfirmation Email`, error);
      }

      return res.status(200).json(
        new ResponseMessage("success", 200, "OTP sent to your email", {
          authToken,
        }),
      );
    });
  } catch (err) {
    return res
      .status(500)
      .json(new ResponseMessage("error", 500, "Internal server error"));
  }
};

// verify Reset password Token
auth.verifyResetPasswordToken = async (req, res) => {
  // Get the password to be updated
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(new ResponseMessage("error", 400, errors.array()));
  }
  try {
    const { authToken, otp, password } = req.body;

    // Decode the auth token using jwt and check for validity
    let decodedToken;
    try {
      decodedToken = await verifyToken(authToken);
    } catch (err) {
      return res
        .status(401)
        .json(new ResponseMessage("error", 401, "unverified token"));
    }
    if (!decodedToken) {
      return res
        .status(400)
        .json(new ResponseMessage("error", 400, "invalid token"));
    }

    // Get the user id using the decoded token
    const userId = decodedToken.id;
    if (!userId) {
      return res
        .status(400)
        .json(
          new ResponseMessage(
            "error",
            400,
            `user with ${userId} does not exist`,
          ),
        );
    }

    // Find the user using the user id
    const user = await userModel.findOne({ _id: userId });
    console.log(user);

    // Check if the OTP is null i.e (has been used)
    if (!user.authCode) {
      return res
        .status(400)
        .json(new ResponseMessage("error", 400, "OTP has been used"));
    }

    // Compare the hashed token
    isCorrectOtp = await bcrypt.compare(otp, user.authCode);
    if (!isCorrectOtp) {
      return res
        .status(400)
        .json(new ResponseMessage("error", 400, "invalid OTP !"));
    }
    // update the user password
    const updatedUser = await userModel.findByIdAndUpdate(
      { _id: userId },
      { password: await bcrypt.hash(password, 10) },
      { new: true },
    );

    // Reset the authCode to null and Save it
    user.authCode = null;
    await user.save();

    return res.status(200).json(
      new ResponseMessage("error", 200, "password updated successfully", {
        updatedUser,
      }),
    );
  } catch (err) {
    // return res;
    console
      .log(err)
      .status(400)
      .json(new ResponseMessage("error", 400, "Internal Server Error"));
  }
};

module.exports = auth;
