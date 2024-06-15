const {
  sendResetPassowrdToken,
  verifyResetPasswordToken,
  updateUser,
  getUser,
} = require("../controller/auth.controller");
const { body } = require("express-validator");
const protect = require("../middlewares/auth.middleware");
const readLogoFile = require("../controller/logo.controller");

const router = require("express").Router();

// router.get("/my-profile", protect, me);
// router.post("/register", signUp);
// router.post("/activate/:activation_token", activateUser);
// router.post("/login", login);

///////////////////////
//**GET METHODS */
router.get("/logo", readLogoFile);
router.get("/user", protect, getUser);

router.post(
  "/reset-token",
  body("email").isEmail().withMessage("Please enter a valid email address"),
  sendResetPassowrdToken,
);

///////////////////////
//**POST METHODS */

///////////////////////
//**PUT METHODS */
router.put("/updateuser", protect, updateUser);
router.put(
  "/verify-token",
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
  verifyResetPasswordToken,
);

module.exports = router;
