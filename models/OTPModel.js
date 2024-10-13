const { query } = require("../config/postgres");
const cron = require("node-cron");
const { createError } = require("../services/responseHandler");

const handleDBOperation = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw createError(
      `Database operation failed: ${error.message}`,
      500,
      "DB_OPERATION_FAILED"
    );
  }
};

const OTPModel = {
  storeOTP: async (email, otp) => {
    return handleDBOperation(async () => {
      if (!email || !otp) {
        throw createError(
          "Email and OTP are required",
          400,
          "MISSING_REQUIRED_FIELDS"
        );
      }

      const deleteQuery = 'DELETE FROM otps WHERE email = $1';
      await query(deleteQuery, [email]);

      const insertQuery = `
        INSERT INTO otps (email, otp, created_at, expires_at)
        VALUES ($1, $2, NOW(), NOW() + INTERVAL '15 minutes')
        RETURNING id
      `;
      const result = await query(insertQuery, [email, otp]);

      if (result.rows.length === 0) {
        throw createError("Failed to store OTP", 500, "OTP_STORAGE_FAILED");
      }

      return result.rows[0].id;
    });
  },

  verifyOTP: async (email, otp) => {
    return handleDBOperation(async () => {
      if (!email || !otp) {
        throw createError(
          "Email and OTP are required",
          400,
          "MISSING_REQUIRED_FIELDS"
        );
      }

      const selectQuery = `
        SELECT * FROM otps
        WHERE email = $1 AND otp = $2
      `;
      const result = await query(selectQuery, [email, otp]);

      if (result.rows.length === 0) {
        throw createError("Invalid OTP", 400, "INVALID_OTP");
      }

      const otpRecord = result.rows[0];

      if (new Date() > otpRecord.expires_at) {
        await query('DELETE FROM otps WHERE id = $1', [otpRecord.id]);
        throw createError("OTP has expired", 400, "EXPIRED_OTP");
      }

      await query('DELETE FROM otps WHERE id = $1', [otpRecord.id]);
      return true;
    });
  },

  cleanExpiredOTPs: async () => {
    return handleDBOperation(async () => {
      const deleteQuery = 'DELETE FROM otps WHERE expires_at < NOW()';
      await query(deleteQuery);
    });
  },
};

// Cron job to clean expired OTPs every hour
cron.schedule("* * * * *", async () => {
  try {
    await OTPModel.cleanExpiredOTPs();
  } catch (error) {
    console.error("Error cleaning expired OTPs:", error);
  }
});

module.exports = OTPModel;