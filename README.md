# Đồ án Kiểm thử phần mềm - Tự động hóa với Playwright 🚀

## Giới thiệu
Đây là dự án kiểm thử tự động hóa (Test Automation) cho website thương mại điện tử **[Automation Exercise](https://automationexercise.com/)**. Dự án được phát triển bằng **Playwright** (Node.js) nhằm bao phủ các luồng chức năng quan trọng nhất của hệ thống, phục vụ cho bài tập lớn / đồ án môn học Kiểm thử phần mềm.

## Công nghệ sử dụng
- **Framework:** Playwright Test
- **Ngôn ngữ:** JavaScript
- **Phương pháp test:** End-to-End (E2E) Testing, Negative Testing, Security Testing.

## Cấu trúc Test Suite
Bộ test được chia thành 3 modules (file) riêng biệt để dễ quản lý và tối ưu tốc độ chạy song song (Parallel execution):

1. **`tests/authentication.spec.js`**: Đăng ký, Đăng nhập, Đăng xuất, kiểm tra Form Validation (HTML5) và kiểm thử tấn công SQL Injection.
2. **`tests/cart.spec.js`**: Tìm kiếm sản phẩm, quản lý giỏ hàng (thêm, sửa số lượng, xóa) và kiểm thử tấn công XSS.
3. **`tests/checkout.spec.js`**: Luồng thanh toán E2E, nhập thông tin giao hàng, thanh toán qua thẻ tín dụng ảo và kiểm thử thanh toán lỗi (giỏ hàng rỗng).

## Các điểm nổi bật (Advanced Implementations)
- **Tích hợp AdBlocker Tự động:** Tự động chặn các domain quảng cáo (Google Ads, Criteo) thông qua `page.route` giúp web không bị treo do tải tài nguyên vô tận, tránh tình trạng iframe quảng cáo che khuất nút bấm (Flaky Tests).
- **Xử lý Race Condition:** Sử dụng linh hoạt `waitForLoadState('networkidle')` và Force Click (`{ force: true }`) để xử lý dứt điểm các lỗi bất đồng bộ do Script của trang web chưa kịp tải xong hoặc bị dính overlay ẩn.
- **Tích hợp Security Testing:** Lồng ghép kiểm thử bảo mật bằng cách can thiệp DOM để bypass HTML5 validation (ép bắn mã SQL Injection) và kiểm tra khả năng parse chuỗi độc hại (XSS) của web.
- **SlowMo Mode:** Cấu hình độ trễ (delay) giữa các lệnh giúp việc trình diễn đồ án trước Giảng viên trở nên trực quan và dễ theo dõi hơn.

## Hướng dẫn cài đặt & Chạy kịch bản

### 1. Cài đặt môi trường
Đảm bảo máy bạn đã cài sẵn Node.js. Di chuyển vào thư mục dự án và chạy các lệnh sau để cài thư viện và các trình duyệt (Chromium, Firefox, WebKit):
```bash
npm install
npx playwright install
```

### 2. Lệnh chạy Test
**Chạy trên giao diện trực quan (UI Mode) - Dùng để xem thao tác chạy chậm rãi:**
```bash
npx playwright test --ui
```

**Chạy ngầm (Headless Mode) - Dành cho CI/CD:**
```bash
npx playwright test
```

**Chạy riêng biệt một chức năng:**
```bash
npx playwright test tests/checkout.spec.js --ui
```

### 3. Xuất báo cáo kết quả (HTML Report)
Sau khi Playwright chạy test xong, toàn bộ kết quả, log, trace viewer sẽ được lưu lại. Để mở giao diện báo cáo HTML xịn xò, chạy lệnh:
```bash
npx playwright show-report
```

---
*Thực hiện bởi: PhongPKF*
