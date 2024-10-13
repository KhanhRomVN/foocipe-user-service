const { UserModel, UserDetailModel, OTPModel } = require("../models");
const transporter = require("../config/nodemailerConfig");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { handleRequest, createError } = require("../services/responseHandler");

const generateOTP = () => crypto.randomBytes(3).toString("hex");
const getEmailTemplate = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email OTP Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        } 
        .container {
            background-color: #f9f9f9;
            border-radius: 5px;
            padding: 20px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #2c3e50;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #3498db;
            letter-spacing: 5px;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #7f8c8d;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Email OTP Confirmation</h1>
        <p>Dear User,</p>
        <p>Thank you for registering with us. To complete your registration, please use the following One-Time Password (OTP):</p>
        <div class="otp-code">${otp}</div>
        <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <p>Best regards,<br>Your Company Name</p>
    </div>
    <div class="footer">
        This is an automated message. Please do not reply to this email.
    </div>
</body>
</html>
`;

const AuthController = {
  verifyNewEmail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { email } = req.body;
      const existingUser = await UserModel.getUserByEmail(email);
      if (existingUser) {
        throw createError(
          `This <${email}> is linked to another account`,
          400,
          "EMAIL_ALREADY_EXISTS"
        );
      }
      const otp = generateOTP();
      await OTPModel.storeOTP(email, otp);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Email OTP Confirmation`,
        html: getEmailTemplate(otp),
      });
      return { message: "Please check the OTP sent to gmail" };
    });
  },

  registerUserWithOTP: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { email, otp, username, password } = req.body;
      const validOTP = await OTPModel.verifyOTP(email, otp);
      if (!validOTP) {
        throw createError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      if (await UserModel.getUserByUsername(username)) {
        throw createError(
          "This username is already in use",
          400,
          "USERNAME_TAKEN"
        );
      }

      const hashedPassword = await bcryptjs.hash(password, 10);
      const userData = {
        username,
        email,
        password: hashedPassword,
        register_at: new Date(),
      };

      const newUser = await UserModel.registerUser(userData);
      // Create user detail
      await UserDetailModel.newDetail(newUser);
      return { message: "User registered successfully" };
    });
  },

  loginUser: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { email, password } = req.body;
      const existingUser = await UserModel.getUserByEmail(email);
      if (!existingUser) {
        throw createError(
          "This email has not been registered.",
          401,
          "EMAIL_NOT_REGISTERED"
        );
      }
      const isPasswordValid = await bcryptjs.compare(
        password,
        existingUser.password
      );
      if (!isPasswordValid) {
        throw createError(
          "This password is not valid",
          401,
          "INVALID_PASSWORD"
        );
      }

      const access_token = jwt.sign(
        { user_id: existingUser.id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "7d" }
      );
      const refresh_token = jwt.sign(
        { user_id: existingUser.id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "30d" }
      );
      await UserModel.updateRefreshToken(existingUser.id, refresh_token);

      return { access_token, refresh_token };
    });
  },

  verifyAccount: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { email, password } = req.body;
      const existingUser = await UserModel.getUserByEmail(email);
      if (!existingUser) {
        throw createError(
          "This email has not been registered.",
          401,
          "EMAIL_NOT_REGISTERED"
        );
      }
      const isPasswordValid = await bcryptjs.compare(
        password,
        existingUser.password
      );
      if (!isPasswordValid) {
        throw createError(
          "This password is not valid",
          401,
          "INVALID_PASSWORD"
        );
      }
      return { message: "Verify account successfully" };
    });
  },

  refreshAccessToken: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { accessToken, refreshToken } = req.token;
      const user = await UserModel.getUserById(req.user.user_id);

      return {
        newAccessToken: accessToken,
        newRefreshToken: refreshToken,
        user: {
          user_id: user.id,
          username: user.username,
        },
      };
    });
  },
};

module.exports = AuthController;