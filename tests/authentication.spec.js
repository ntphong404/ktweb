const { test, expect } = require('@playwright/test');

/**
 * ĐỒ ÁN MÔN KIỂM THỬ PHẦN MỀM - TỰ ĐỘNG HÓA VỚI PLAYWRIGHT
 * Chức năng: Authentication & Security
 */

test.describe('1. Authentication & Security (Đăng ký, Đăng nhập, Bảo mật)', () => {
    test.beforeEach(async ({ page }) => {
        // Chặn tải quảng cáo để web không bị treo và không bị che khuất nút bấm
        await page.route('**/*', route => {
            const url = route.request().url();
            if (url.includes('googlesyndication') || url.includes('googleads') || url.includes('criteo') || url.includes('doubleclick') || url.includes('pubmatic') || url.includes('adsystem')) {
                route.abort();
            } else {
                route.continue();
            }
        });
        await page.goto('https://automationexercise.com/', { waitUntil: 'domcontentloaded' });
    });

    test('TC_REG_01: Đăng ký thành công với Email mới', async ({ page }) => {
        await page.locator('text=Signup / Login').click();

        // Sinh email ngẫu nhiên để tránh trùng lặp khi chạy nhiều lần
        const timestamp = Date.now();
        const email = `phongpkf.test${timestamp}@gmail.com`;

        // Form Đăng ký
        await page.locator('[data-qa="signup-name"]').fill('PhongPKF');
        await page.locator('[data-qa="signup-email"]').fill(email);
        await page.locator('[data-qa="signup-button"]').click();

        // Form Thông tin chi tiết
        await expect(page.locator('text=ENTER ACCOUNT INFORMATION')).toBeVisible();
        // Nút radio thực tế bị thư viện CSS ẩn đi (opacity: 0), nên ta click thẳng vào label của nó
        await page.locator('label[for="id_gender1"]').click();
        await page.locator('[data-qa="password"]').fill('SecurePass123');
        await page.locator('[data-qa="days"]').selectOption('1');
        await page.locator('[data-qa="months"]').selectOption('1');
        await page.locator('[data-qa="years"]').selectOption('2000');

        await page.locator('[data-qa="first_name"]').fill('Phong');
        await page.locator('[data-qa="last_name"]').fill('PKF');
        await page.locator('[data-qa="company"]').fill('HUST');
        await page.locator('[data-qa="address"]').fill('Dai Co Viet, Hanoi');
        await page.locator('[data-qa="country"]').selectOption('United States');
        await page.locator('[data-qa="state"]').fill('Hanoi');
        await page.locator('[data-qa="city"]').fill('Hai Ba Trung');
        await page.locator('[data-qa="zipcode"]').fill('100000');
        await page.locator('[data-qa="mobile_number"]').fill('0987654321');

        await page.locator('[data-qa="create-account"]').click();

        // Kiểm tra kết quả
        await expect(page.locator('text=ACCOUNT CREATED!')).toBeVisible();
        // Ép Playwright click xuyên qua iframe quảng cáo ẩn (nếu có)
        await page.locator('[data-qa="continue-button"]').click({ force: true });

        // Xác nhận đã đăng nhập thành công
        await expect(page.locator('text=Logged in as')).toBeVisible();
    });

    test('TC_REG_02: Đăng ký thất bại do trùng Email đã tồn tại', async ({ page }) => {
        await page.locator('text=Signup / Login').click();
        await page.locator('[data-qa="signup-name"]').fill('PhongPKF');
        // Sử dụng email đã tồn tại trên hệ thống
        await page.locator('[data-qa="signup-email"]').fill('phongpkf.test@gmail.com');
        await page.locator('[data-qa="signup-button"]').click();

        // Kiểm tra thông báo lỗi
        await expect(page.locator('text=Email Address already exist!')).toBeVisible();
    });

    test('TC_REG_03: Validation Form đăng ký để trống trường bắt buộc', async ({ page }) => {
        await page.locator('text=Signup / Login').click();
        const email = `phongpkf.test_empty${Date.now()}@gmail.com`;
        await page.locator('[data-qa="signup-name"]').fill('PhongPKF');
        await page.locator('[data-qa="signup-email"]').fill(email);
        await page.locator('[data-qa="signup-button"]').click();

        await expect(page.locator('text=ENTER ACCOUNT INFORMATION')).toBeVisible();

        // Điền các trường nhưng cố tình bỏ trống Password
        await page.locator('[data-qa="first_name"]').fill('Phong');
        await page.locator('[data-qa="last_name"]').fill('PKF');

        await page.locator('[data-qa="create-account"]').click();

        // Kiểm tra HTML5 Validation: trình duyệt sẽ ngăn submit và thẻ input password bị đánh dấu invalid
        const isPasswordInvalid = await page.$eval('[data-qa="password"]', el => !el.validity.valid);
        expect(isPasswordInvalid).toBeTruthy();
    });

    test('TC_LG_01: Đăng nhập thành công với thông tin đúng', async ({ page }) => {
        await page.locator('text=Signup / Login').click();

        // Cần đảm bảo tài khoản này đã được tạo từ trước (có thể tự tạo tay hoặc dùng script setup)
        await page.locator('[data-qa="login-email"]').fill('phongpkf.test@gmail.com');
        await page.locator('[data-qa="login-password"]').fill('SecurePass123');
        await page.locator('[data-qa="login-button"]').click();

        await expect(page.locator('text=Logged in as')).toBeVisible();
    });

    test('TC_LG_02: Đăng nhập thất bại với thông tin sai', async ({ page }) => {
        await page.locator('text=Signup / Login').click();
        await page.locator('[data-qa="login-email"]').fill('phongpkf.test@gmail.com');
        await page.locator('[data-qa="login-password"]').fill('WrongPassword123!');
        await page.locator('[data-qa="login-button"]').click();

        await expect(page.locator('text=Your email or password is incorrect!')).toBeVisible();
    });

    test('TC_LG_SEC_01: SQL Injection bypass đăng nhập (Negative Test)', async ({ page }) => {
        await page.locator('text=Signup / Login').click();

        // Bỏ qua chặn HTML5 (type="email") của trình duyệt để ép gửi mã độc thẳng xuống Backend
        await page.evaluate(() => document.querySelector('[data-qa="login-email"]').type = 'text');

        // Thử chèn mã SQL Injection cơ bản vào ô email và password
        await page.locator('[data-qa="login-email"]').fill("' OR '1'='1");
        await page.locator('[data-qa="login-password"]').fill("' OR '1'='1");
        await page.locator('[data-qa="login-button"]').click();

        // Trang web phải chặn được và báo lỗi thay vì cho phép đăng nhập
        await expect(page.locator('text=Your email or password is incorrect!')).toBeVisible();
    });

    test('TC_LG_03: Đăng xuất tài khoản thành công', async ({ page }) => {
        // Đăng nhập trước
        await page.locator('text=Signup / Login').click();
        await page.locator('[data-qa="login-email"]').fill('phongpkf.test@gmail.com');
        await page.locator('[data-qa="login-password"]').fill('SecurePass123');
        await page.locator('[data-qa="login-button"]').click();
        await expect(page.locator('text=Logged in as')).toBeVisible();

        // Thực hiện đăng xuất
        await page.locator('text=Logout').click();

        // Kiểm tra điều hướng quay lại trang đăng nhập
        await expect(page).toHaveURL(/.*login/);
    });
});
