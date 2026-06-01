/**
 * Chuẩn hóa response JSON cho toàn bộ API (tiếng Việt).
 */
const success = (res, data = {}, message = 'Thành công', status = 200) =>
  res.status(status).json({ success: true, message, data });

const error = (res, message = 'Có lỗi xảy ra', status = 400, details = null) =>
  res.status(status).json({ success: false, message, details });

const paginated = (res, items, total, page, pageSize, message = 'Thành công') =>
  res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  });

module.exports = { success, error, paginated };
