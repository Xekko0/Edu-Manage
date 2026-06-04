/**
 * Auth controller — đăng nhập, refresh token, quên mật khẩu.
 * Khoá tài khoản 10 phút sau 5 lần nhập sai (theo SRS mục 2.1.1).
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const env = require('../config/env');
const { success, error } = require('../utils/responseHelper');

const MAX_FAILED = 5;
const LOCK_MINUTES = 10;

const signTokens = (user) => {
  const payload = { id: user.id, role: user.role, email: user.email };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
  return { accessToken, refreshToken };
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Vui lòng nhập email và mật khẩu', 400);

    const user = await User.findOne({ where: { email } });
    if (!user || !user.is_active) return error(res, 'Tài khoản không tồn tại hoặc đã bị khóa', 401);

    if (user.locked_until && user.locked_until > new Date()) {
      return error(res, `Tài khoản tạm khóa, vui lòng thử lại sau ${LOCK_MINUTES} phút`, 423);
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      user.failed_login_count = (user.failed_login_count || 0) + 1;
      if (user.failed_login_count >= MAX_FAILED) {
        user.locked_until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        user.failed_login_count = 0;
      }
      await user.save();
      return error(res, 'Email hoặc mật khẩu không đúng', 401);
    }

    user.failed_login_count = 0;
    user.locked_until = null;
    user.last_login_at = new Date();
    await user.save();

    const tokens = signTokens(user);
    return success(res, {
      ...tokens,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    }, 'Đăng nhập thành công');
  } catch (err) {
    return error(res, 'Lỗi hệ thống', 500, err.message);
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Thiếu refresh token', 400);
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) return error(res, 'Người dùng không tồn tại', 401);
    return success(res, signTokens(user), 'Làm mới token thành công');
  } catch (err) {
    return error(res, 'Refresh token không hợp lệ', 401);
  }
};

const RESET_EXPIRES = '30m';

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Vui lòng nhập email', 400);

    const user = await User.findOne({ where: { email } });
    const msg = 'Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu';
    if (!user || !user.is_active) return success(res, {}, msg);

    const resetToken = jwt.sign(
      { id: user.id, purpose: 'password_reset' },
      env.JWT_SECRET,
      { expiresIn: RESET_EXPIRES },
    );
    const payload = {};
    if (env.NODE_ENV !== 'production') {
      payload.resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
    }
    return success(res, payload, msg);
  } catch (err) {
    return error(res, 'Lỗi xử lý yêu cầu', 500, err.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return error(res, 'Thiếu token hoặc mật khẩu mới', 400);
    if (password.length < 6) return error(res, 'Mật khẩu mới tối thiểu 6 ký tự', 400);

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
      return error(res, 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400);
    }
    if (payload.purpose !== 'password_reset') return error(res, 'Token không hợp lệ', 400);

    const user = await User.findByPk(payload.id);
    if (!user || !user.is_active) return error(res, 'Tài khoản không tồn tại', 404);

    const hashed = await bcrypt.hash(password, 10);
    await user.update({ password: hashed, failed_login_count: 0, locked_until: null });
    return success(res, {}, 'Đặt lại mật khẩu thành công');
  } catch (err) {
    return error(res, 'Đặt lại mật khẩu thất bại', 500, err.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return error(res, 'Thiếu thông tin', 400);
    if (new_password.length < 6) return error(res, 'Mật khẩu mới tối thiểu 6 ký tự', 400);

    const user = await User.findByPk(req.user.id);
    const ok = await bcrypt.compare(current_password, user.password);
    if (!ok) return error(res, 'Mật khẩu hiện tại không đúng', 401);

    const hashed = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashed, failed_login_count: 0, locked_until: null });
    return success(res, {}, 'Đổi mật khẩu thành công');
  } catch (err) {
    return error(res, 'Đổi mật khẩu thất bại', 500, err.message);
  }
};

const { resolveCapabilities } = require('../services/access/teacher-capabilities.service');

const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return error(res, 'Không tìm thấy người dùng', 404);

    const payload = user.toJSON();
    payload.school_year = env.CURRENT_SCHOOL_YEAR;

    if (['admin', 'subject', 'homeroom'].includes(user.role)) {
      payload.capabilities = await resolveCapabilities(user);
    }

    return success(res, payload);
  } catch (err) {
    return error(res, 'Lỗi tải hồ sơ', 500, err.message);
  }
};

module.exports = { login, refresh, forgotPassword, resetPassword, changePassword, me };
