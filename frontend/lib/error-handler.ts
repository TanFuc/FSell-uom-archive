/**
 * Error translation and formatting utility.
 * Translates backend validation errors (NestJS / class-validator / Prisma)
 * and generic API errors into friendly localized messages.
 */

const FIELD_NAMES_VI: Record<string, string> = {
  material: 'Chất liệu',
  dimensions: 'Kích thước',
  nameVi: 'Tên sản phẩm tiếng Việt',
  nameEn: 'Tên sản phẩm tiếng Anh',
  slug: 'Đường dẫn (slug)',
  descriptionVi: 'Mô tả chi tiết tiếng Việt',
  descriptionEn: 'Mô tả chi tiết tiếng Anh',
  shortDescriptionVi: 'Mô tả ngắn tiếng Việt',
  shortDescriptionEn: 'Mô tả ngắn tiếng Anh',
  priceVND: 'Giá niêm yết (VND)',
  priceUSD: 'Giá quy đổi (USD)',
  salePriceVND: 'Giá khuyến mãi (VND)',
  salePriceUSD: 'Giá khuyến mãi (USD)',
  stock: 'Số lượng tồn kho',
  categoryId: 'Danh mục sản phẩm',
  images: 'Hình ảnh sản phẩm',
  hoverImage: 'Hình ảnh di chuột',
  isActive: 'Trạng thái hoạt động',
  isFeatured: 'Sản phẩm nổi bật',
  inquiryEnabled: 'Tính năng hỏi đáp',
  inquiryMessageVi: 'Tin nhắn hỏi đáp tiếng Việt',
  inquiryMessageEn: 'Tin nhắn hỏi đáp tiếng Anh',
  email: 'Địa chỉ email',
  password: 'Mật khẩu',
  currentPassword: 'Mật khẩu hiện tại',
  newPassword: 'Mật khẩu mới',
  fullName: 'Họ và tên',
  role: 'Vai trò tài khoản',
  phone: 'Số điện thoại',
  order: 'Thứ tự hiển thị',
  title: 'Tiêu đề',
  link: 'Đường dẫn liên kết',
  imageUrl: 'Đường dẫn ảnh',
}

const FIELD_NAMES_EN: Record<string, string> = {
  material: 'Material',
  dimensions: 'Dimensions',
  nameVi: 'Vietnamese name',
  nameEn: 'English name',
  slug: 'Slug URL',
  descriptionVi: 'Vietnamese description',
  descriptionEn: 'English description',
  shortDescriptionVi: 'Vietnamese short description',
  shortDescriptionEn: 'English short description',
  priceVND: 'Price (VND)',
  priceUSD: 'Price (USD)',
  salePriceVND: 'Sale price (VND)',
  salePriceUSD: 'Sale price (USD)',
  stock: 'Stock quantity',
  categoryId: 'Category',
  images: 'Product images',
  hoverImage: 'Hover image',
  email: 'Email address',
  password: 'Password',
  currentPassword: 'Current password',
  newPassword: 'New password',
  fullName: 'Full name',
  role: 'Role',
  phone: 'Phone',
  order: 'Sort order',
  title: 'Title',
  link: 'Link',
  imageUrl: 'Image URL',
}

const EXACT_MESSAGES_VI: Record<string, string> = {
  'Product with slug already exists': 'Sản phẩm với đường dẫn này đã tồn tại. Vui lòng chọn đường dẫn khác.',
  'Category with slug already exists': 'Danh mục với đường dẫn này đã tồn tại. Vui lòng chọn đường dẫn khác.',
  'Invalid credentials': 'Email hoặc mật khẩu không chính xác.',
  'Unauthorized': 'Phiên đăng nhập đã hết hạn hoặc bạn chưa được phân quyền.',
  'Forbidden resource': 'Bạn không có quyền thực hiện hành động này.',
  'Forbidden': 'Bạn không có quyền thực hiện hành động này.',
  'User already exists': 'Người dùng với email này đã tồn tại.',
  'User with this email already exists': 'Email này đã được đăng ký tài khoản khác.',
  'User not found': 'Không tìm thấy thông tin người dùng.',
  'Product not found': 'Không tìm thấy sản phẩm.',
  'Category not found': 'Không tìm thấy danh mục.',
  'Cannot delete category with products': 'Không thể xóa danh mục vì vẫn còn sản phẩm đang thuộc danh mục này.',
  'Internal server error': 'Hệ thống máy chủ gặp sự cố. Vui lòng thử lại sau giây lát.',
  'Network Error': 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
  'Failed to fetch': 'Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại.',
  'Request failed with status code 400': 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.',
  'Request failed with status code 401': 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
  'Request failed with status code 403': 'Bạn không có quyền thực hiện thao tác này.',
  'Request failed with status code 404': 'Không tìm thấy tài nguyên yêu cầu.',
  'Request failed with status code 409': 'Dữ liệu bị trùng lặp trong hệ thống.',
  'Request failed with status code 500': 'Máy chủ gặp lỗi nội bộ. Vui lòng thử lại sau.',
}

/**
 * Translates a single class-validator or backend error string to Vietnamese.
 */
function translateSingleMessage(msg: string, isVi: boolean): string {
  if (!msg || typeof msg !== 'string') return ''

  const trimmed = msg.trim()

  if (isVi && EXACT_MESSAGES_VI[trimmed]) {
    return EXACT_MESSAGES_VI[trimmed]
  }

  // Handle class-validator pattern: "{field} should not be empty"
  const emptyMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+should not be empty$/i)
  if (emptyMatch) {
    const field = emptyMatch[1]
    if (isVi) {
      const viField = FIELD_NAMES_VI[field] || field
      return `Vui lòng nhập ${viField}`
    }
    const enField = FIELD_NAMES_EN[field] || field
    return `${enField} is required`
  }

  // Handle "{field} must be a string"
  const stringMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+must be a string$/i)
  if (stringMatch) {
    const field = stringMatch[1]
    if (isVi) {
      const viField = FIELD_NAMES_VI[field] || field
      return `${viField} phải là chuỗi ký tự`
    }
    const enField = FIELD_NAMES_EN[field] || field
    return `${enField} must be a string`
  }

  // Handle "{field} must be a number conforming to the specified constraints" / "{field} must be a number"
  const numberMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+must be a number/i)
  if (numberMatch) {
    const field = numberMatch[1]
    if (isVi) {
      const viField = FIELD_NAMES_VI[field] || field
      return `${viField} phải là số hợp lệ`
    }
    const enField = FIELD_NAMES_EN[field] || field
    return `${enField} must be a valid number`
  }

  // Handle "{field} must be an integer number"
  const intMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+must be an integer number/i)
  if (intMatch) {
    const field = intMatch[1]
    if (isVi) {
      const viField = FIELD_NAMES_VI[field] || field
      return `${viField} phải là số nguyên`
    }
    const enField = FIELD_NAMES_EN[field] || field
    return `${enField} must be an integer`
  }

  // Handle "{field} must not be less than {min}"
  const minMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+must not be less than\s+([0-9]+)$/i)
  if (minMatch) {
    const field = minMatch[1]
    const minVal = minMatch[2]
    if (isVi) {
      const viField = FIELD_NAMES_VI[field] || field
      return `${viField} không được nhỏ hơn ${minVal}`
    }
    const enField = FIELD_NAMES_EN[field] || field
    return `${enField} must not be less than ${minVal}`
  }

  // Handle "{field} must be an email"
  const emailMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+must be an email/i)
  if (emailMatch) {
    return isVi ? 'Địa chỉ email không hợp lệ' : 'Invalid email address'
  }

  // Handle "{field} must be a boolean value"
  const boolMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+must be a boolean value/i)
  if (boolMatch) {
    const field = boolMatch[1]
    if (isVi) {
      const viField = FIELD_NAMES_VI[field] || field
      return `${viField} phải là giá trị đúng hoặc sai`
    }
    const enField = FIELD_NAMES_EN[field] || field
    return `${enField} must be true or false`
  }

  // Handle "{field} must be an array"
  const arrayMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+must be an array/i)
  if (arrayMatch) {
    const field = arrayMatch[1]
    if (isVi) {
      const viField = FIELD_NAMES_VI[field] || field
      return `${viField} phải là danh sách hợp lệ`
    }
    const enField = FIELD_NAMES_EN[field] || field
    return `${enField} must be a valid list`
  }

  if (!isVi) {
    return trimmed
  }

  // If message contains common English keywords, provide friendly Vietnamese
  const lower = trimmed.toLowerCase()
  if (lower.includes('network error') || lower.includes('failed to fetch')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.'
  }
  if (lower.includes('timeout')) {
    return 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.'
  }
  if (lower.includes('unauthorized') || lower.includes('jwt') || lower.includes('token')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang hoặc đăng nhập lại.'
  }
  if (lower.includes('forbidden')) {
    return 'Bạn không có quyền thực hiện hành động này.'
  }

  return trimmed
}

/**
 * Extracts and formats API error messages from an Axios error or generic Error.
 * Automatically translates class-validator and NestJS errors into friendly Vietnamese
 * when locale is 'vi'.
 */
export function getApiErrorMessage(
  error: any,
  locale: string = 'vi',
  fallbackMessage?: string,
): string {
  const isVi = locale === 'vi'
  const defaultFallback = isVi
    ? 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.'
    : 'An error occurred while processing. Please try again.'

  if (!error) {
    return fallbackMessage || defaultFallback
  }

  // Extract message from axios response or error object
  const responseData = error?.response?.data
  const rawMessage = responseData?.message || responseData?.error || error?.message

  // Handle array of error messages (standard NestJS class-validator payload)
  if (Array.isArray(rawMessage) && rawMessage.length > 0) {
    const translatedList = rawMessage
      .map((m) => translateSingleMessage(String(m), isVi))
      .filter(Boolean)

    return translatedList.length > 0
      ? translatedList.join(', ')
      : fallbackMessage || defaultFallback
  }

  // Handle single string message
  if (typeof rawMessage === 'string' && rawMessage.trim()) {
    const translated = translateSingleMessage(rawMessage, isVi)
    return translated || fallbackMessage || defaultFallback
  }

  // Handle HTTP status fallback
  const status = error?.response?.status
  if (status === 400) {
    return isVi ? 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.' : 'Invalid data submitted.'
  }
  if (status === 401) {
    return isVi ? 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' : 'Session expired. Please log in again.'
  }
  if (status === 403) {
    return isVi ? 'Bạn không có quyền thực hiện thao tác này.' : 'You do not have permission to perform this action.'
  }
  if (status === 404) {
    return isVi ? 'Không tìm thấy dữ liệu yêu cầu.' : 'Requested resource not found.'
  }
  if (status === 409) {
    return isVi ? 'Dữ liệu đã tồn tại trong hệ thống.' : 'Resource already exists.'
  }
  if (status && status >= 500) {
    return isVi ? 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.' : 'Internal server error. Please try again later.'
  }

  return fallbackMessage || defaultFallback
}
