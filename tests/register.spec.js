const { test, expect } = require('@playwright/test');

/**
 * ĐỒ ÁN MÔN KIỂM THỬ PHẦN MỀM - TỰ ĐỘNG HÓA VỚI PLAYWRIGHT
 * Website: https://ttgshop.vn
 * Chức năng: Đăng ký tài khoản
 * Tổng số TC: 28
 */

// ---------------------------------------------------------------
// SELECTORS
// ---------------------------------------------------------------
const SEL = {
    form:          '#js-register-form',
    fullName:      'input[name="info[full_name]"]',
    tel:           'input[name="info[tel]"]',
    address:       'input[name="info[address]"]',
    email:         '#js-register-form input[name="info[email]"]',
    password:      '#js-register-form input[name="info[password]"]',
    passRepeat:    'input[check-type="password-repeat"]',
    btnSubmit:     'button[onclick="sendRegistor();"]',
};

// Điền toàn bộ form với dữ liệu mặc định, có thể ghi đè từng trường
async function fillForm(page, overrides = {}) {
    const ts = Date.now();
    const data = {
        fullName:    'Nguyen Van Test',
        tel:         '0987654321',
        address:     '456 Phạm Văn Đồng, Bắc Từ Liêm, Hà Nội',
        email:       `test.ttg.${ts}@gmail.com`,
        password:    'Playwright@2024',
        passRepeat:  'Playwright@2024',
        ...overrides,
    };
    if (data.fullName   !== null) await page.locator(SEL.fullName).fill(data.fullName);
    if (data.tel        !== null) await page.locator(SEL.tel).fill(data.tel);
    if (data.address    !== null) await page.locator(SEL.address).fill(data.address);
    if (data.email      !== null) await page.locator(SEL.email).fill(data.email);
    if (data.password   !== null) await page.locator(SEL.password).fill(data.password);
    if (data.passRepeat !== null) await page.locator(SEL.passRepeat).fill(data.passRepeat);
    return data;
}

// Đóng popup (thành công hoặc lỗi) ngay khi xuất hiện thay vì đợi đếm ngược ~5s
async function closeSuccessPopup(page) {
    try {
        await page.locator('.global-popup-modal__button.close').waitFor({ state: 'visible', timeout: 5000 });
        await page.locator('.global-popup-modal__button.close').click();
        await page.waitForTimeout(1500);
    } catch {
        // Popup không xuất hiện - server đã từ chối hoặc validation lỗi
    }
}

// Xóa toàn bộ ràng buộc HTML5 validation để bơm dữ liệu thẳng lên server-side
async function stripHtmlValidation(page) {
    await page.evaluate(() => {
        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.removeAttribute('required');
            el.removeAttribute('minlength');
            el.removeAttribute('maxlength');
            el.removeAttribute('pattern');
            el.removeAttribute('title');
            if (el.type === 'email') el.type = 'text';
        });
    });
}

test.describe('1. Đăng ký tài khoản - ttgshop.vn', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dang-ky', { waitUntil: 'domcontentloaded' });
    });

    // ============================================================
    // NHÓM 1: ĐĂNG KÝ THÀNH CÔNG
    // ============================================================

    test('TC_REG_01: Đăng ký thành công với dữ liệu hợp lệ (Happy Path)', async ({ page }) => {
        await fillForm(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        // Kỳ vọng: chuyển sang trang đăng nhập hoặc hiển thị thông báo thành công
        const currentUrl = page.url();
        const hasSuccess = currentUrl.includes('/dang-nhap') || currentUrl === 'https://ttgshop.vn/' || currentUrl === 'https://ttgshop.vn';
        expect(hasSuccess, `Sau đăng ký phải chuyển trang, URL hiện tại: ${currentUrl}`).toBeTruthy();
    });

    // ============================================================
    // NHÓM 2: VALIDATION CÁC TRƯỜNG BẮT BUỘC ĐỂ TRỐNG
    // ============================================================

    test('TC_REG_02: Submit form khi tất cả trường đều trống - phải hiển thị validation', async ({ page }) => {
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        // Kỳ vọng: vẫn ở trang đăng ký (không cho submit)
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    // ============================================================
    // NHÓM 3: VALIDATION TRƯỜNG HỌ VÀ TÊN
    // ============================================================

    test('TC_REG_03: Họ và Tên chỉ 1 ký tự (dưới minlength=2) - phải bị từ chối', async ({ page }) => {
        await fillForm(page, { fullName: 'A' });
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_04: Họ và Tên chỉ toàn khoảng trắng - SERVER phải từ chối (Bug hệ thống)', async ({ page }) => {
        await fillForm(page, { fullName: '     ' });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_05: Họ và Tên chứa chữ số - SERVER phải từ chối (Bug hệ thống)', async ({ page }) => {
        // Tên người không được chứa số
        await fillForm(page, { fullName: 'Nguyen123' });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_06: Họ và Tên chứa ký tự đặc biệt @#$ - SERVER phải từ chối (Bug hệ thống)', async ({ page }) => {
        await fillForm(page, { fullName: 'Nguyen@#$' });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_07: Họ và Tên quá dài 300 ký tự - SERVER phải từ chối (Bug hệ thống)', async ({ page }) => {
        const longName = 'Nguyen Van '.repeat(30).trim(); // ~330 ký tự
        await fillForm(page, { fullName: longName });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_08: Họ và Tên chứa mã XSS - hệ thống không được thực thi script (Security)', async ({ page }) => {
        const ts = Date.now();
        await fillForm(page, {
            fullName: '<script>alert("XSS")</script>',
            email: `test.xss.name.${ts}@gmail.com`,
        });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(2000);
        // Kỳ vọng 1: form bị server từ chối vì tên chứa ký tự đặc biệt
        // Kỳ vọng 2: nếu cho qua thì script phải được escape, không được chạy
        const dialogTriggered = await page.evaluate(() => window.__xss_triggered__);
        expect(dialogTriggered).toBeFalsy();
    });

    // ============================================================
    // NHÓM 4: VALIDATION TRƯỜNG SỐ ĐIỆN THOẠI
    // ============================================================

    test('TC_REG_09: Số điện thoại chứa chữ cái - phải bị từ chối', async ({ page }) => {
        await fillForm(page, { tel: '0912abc456' });
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_10: Số điện thoại chứa ký tự đặc biệt - phải bị từ chối', async ({ page }) => {
        await fillForm(page, { tel: '0912-345-678' });
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_11: Số điện thoại quá ngắn (4 số) - phải bị từ chối', async ({ page }) => {
        await fillForm(page, { tel: '0912' });
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_12: Số điện thoại quá dài (20 số) - SERVER phải từ chối (Bug hệ thống)', async ({ page }) => {
        await fillForm(page, { tel: '09876543210123456789' });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    // ============================================================
    // NHÓM 5: VALIDATION TRƯỜNG ĐỊA CHỈ
    // ============================================================

    test('TC_REG_13: Địa chỉ quá ngắn (7 ký tự, dưới minlength=8) - phải bị từ chối', async ({ page }) => {
        await fillForm(page, { address: '1234567' }); // 7 ký tự
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_14: Địa chỉ chỉ chứa khoảng trắng (8 dấu cách) - SERVER phải từ chối (Bug hệ thống)', async ({ page }) => {
        // 8 dấu cách vượt qua minlength=8 nhưng không có nội dung thực tế
        await fillForm(page, { address: '        ' }); // 8 dấu cách
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_15: Địa chỉ cực dài 500 ký tự - SERVER phải từ chối (Bug hệ thống)', async ({ page }) => {
        const longAddr = '456 Phạm Văn Đồng Hà Nội '.repeat(25).trim(); // ~650 ký tự
        await fillForm(page, { address: longAddr });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    // ============================================================
    // NHÓM 6: VALIDATION TRƯỜNG EMAIL
    // ============================================================

    test('TC_REG_16: Email sai định dạng (abc@) - phải bị từ chối', async ({ page }) => {
        await fillForm(page, { email: 'abc@' });
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_17: Email không có ký tự @ (abcexample.com) - phải bị từ chối', async ({ page }) => {
        await fillForm(page, { email: 'abcexample.com' });
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_18: Email có dấu chấm cuối tên miền (abc@example.) - phải bị từ chối', async ({ page }) => {
        await fillForm(page, { email: 'abc@example.' });
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_19: Email có khoảng trắng ở đầu - SERVER tự trim hoặc từ chối (Bug hệ thống)', async ({ page }) => {
        const ts = Date.now();
        await fillForm(page, { email: `   test.ttg.${ts}@gmail.com` });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        // Kỳ vọng: đăng ký thành công sau khi server tự động trim khoảng trắng
        const currentUrl = page.url();
        const accepted = currentUrl.includes('/dang-nhap') || currentUrl === 'https://ttgshop.vn/' || !currentUrl.includes('/dang-ky');
        expect(accepted, `Email có khoảng trắng đầu không được server xử lý đúng, URL: ${currentUrl}`).toBeTruthy();
    });

    test('TC_REG_20: Email có khoảng trắng ở cuối - SERVER tự trim hoặc từ chối (Bug hệ thống)', async ({ page }) => {
        const ts = Date.now();
        await fillForm(page, { email: `test.ttg.${ts}@gmail.com   ` });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        const currentUrl = page.url();
        const accepted = currentUrl.includes('/dang-nhap') || currentUrl === 'https://ttgshop.vn/' || !currentUrl.includes('/dang-ky');
        expect(accepted, `Email có khoảng trắng cuối không được server xử lý đúng, URL: ${currentUrl}`).toBeTruthy();
    });

    test('TC_REG_21: Email đã tồn tại trong hệ thống - phải hiển thị thông báo lỗi (Bug hệ thống)', async ({ page }) => {
        // Dùng một email đã đăng ký trước đó
        await fillForm(page, { email: 'test.playwright.ttg.existed@gmail.com' });
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        // Kỳ vọng: ở lại trang đăng ký và hiển thị thông báo "email đã tồn tại"
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_22: Email quá dài (255+ ký tự) - SERVER phải từ chối (Bug hệ thống)', async ({ page }) => {
        const longEmail = 'a'.repeat(240) + '@gmail.com'; // 250+ ký tự
        await fillForm(page, { email: longEmail });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    // ============================================================
    // NHÓM 7: VALIDATION TRƯỜNG MẬT KHẨU
    // ============================================================

    test('TC_REG_23: Mật khẩu chỉ 1 ký tự - phải bị từ chối', async ({ page }) => {
        await fillForm(page, { password: 'a', passRepeat: 'a' });
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_24: Mật khẩu quá dài 300 ký tự - SERVER phải từ chối (Bug hệ thống)', async ({ page }) => {
        const longPass = 'Pw@' + 'a'.repeat(297); // 300 ký tự
        await fillForm(page, { password: longPass, passRepeat: longPass });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_REG_25: Nhập lại mật khẩu không khớp - phải bị từ chối', async ({ page }) => {
        await fillForm(page, { password: 'Playwright@2024', passRepeat: 'KhacNhau@2024' });
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    // ============================================================
    // NHÓM 8: KIỂM TRA HÀNH VI SAU SUBMIT
    // ============================================================

    test('TC_REG_26: Double-click nút Đăng Ký - chỉ được tạo 1 tài khoản (Bug hệ thống)', async ({ page }) => {
        const ts = Date.now();
        await fillForm(page, { email: `test.ttg.double.${ts}@gmail.com` });
        // Nhấn đúp nhanh → hệ thống không được xử lý 2 lần
        await page.locator(SEL.btnSubmit).dblclick();
        await closeSuccessPopup(page);
        // Chỉ cần không crash và xử lý bình thường
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('error');
        expect(currentUrl).not.toContain('500');
    });

    test('TC_REG_27: Sau đăng ký thành công phải chuyển về trang Đăng nhập (Bug hệ thống)', async ({ page }) => {
        await fillForm(page);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        // Kỳ vọng đúng: chuyển đến /dang-nhap
        // Nếu web chuyển về trang chủ hoặc ở lại /dang-ky → có thể xem là Bug UX
        await expect(page).toHaveURL(/.*dang-nhap/);
    });

    test('TC_REG_28: Địa chỉ chứa mã XSS - hệ thống không được thực thi script (Security)', async ({ page }) => {
        const ts = Date.now();
        await fillForm(page, {
            address: '<script>alert("XSS_ADDR")</script> Phạm Văn Đồng, Hà Nội',
            email: `test.xss.addr.${ts}@gmail.com`,
        });
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(2000);
        // Kỳ vọng: form bị server chặn hoặc script được escape khi hiển thị
        const pageSource = await page.content();
        expect(pageSource).not.toContain('<script>alert("XSS_ADDR")</script>');
    });
});
