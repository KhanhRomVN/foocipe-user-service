const { UserModel, UserDetailModel, OTPModel } = require("../models");
const transporter = require("../config/nodemailerConfig");
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
        <p>Thank you for using our service. Please use the following One-Time Password (OTP):</p>
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

const UserController = {
  getUser: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const user_id = req.user.id.toString();
      return await UserModel.getUserById(user_id);
    });
  },

  getDetail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const user_id = req.user.id.toString();
      return await UserDetailModel.getDetail(user_id);
    });
  },

  getAddress: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const user_id = req.user.id.toString();
      return await UserDetailModel.getAddress(user_id);
    });
  },

  updateUsername: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { username } = req.body;
      const user_id = req.user.id.toString();
      await UserModel.updateUsername(user_id, username);
      return { message: "Username updated successfully" };
    });
  },

  updateDetail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const user_id = req.user.id.toString();
      await UserDetailModel.updateDetail(user_id, req.body);
      return { message: "Updated user information successfully" };
    });
  },

  newEmail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { newEmail } = req.body;

      const otp = generateOTP();
      await OTPModel.storeOTP(newEmail, otp);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: newEmail,
        subject: "New Email OTP",
        html: getEmailTemplate(otp),
      });

      return { message: "OTP sent to email" };
    });
  },

  updateEmail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { newEmail, otp } = req.body;
      const user_id = req.user.id;

      const validOTP = await OTPModel.verifyOTP(newEmail, otp);
      if (!validOTP) {
        throw createError("Invalid OTP", 400, "INVALID_OTP");
      }

      await UserModel.updateUserField(user_id, { email: newEmail });
      // create notification
      const notificationData = {
        title: "Email Updated",
        content: `Your email has been updated to ${newEmail}`,
        notification_type: "account_notification",
        target_type: "individual",
        target_ids: [req.user.id.toString()],
        can_delete: false,
        can_mark_as_read: false,
        is_read: false,
        created_at: new Date(),
      };
      await sendCreateNewNotification(notificationData);
      return { message: "Update Email Successful!" };
    });
  },

  updatePassword: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { newPassword } = req.body;
      const user_id = req.user.id.toString();
      await UserModel.updatePassword(user_id, newPassword);
      // create notification
      const notificationData = {
        title: "Password Updated",
        content: `Your password has been updated successfully!`,
        notification_type: "account_notification",
        target_type: "individual",
        target_ids: [req.user.id.toString()],
        can_delete: false,
        can_mark_as_read: false,
        is_read: false,
        created_at: new Date(),
      };
      await sendCreateNewNotification(notificationData);
      return { message: "Password updated successfully!" };
    });
  },

  forgetPassword: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { email } = req.body;
      const otp = generateOTP();
      await OTPModel.storeOTP(email, otp);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        html: getEmailTemplate(otp),
      });

      return { message: "OTP sent to email" };
    });
  },

  updateForgetPassword: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { email, otp, newPassword } = req.body;

      const validOTP = await OTPModel.verifyOTP(email, otp);
      if (!validOTP) {
        throw createError("Invalid OTP", 400, "INVALID_OTP");
      }

      await UserModel.updateForgetPassword(email, newPassword);

      // create notification
      const user = await UserModel.getUserByEmail(email);
      const notificationData = {
        title: "Password Reset",
        content: `Your password has been reset successfully!`,
        notification_type: "account_notification",
        target_type: "individual",
        target_ids: [user.id.toString()],
        can_delete: false,
        can_mark_as_read: false,
        is_read: false,
        created_at: new Date(),
      };
      await sendCreateNewNotification(notificationData);

      return { message: "Password reset successfully" };
    });
  },
};

module.exports = UserController;