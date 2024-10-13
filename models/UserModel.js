const { query } = require('../config/postgres');
const bcrypt = require('bcrypt');
const { createError } = require('../services/responseHandler');

const saltRounds = 10;

const UserModel = {
  registerUser: async (userData, role) => {
    const { username, email, password } = userData;
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const result = await query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [username, email, hashedPassword, role]
      );
      return result.rows[0].id;
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  confirmEmail: async (email, role) => {
    try {
      const result = await query(
        'UPDATE users SET email_confirmed = true WHERE email = $1 AND role = $2 RETURNING *',
        [email, role]
      );
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  getUserById: async (user_id, role) => {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1 AND role = $2', [user_id, role]);
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  getUserByUsername: async (username, role) => {
    try {
      const result = await query('SELECT * FROM users WHERE username = $1 AND role = $2', [username, role]);
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  getUserByEmail: async (email, role) => {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updateUsername: async (user_id, username, role) => {
    try {
      const result = await query(
        'UPDATE users SET username = $1, update_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = $3 RETURNING *',
        [username, user_id, role]
      );
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updatePassword: async (user_id, newPassword, role) => {
    try {
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      const result = await query(
        'UPDATE users SET password = $1 WHERE id = $2 AND role = $3 RETURNING *',
        [hashedNewPassword, user_id, role]
      );
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updateForgetPassword: async (email, newPassword, role) => {
    try {
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      const result = await query(
        'UPDATE users SET password = $1 WHERE email = $2 AND role = $3 RETURNING *',
        [hashedNewPassword, email, role]
      );
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updateUserField: async (user_id, updateData, role) => {
    const updateFields = Object.keys(updateData).map((key, index) => `${key} = $${index + 3}`).join(', ');
    const values = Object.values(updateData);
    try {
      const result = await query(
        `UPDATE users SET ${updateFields}, update_at = CURRENT_TIMESTAMP WHERE id = $1 AND role = $2 RETURNING *`,
        [user_id, role, ...values]
      );
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updateRefreshToken: async (user_id, refreshToken, role) => {
    try {
      const result = await query(
        'UPDATE users SET refresh_token = $1, last_login = CURRENT_TIMESTAMP WHERE id = $2 AND role = $3 RETURNING *',
        [refreshToken, user_id, role]
      );
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },
};

module.exports = UserModel;