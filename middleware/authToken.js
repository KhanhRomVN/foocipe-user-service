const jwt = require("jsonwebtoken");
const { UserModel } = require("../models");
const { createError, sendError } = require("../services/responseHandler");

const verifyToken = (access_token) => {
  if (!access_token) {
    throw createError("No accessToken provided", 401, "NO_TOKEN_PROVIDED");
  }
  return jwt.verify(access_token, process.env.JWT_SECRET_KEY);
};

const authToken = async (req, res, next) => {
  try {
    const access_token = req.header("access_token");
    const decoded = verifyToken(access_token);

    const user = await UserModel.getUserById(decoded.user_id);

    if (!user) {
      throw createError("User not found", 404, "USER_NOT_FOUND");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in auth middleware:", error);
    sendError(res, error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  const refresh_token = req.header("refresh_token");

  if (!refresh_token) {
    return sendError(
      res,
      createError("Refresh token not provided", 401, "NO_REFRESH_TOKEN")
    );
  }

  try {
    const decoded = verifyToken(refresh_token, process.env.JWT_SECRET_KEY);

    const user = await UserModel.getUserById(decoded.user_id);

    if (!user || user.refresh_token !== refresh_token) {
      throw createError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    const newAccessToken = jwt.sign(
      { user_id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { user_id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    await UserModel.updateRefreshToken(user._id, newRefreshToken);

    req.token = {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in refreshAccessToken:", error);
    sendError(res, error);
  }
};

module.exports = {
  authToken,
  refreshAccessToken,
};