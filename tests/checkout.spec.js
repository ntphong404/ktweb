const { test, expect } = require('@playwright/test');

/**
 * ĐỒ ÁN MÔN KIỂM THỬ PHẦN MỀM - TỰ ĐỘNG HÓA VỚI PLAYWRIGHT
 * Chức năng: Checkout & Place Order
 */

test.describe('3. Checkout & Place Order (Thanh toán & Đặt hàng)', () => {
    test.beforeEach(async ({ page }) => {
        // Chặn tải quảng cáo để web không bị treo
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

    test('TC_CH_01: Xác nhận thông tin Checkout (Địa chỉ & Đơn hàng)', async ({ page }) => {
        // 1. Đăng nhập
        await page.locator('text=Signup / Login').click();
        await page.locator('[data-qa="login-email"]').fill('phongpkf.test@gmail.com');
        await page.locator('[data-qa="login-password"]').fill('SecurePass123');
        await page.locator('[data-qa="login-button"]').click();

        // 2. Thêm 1 sản phẩm vào giỏ
        await page.goto('https://automationexercise.com/products');
        const firstProduct = page.locator('.single-products').first();
        await firstProduct.hover();
        await firstProduct.locator('.add-to-cart').first().click();
        await page.locator('text=View Cart').click();

        // 3. Tiến hành Checkout
        await page.locator('text=Proceed To Checkout').click();

        // 4. Kiểm tra hiển thị đủ khối Address và Review Order
        await expect(page.locator('#address_delivery')).toBeVisible();
        await expect(page.locator('#cart_info')).toBeVisible();
    });

    test('TC_CH_02: Đặt hàng thành công qua cổng thanh toán giả lập', async ({ page }) => {
        // 1. Đăng nhập
        await page.locator('text=Signup / Login').click();
        await page.locator('[data-qa="login-email"]').fill('phongpkf.test@gmail.com');
        await page.locator('[data-qa="login-password"]').fill('SecurePass123');
        await page.locator('[data-qa="login-button"]').click();

        // 2. Thêm 1 sản phẩm vào giỏ
        await page.goto('https://automationexercise.com/products');
        const firstProduct = page.locator('.single-products').first();
        await firstProduct.hover();
        await firstProduct.locator('.add-to-cart').first().click();
        await page.locator('text=View Cart').click();

        // 3. Checkout
        await page.locator('text=Proceed To Checkout').click();

        // 4. Nhập ghi chú
        await page.locator('textarea[name="message"]').fill('Giao hàng trong giờ hành chính giúp mình.');
        await page.locator('text=Place Order').click();

        // 5. Điền thông tin thẻ ảo
        await page.locator('[data-qa="name-on-card"]').fill('PhongPKF');
        await page.locator('[data-qa="card-number"]').fill('4111111111111111');
        await page.locator('[data-qa="cvc"]').fill('311');
        await page.locator('[data-qa="expiry-month"]').fill('12');
        await page.locator('[data-qa="expiry-year"]').fill('2028');

        // 6. Thanh toán
        await page.locator('[data-qa="pay-button"]').click();

        // 7. Verify kết quả
        await expect(page.locator('text=ORDER PLACED!')).toBeVisible();
        await expect(page.locator('text=Download Invoice')).toBeVisible();
    });

    test('TC_CH_03: Checkout thất bại do giỏ hàng trống (Negative Test)', async ({ page }) => {
        // 1. Đăng nhập
        await page.locator('text=Signup / Login').click();
        await page.locator('[data-qa="login-email"]').fill('phongpkf.test@gmail.com');
        await page.locator('[data-qa="login-password"]').fill('SecurePass123');
        await page.locator('[data-qa="login-button"]').click();

        // 2. Vào thẳng giỏ hàng (hiện đang trống)
        await page.locator('text=Cart').first().click();

        // Đảm bảo giỏ hàng trống
        await expect(page.locator('text=Cart is empty!')).toBeVisible();

        // 3. Nút Proceed To Checkout không được hiển thị hoặc không thể click
        await expect(page.locator('text=Proceed To Checkout')).not.toBeVisible();
    });
});
