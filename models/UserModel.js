const { query } = require('../config/postgres');
const bcrypt = require('bcrypt');
const { createError } = require('../services/responseHandler');

const saltRounds = 10;

const UserModel = {
  registerUser: async (userData) => {
    const { username, email, password } = userData;
    try {
      const result = await query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
        [username, email, password]
      );
      return result.rows[0].id;
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  confirmEmail: async (email) => {
    try {
      const result = await query(
        'UPDATE users SET email_confirmed = true WHERE email = $1 RETURNING *',
        [email]
      );
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  getUserById: async (user_id) => {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1', [user_id]);
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  getUserByUsername: async (username) => {
    try {
      const result = await query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  getUserByEmail: async (email) => {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updateUsername: async (user_id, username) => {
    try {
      const result = await query(
        'UPDATE users SET username = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', // Changed update_at to updated_at
        [username, user_id]
      );
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updatePassword: async (user_id, newPassword) => {
    try {
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      const result = await query(
        'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
        [hashedNewPassword, user_id]
      );
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updateForgetPassword: async (email, newPassword) => {
    try {
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      const result = await query(
        'UPDATE users SET password = $1 WHERE email = $2 RETURNING *',
        [hashedNewPassword, email]
      );
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updateUserField: async (user_id, updateData) => {
    const updateFields = Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updateData);
    try {
      const result = await query(
        `UPDATE users SET ${updateFields}, update_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [user_id, ...values]
      );
      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updateRefreshToken: async (user_id, refresh_token) => {
    try {
      const result = await query(
        'UPDATE users SET refresh_token = $1, last_login = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [refresh_token, user_id]
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