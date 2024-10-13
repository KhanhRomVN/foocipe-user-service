const { query } = require('../config/postgres');
const { createError } = require('../services/responseHandler');

const UserDetailModel = {
  newDetail: async (user_id) => {
    try {
      const detailData = {
        user_id,
        avatar_uri: "",
        firstname: "",
        lastname: "",
        bio: "",
        country: "",
        age: null,
        address: null,
      }
      const result = await query('INSERT INTO user_info (user_id, avatar_uri, firstname, lastname, bio, country, age, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [detailData.user_id, detailData.avatar_uri, detailData.firstname, detailData.lastname, detailData.bio, detailData.country, detailData.age, JSON.stringify(detailData.address)]);
      return result.rows[0];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  getDetail: async (user_id) => {
    try {
      const result = await query('SELECT * FROM user_info WHERE user_id = $1', [user_id]);
      if (result.rows.length === 0) {
        throw createError('User detail not found', 404, 'USER_DETAIL_NOT_FOUND');
      }
      const userDetail = result.rows[0];
      userDetail.address = JSON.parse(userDetail.address);
      return userDetail;
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  getAddress: async (user_id) => {
    try {
      const result = await query('SELECT address FROM user_info WHERE user_id = $1', [user_id]);
      if (result.rows.length === 0) {
        throw createError('User address not found', 404, 'USER_ADDRESS_NOT_FOUND');
      }
      return JSON.parse(result.rows[0].address) || [];
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },

  updateDetail: async (user_id, updateData) => {
    const updateFields = Object.keys(updateData).map((key, index) => {
      if (key === 'address') {
        return `${key} = $${index + 2}::jsonb`;
      }
      return `${key} = $${index + 2}`;
    }).join(', ');
    const values = Object.entries(updateData).map(([key, value]) => 
      key === 'address' ? JSON.stringify(value) : value
    );
    try {
      const result = await query(
        `UPDATE user_info SET ${updateFields} WHERE user_id = $1 RETURNING *`,
        [user_id, ...values]
      );
      if (result.rows.length === 0) {
        throw createError('User detail not found', 404, 'USER_DETAIL_NOT_FOUND');
      }
      const updatedDetail = result.rows[0];
      updatedDetail.address = JSON.parse(updatedDetail.address);
      return updatedDetail;
    } catch (error) {
      throw createError(`Database operation failed: ${error.message}`, 500, 'DB_OPERATION_FAILED');
    }
  },
};

module.exports = UserDetailModel;