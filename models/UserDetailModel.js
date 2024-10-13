const { query } = require('../config/postgres');
const { createError } = require('../services/responseHandler');

const UserDetailModel = {
  newDetail: async (detailData, role) => {
    const { user_id, avatar, name, address, birthdate } = detailData;
    try {
      const result = await query(
        'INSERT INTO user_details (user_id, role, avatar, name, address, birthdate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [user_id, role, avatar, name, JSON.stringify(address), JSON.stringify(birthdate)]
      );
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  getDetail: async (user_id, role) => {
    try {
      const result = await query('SELECT * FROM user_details WHERE user_id = $1 AND role = $2', [user_id, role]);
      if (result.rows.length === 0) {
        throw createError('User detail not found', 404, 'USER_DETAIL_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  getAddress: async (user_id, role) => {
    try {
      const result = await query('SELECT address FROM user_details WHERE user_id = $1 AND role = $2', [user_id, role]);
      if (result.rows.length === 0) {
        throw createError('User address not found', 404, 'USER_ADDRESS_NOT_FOUND');
      }
      return result.rows[0].address || [];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updateDetail: async (user_id, updateData, role) => {
    const updateFields = Object.keys(updateData).map((key, index) => `${key} = $${index + 3}`).join(', ');
    const values = Object.values(updateData);
    try {
      const result = await query(
        `UPDATE user_details SET ${updateFields} WHERE user_id = $1 AND role = $2 RETURNING *`,
        [user_id, role, ...values]
      );
      if (result.rows.length === 0) {
        throw createError('User detail not found', 404, 'USER_DETAIL_NOT_FOUND');
      }
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },
};

module.exports = UserDetailModel;