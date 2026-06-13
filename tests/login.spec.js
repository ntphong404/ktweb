const { test, expect } = require('@playwright/test');

/**
 * ĐỒ ÁN MÔN KIỂM THỬ PHẦN MỀM - TỰ ĐỘNG HÓA VỚI PLAYWRIGHT
 * Website: https://ttgshop.vn
 * Chức năng: Đăng nhập / Đăng xuất tài khoản
 * Tổng số TC: 22
 *
 * LƯU Ý: Cần tạo sẵn tài khoản test trước khi chạy bộ test này:
 *   Email:    test.playwright.ttg@gmail.com
 *   Password: Playwright@2024
 *   Họ tên:  Test Playwright
 *   SĐT:     0901234568
 *   Địa chỉ: 456 Phạm Văn Đồng, Bắc Từ Liêm, Hà Nội
 */

// ---------------------------------------------------------------
// SELECTORS & TEST ACCOUNT
// ---------------------------------------------------------------
const SEL = {
    form:        '#js-login-form',
    email:       '#js-login-form input[name="info[email]"]',
    password:    '#js-login-password',
    btnSubmit:   'button[onclick="sendLogin();"]',
    showPass:    '#forgot-passwords',
    savePass:    '#save-passwords',
    linkRegister: 'a[href="/dang-ky"]:has-text("Đăng ký tài khoản")',
    linkForgot:   'a[href="/quen-mat-khau"]',
};

const ACCOUNT = {
    email:    'test.playwright.ttg@gmail.com',
    password: 'Playwright@2024',
};

// Helper: đăng nhập nhanh
async function doLogin(page, email = ACCOUNT.email, password = ACCOUNT.password) {
    await page.goto('/dang-nhap', { waitUntil: 'domcontentloaded' });
    await page.locator(SEL.email).fill(email);
    await page.locator(SEL.password).fill(password);
    await page.locator(SEL.btnSubmit).click();
    // Đóng popup ngay khi xuất hiện thay vì đợi đếm ngược ~5s
    await closeSuccessPopup(page);
}

// Đóng popup (thành công hoặc lỗi) ngay khi xuất hiện thay vì đợi đếm ngược ~5s
async function closeSuccessPopup(page) {
    try {
        await page.locator('.global-popup-modal__button.close').waitFor({ state: 'visible', timeout: 5000 });
        await page.locator('.global-popup-modal__button.close').click();
        await page.waitForTimeout(1500);
    } catch {
        // Popup không xuất hiện - đăng nhập thất bại hoặc validation lỗi
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

test.describe('2. Đăng nhập tài khoản - ttgshop.vn', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dang-nhap', { waitUntil: 'domcontentloaded' });
    });

    // ============================================================
    // NHÓM 1: KIỂM TRA ĐIỀU HƯỚNG
    // ============================================================

    test('TC_LG_01: Link "Đăng ký tài khoản" dẫn đến trang /dang-ky', async ({ page }) => {
        await page.locator(SEL.linkRegister).click();
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/.*dang-ky/);
    });

    test('TC_LG_02: Link "Quên mật khẩu?" dẫn đến trang /quen-mat-khau', async ({ page }) => {
        await page.locator(SEL.linkForgot).click();
        await expect(page).toHaveURL(/.*quen-mat-khau/);
    });

    // ============================================================
    // NHÓM 2: ĐĂNG NHẬP THÀNH CÔNG
    // ============================================================

    test('TC_LG_03: Đăng nhập thành công với thông tin hợp lệ (Happy Path)', async ({ page }) => {
        await page.locator(SEL.email).fill(ACCOUNT.email);
        await page.locator(SEL.password).fill(ACCOUNT.password);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        // Kỳ vọng: rời khỏi trang đăng nhập (về trang chủ hoặc trang tài khoản)
        await expect(page).not.toHaveURL(/.*dang-nhap/);
    });

    test('TC_LG_04: Sau đăng nhập thành công phải chuyển về trang chủ', async ({ page }) => {
        await page.locator(SEL.email).fill(ACCOUNT.email);
        await page.locator(SEL.password).fill(ACCOUNT.password);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        const currentUrl = page.url();
        const isHomePage = currentUrl === 'https://ttgshop.vn/' || currentUrl === 'https://ttgshop.vn' || currentUrl.includes('/taikhoan');
        expect(isHomePage, `Sau đăng nhập URL phải là trang chủ hoặc trang tài khoản, thực tế: ${currentUrl}`).toBeTruthy();
    });

    // ============================================================
    // NHÓM 3: ĐĂNG NHẬP THẤT BẠI
    // ============================================================

    test('TC_LG_05: Đăng nhập với mật khẩu sai - phải thông báo lỗi', async ({ page }) => {
        await page.locator(SEL.email).fill(ACCOUNT.email);
        await page.locator(SEL.password).fill('SaiMatKhau@9999');
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(2000);
        // Kỳ vọng: ở lại trang đăng nhập
        await expect(page).toHaveURL(/.*dang-nhap/);
    });

    test('TC_LG_06: Đăng nhập với email không tồn tại - phải thông báo lỗi', async ({ page }) => {
        await page.locator(SEL.email).fill('khongtontai.xyz.99999@gmail.com');
        await page.locator(SEL.password).fill('Playwright@2024');
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/.*dang-nhap/);
    });

    test('TC_LG_07: Submit form khi để trống Email - phải hiển thị validation', async ({ page }) => {
        await page.locator(SEL.password).fill(ACCOUNT.password);
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-nhap/);
    });

    test('TC_LG_08: Submit form khi để trống Mật khẩu - phải hiển thị validation', async ({ page }) => {
        await page.locator(SEL.email).fill(ACCOUNT.email);
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-nhap/);
    });

    test('TC_LG_09: Submit form khi để trống cả Email và Mật khẩu - phải hiển thị validation', async ({ page }) => {
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-nhap/);
    });

    test('TC_LG_10: Email sai định dạng (không có @) - phải bị từ chối', async ({ page }) => {
        await page.locator(SEL.email).fill('emailkhongco@sign');
        await page.locator(SEL.password).fill(ACCOUNT.password);
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(1500);
        await expect(page).toHaveURL(/.*dang-nhap/);
    });

    // ============================================================
    // NHÓM 4: KIỂM TRA TÍNH NHẤT QUÁN (CASE SENSITIVITY, TRIM)
    // ============================================================

    test('TC_LG_11: Email chữ hoa/chữ thường - phải đăng nhập được (case-insensitive)', async ({ page }) => {
        // Kỳ vọng: email không phân biệt hoa/thường
        await page.locator(SEL.email).fill(ACCOUNT.email.toUpperCase());
        await page.locator(SEL.password).fill(ACCOUNT.password);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).not.toHaveURL(/.*dang-nhap/);
    });

    test('TC_LG_12: Mật khẩu phân biệt chữ hoa/chữ thường - đăng nhập THẤT BẠI khi sai case', async ({ page }) => {
        await page.locator(SEL.email).fill(ACCOUNT.email);
        // Đổi chữ thường thành hoa trong mật khẩu → phải sai
        await page.locator(SEL.password).fill(ACCOUNT.password.toUpperCase());
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/.*dang-nhap/);
    });

    test('TC_LG_13: Email có khoảng trắng đầu - SERVER tự trim và đăng nhập được (Bug hệ thống)', async ({ page }) => {
        // type="email" HTML5 chặn email có space → phải strip để bơm lên server
        await stripHtmlValidation(page);
        await page.locator(SEL.email).fill(`   ${ACCOUNT.email}`);
        await page.locator(SEL.password).fill(ACCOUNT.password);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        // Kỳ vọng: server tự trim khoảng trắng và đăng nhập thành công
        // Nếu thất bại → Bug (server không trim email)
        await expect(page).not.toHaveURL(/.*dang-nhap/);
    });

    test('TC_LG_14: Email có khoảng trắng cuối - SERVER tự trim và đăng nhập được (Bug hệ thống)', async ({ page }) => {
        // type="email" HTML5 chặn email có space → phải strip để bơm lên server
        await stripHtmlValidation(page);
        await page.locator(SEL.email).fill(`${ACCOUNT.email}   `);
        await page.locator(SEL.password).fill(ACCOUNT.password);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).not.toHaveURL(/.*dang-nhap/);
    });

    test('TC_LG_15: Mật khẩu cực dài 300 ký tự - SERVER phải xử lý bình thường, không lỗi server (Bug hệ thống)', async ({ page }) => {
        const longPass = 'P@' + 'a'.repeat(298);
        await page.locator(SEL.email).fill(ACCOUNT.email);
        await page.locator(SEL.password).fill(longPass);
        // Strip maxlength để payload bơm thẳng lên server
        await stripHtmlValidation(page);
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(2000);
        // Kỳ vọng: báo sai mật khẩu (không crash server)
        await expect(page).toHaveURL(/.*dang-nhap/);
    });

    // ============================================================
    // NHÓM 5: KIỂM TRA BẢO MẬT
    // ============================================================

    test('TC_LG_16: SQL Injection trong trường Mật khẩu - phải bị chặn (Security)', async ({ page }) => {
        await page.locator(SEL.email).fill(ACCOUNT.email);
        // Strip maxlength trên password để payload dài đi qua được
        await stripHtmlValidation(page);
        await page.locator(SEL.password).fill("'; DROP TABLE users; --");
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/.*dang-nhap/);
    });

    test('TC_LG_17: XSS trong trường Email - không được thực thi script (Security)', async ({ page }) => {
        // Nhúng XSS vào local-part của email để qua JS format validator:
        // "<script>@x.com" trông như email (có @ và .com) → payload đến được server
        await page.locator(SEL.email).fill('<script>alert("XSS")</script>@x.com');
        await page.locator(SEL.password).fill(ACCOUNT.password);
        await page.locator(SEL.btnSubmit).click();
        await page.waitForTimeout(2000);
        const pageSource = await page.content();
        expect(pageSource).not.toContain('<script>alert("XSS")</script>');
    });

    // ============================================================
    // NHÓM 6: CHỨC NĂNG ĐĂNG XUẤT VÀ ĐIỀU HƯỚNG
    // ============================================================

    test('TC_LG_18: Nút hiển thị/ẩn mật khẩu hoạt động đúng', async ({ page }) => {
        // Ban đầu mật khẩu phải ở dạng ẩn (type="password")
        await expect(page.locator(SEL.password)).toHaveAttribute('type', 'password');
        // Click checkbox "Hiển thị mật khẩu"
        await page.locator(SEL.showPass).click();
        await page.waitForTimeout(500);
        // Sau khi click → mật khẩu phải hiển thị (type="text")
        await expect(page.locator(SEL.password)).toHaveAttribute('type', 'text');
    });

    test('TC_LG_19: Đăng xuất thành công - chuyển về trang chủ', async ({ page }) => {
        await doLogin(page);
        const logoutLink = page.locator('a:has-text("Đăng xuất")').first();
        await expect(logoutLink).toBeVisible();
        await logoutLink.click();
        // Popup xác nhận đăng xuất → click "Xác nhận"
        await page.locator('.global-popup-modal__button.submit').waitFor({ state: 'visible' });
        await page.locator('.global-popup-modal__button.submit').click();
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        const isLoggedOut = currentUrl === 'https://ttgshop.vn/' || currentUrl === 'https://ttgshop.vn' || currentUrl.includes('/dang-nhap');
        expect(isLoggedOut, `Sau đăng xuất phải về trang chủ hoặc đăng nhập, thực tế: ${currentUrl}`).toBeTruthy();
    });

    test('TC_LG_20: Sau đăng nhập → truy cập lại /dang-nhap phải redirect (Bug hệ thống)', async ({ page }) => {
        await doLogin(page);
        // Đã đăng nhập → vào lại trang đăng nhập phải bị redirect
        await page.goto('/dang-nhap', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        // Kỳ vọng: redirect về trang chủ hoặc trang tài khoản
        // Nếu vẫn hiển thị form đăng nhập → Bug (user đã login rồi mà vẫn thấy form)
        const formVisible = await page.locator(SEL.form).isVisible();
        expect(formVisible, 'User đã đăng nhập nhưng vẫn thấy form đăng nhập → Bug').toBeFalsy();
    });

    test('TC_LG_21: Truy cập trang /taikhoan khi chưa đăng nhập - phải redirect về /dang-nhap', async ({ page }) => {
        // Truy cập thẳng trang tài khoản khi chưa đăng nhập
        await page.goto('/taikhoan', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        // Kỳ vọng: redirect về trang đăng nhập
        await expect(page).toHaveURL(/.*dang-nhap|.*dang-ky/);
    });

    test('TC_LG_22: Đăng nhập sai 5 lần liên tiếp - kiểm tra có khóa tài khoản không (Bug hệ thống)', async ({ page }) => {
        for (let i = 0; i < 5; i++) {
            await page.locator(SEL.email).clear();
            await page.locator(SEL.password).clear();
            await page.locator(SEL.email).fill(ACCOUNT.email);
            await page.locator(SEL.password).fill(`SaiMatKhau${i}`);
            await page.locator(SEL.btnSubmit).click();
            await closeSuccessPopup(page);
        }
        // Sau 5 lần sai, thử đăng nhập với đúng mật khẩu
        // Kỳ vọng: hệ thống phải khóa tài khoản hoặc yêu cầu CAPTCHA → vẫn ở lại /dang-nhap
        // Nếu đăng nhập thành công → Bug: không có cơ chế chống brute-force
        await page.locator(SEL.email).clear();
        await page.locator(SEL.password).clear();
        await page.locator(SEL.email).fill(ACCOUNT.email);
        await page.locator(SEL.password).fill(ACCOUNT.password);
        await page.locator(SEL.btnSubmit).click();
        await closeSuccessPopup(page);
        await expect(page).toHaveURL(/.*dang-nhap/);
    });

});
