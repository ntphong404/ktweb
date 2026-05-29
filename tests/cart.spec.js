const { test, expect } = require('@playwright/test');

/**
 * ĐỒ ÁN MÔN KIỂM THỬ PHẦN MỀM - TỰ ĐỘNG HÓA VỚI PLAYWRIGHT
 * Chức năng: Products & Cart Management
 */

test.describe('2. Products & Cart Management (Quản lý giỏ hàng)', () => {
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
        await page.goto('https://automationexercise.com/products', { waitUntil: 'domcontentloaded' });
    });

    test('TC_CART_01: Thêm sản phẩm vào giỏ hàng thành công', async ({ page }) => {
        // Hover và click thêm sản phẩm đầu tiên
        const firstProduct = page.locator('.single-products').first();
        await firstProduct.hover();
        await firstProduct.locator('.add-to-cart').first().click();

        // Xử lý Modal Popup
        await expect(page.locator('text=Added!')).toBeVisible();
        await page.locator('text=Continue Shopping').click();

        // Vào giỏ hàng kiểm tra
        await page.locator('text=Cart').first().click();
        await expect(page.locator('#cart_info')).toBeVisible();

        // Cột quantity phải là 1
        await expect(page.locator('.cart_quantity').first()).toHaveText('1');
    });

    test('TC_CART_02: Tùy chỉnh số lượng sản phẩm từ trang chi tiết', async ({ page }) => {
        // Click vào View Product của sản phẩm đầu tiên
        await page.locator('text=View Product').first().click();

        // Đợi trang chi tiết tải xong hoàn toàn các file Script (chống lỗi Race Condition)
        await page.waitForLoadState('networkidle');

        // Đổi số lượng thành 4
        await page.locator('#quantity').fill('4');

        // Chờ thêm một chút xíu để chắc chắn nút Add to cart đã sẵn sàng nhận lệnh click
        await page.waitForTimeout(1000);
        await page.locator('button:has-text("Add to cart")').click();

        // Đi tới giỏ hàng từ popup
        await expect(page.locator('text=Added!')).toBeVisible();
        await page.locator('text=View Cart').click();

        // Xác nhận số lượng trong giỏ
        await expect(page.locator('.cart_quantity').first()).toContainText('4');
    });

    test('TC_CART_03: Xóa sản phẩm khỏi giỏ hàng', async ({ page }) => {
        // Thêm sản phẩm vào giỏ hàng trước
        const firstProduct = page.locator('.single-products').first();
        await firstProduct.hover();
        await firstProduct.locator('.add-to-cart').first().click();
        await page.locator('text=View Cart').click();

        // Bấm nút xóa (dấu X màu đỏ)
        await page.locator('.cart_quantity_delete').first().click();

        // Kiểm tra giỏ hàng trống
        await expect(page.locator('text=Cart is empty!')).toBeVisible();
    });

    test('TC_CART_SEC_01: Thử tấn công XSS vào ô tìm kiếm sản phẩm (Negative Test)', async ({ page }) => {
        // Thử nhập mã độc XSS
        const xssPayload = "<script>alert('Hacked')</script>";
        await page.locator('#search_product').fill(xssPayload);
        await page.locator('#submit_search').click();

        // Kiểm tra xem hệ thống có xử lý an toàn chuỗi nhập vào hay không (không được chạy script)
        await expect(page.locator('text=SEARCHED PRODUCTS')).toBeVisible();
        // Kiểm tra DOM xem payload có bị render thẳng ra không
        const pageSource = await page.content();
        expect(pageSource).not.toContain("<script>alert('Hacked')</script>");
    });
});
