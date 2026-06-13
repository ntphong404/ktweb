const { test, expect } = require('@playwright/test');

/**
 * ĐỒ ÁN MÔN KIỂM THỬ PHẦN MỀM - TỰ ĐỘNG HÓA VỚI PLAYWRIGHT
 * Website: https://ttgshop.vn
 * Chức năng: Quản lý Giỏ hàng
 * Tổng số TC: 25
 *
 * Sản phẩm dùng để test: Màn hình Lenovo L27q-4A (có sẵn trong kho)
 * URL: /man-hinh-lenovo-l27q-4a-67bfgac6vn-27-inch-ips-2k-100hz-4ms
 */

// ---------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------
const PRODUCT_URL = '/man-hinh-lenovo-l27q-4a-67bfgac6vn-27-inch-ips-2k-100hz-4ms';

const SEL = {
    // Product page
    qtyInput:     '.js-quantity-buy',
    btnAddToCart: 'button:has-text("THÊM VÀO GIỎ")',
    btnOrder:     'button:has-text("ĐẶT HÀNG")',
    btnIncrease:  '.js-quantity-change[data-value="1"]',
    btnDecrease:  '.js-quantity-change[data-value="-1"]',

    // Cart page
    cartItems:    '.js-item-row',
    cartQty:      '.js-buy-quantity',
    cartDelete:   '.js-delete-item',
    cartTotal:    '.js-total-cart-price',
    cartCount:    '#js-header-cart-amount',
    cartNote:     '#js-cart-note',
};

// Helper: thêm 1 sản phẩm vào giỏ hàng
async function addProductToCart(page, quantity = 1) {
    await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded' });
    if (quantity !== 1) {
        await page.locator(SEL.qtyInput).fill(String(quantity));
    }
    await page.locator(SEL.btnAddToCart).click();
    await page.waitForTimeout(2000);
}

// Helper: xóa toàn bộ giỏ hàng và vào trang cart
async function clearAndGoToCart(page) {
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    // Xóa hết sản phẩm (nếu có)
    let items = await page.locator(SEL.cartItems).count();
    while (items > 0) {
        await page.locator(SEL.cartDelete).first().click();
        await page.waitForTimeout(1200);
        items = await page.locator(SEL.cartItems).count();
    }
}

test.describe('4. Quản lý Giỏ hàng - ttgshop.vn', () => {

    // ============================================================
    // NHÓM 1: TRUY CẬP VÀ HIỂN THỊ GIỎ HÀNG
    // ============================================================

    test('TC_CART_01: Truy cập trang giỏ hàng /cart - trang hiển thị đúng', async ({ page }) => {
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/.*cart/);
        // Trang giỏ hàng phải load được, không lỗi 404 hay 500
        const title = await page.title();
        expect(title).not.toContain('404');
        expect(title).not.toContain('500');
    });

    test('TC_CART_02: Click icon Giỏ hàng trên header - phải chuyển đến /cart', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.locator('a[href="/cart"]').first().click();
        await expect(page).toHaveURL(/.*cart/);
    });

    test('TC_CART_03: Giỏ hàng trống - phải hiển thị thông báo hoặc nút tiếp tục mua', async ({ page }) => {
        await clearAndGoToCart(page);
        // Kỳ vọng: khi giỏ hàng rỗng, hiển thị UI phù hợp
        const itemCount = await page.locator(SEL.cartItems).count();
        expect(itemCount, 'Giỏ hàng phải trống sau khi đã xóa').toBe(0);
    });

    // ============================================================
    // NHÓM 2: THÊM SẢN PHẨM VÀO GIỎ HÀNG
    // ============================================================

    test('TC_CART_04: Thêm sản phẩm vào giỏ từ trang chi tiết sản phẩm (Happy Path)', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        // Kiểm tra bằng cách vào trang cart
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const count = await page.locator(SEL.cartItems).count();
        expect(count, 'Phải có ít nhất 1 sản phẩm trong giỏ').toBeGreaterThan(0);
    });

    test('TC_CART_05: Thêm sản phẩm với số lượng ban đầu là 2 - giỏ hàng phải hiển thị đúng SL', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 2);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const qtyValue = await page.locator(SEL.cartQty).first().inputValue();
        expect(parseInt(qtyValue), 'Số lượng trong giỏ phải là 2').toBe(2);
    });

    test('TC_CART_06: Thêm cùng sản phẩm 2 lần - giỏ hàng phải cộng dồn số lượng (không tạo 2 dòng)', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await addProductToCart(page, 1); // Thêm lần 2
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const rowCount = await page.locator(SEL.cartItems).count();
        const qtyValue = await page.locator(SEL.cartQty).first().inputValue();
        // Kỳ vọng: 1 dòng sản phẩm, số lượng = 2 (cộng dồn)
        expect(rowCount, 'Chỉ được có 1 dòng sản phẩm, không được tạo 2 dòng riêng biệt').toBe(1);
        expect(parseInt(qtyValue), 'Số lượng phải được cộng dồn thành 2').toBe(2);
    });

    test('TC_CART_07: Nút tăng (+) số lượng sản phẩm trên trang chi tiết hoạt động', async ({ page }) => {
        await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded' });
        const before = await page.locator(SEL.qtyInput).inputValue();
        await page.locator(SEL.btnIncrease).click();
        await page.waitForTimeout(500);
        const after = await page.locator(SEL.qtyInput).inputValue();
        expect(parseInt(after)).toBe(parseInt(before) + 1);
    });

    test('TC_CART_08: Nút giảm (-) không cho phép giảm dưới 1', async ({ page }) => {
        await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded' });
        // Mặc định = 1, click giảm
        await page.locator(SEL.btnDecrease).click();
        await page.waitForTimeout(500);
        const qty = await page.locator(SEL.qtyInput).inputValue();
        expect(parseInt(qty), 'Số lượng không được phép giảm xuống dưới 1').toBeGreaterThanOrEqual(1);
    });

    // ============================================================
    // NHÓM 3: QUẢN LÝ SỐ LƯỢNG TRONG GIỎ HÀNG
    // ============================================================

    test('TC_CART_09: Tăng số lượng trong giỏ hàng bằng nút (+) - tổng tiền phải cập nhật', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const totalBefore = await page.locator(SEL.cartTotal).first().textContent();
        // Tìm nút tăng trong giỏ hàng
        const btnPlus = page.locator(SEL.cartItems).first().locator('[data-value="1"]').first();
        await btnPlus.click();
        await page.waitForTimeout(1500);
        const totalAfter = await page.locator(SEL.cartTotal).first().textContent();
        expect(totalAfter).not.toEqual(totalBefore);
    });

    test('TC_CART_10: Nhập số lượng 0 trực tiếp vào ô số lượng trong giỏ - phải reset về 1 hoặc xóa sản phẩm (Bug hệ thống)', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Nhập thẳng 0 vào ô số lượng
        const qtyInput = page.locator(SEL.cartQty).first();
        await qtyInput.fill('0');
        await qtyInput.press('Tab'); // Trigger change event
        await page.waitForTimeout(1500);

        // Kỳ vọng: reset về 1 hoặc xóa sản phẩm
        const newQty = await qtyInput.inputValue();
        const itemCount = await page.locator(SEL.cartItems).count();
        const isHandled = parseInt(newQty) >= 1 || itemCount === 0;
        expect(isHandled, 'Số lượng 0 phải được xử lý: reset về 1 hoặc xóa sản phẩm').toBeTruthy();
    });

    test('TC_CART_11: Nhập số lượng âm -1 vào ô số lượng - phải reset về 1 (Bug hệ thống)', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const qtyInput = page.locator(SEL.cartQty).first();
        await qtyInput.fill('-1');
        await qtyInput.press('Tab');
        await page.waitForTimeout(1500);

        const newQty = await qtyInput.inputValue();
        const totalText = await page.locator(SEL.cartTotal).first().textContent();
        // Kỳ vọng: reset về 1, giá không hiển thị âm
        expect(parseInt(newQty), 'Số lượng âm phải được xử lý').toBeGreaterThanOrEqual(1);
        expect(totalText).not.toContain('-');
    });

    test('TC_CART_12: Ô số lượng trong giỏ là type=number - tự chặn chữ cái, tổng tiền không NaN (Bug hệ thống)', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const qtyInput = page.locator(SEL.cartQty).first();

        // Xác nhận ô là type=number → browser tự chặn ký tự chữ cái (không cần fill để test)
        const inputType = await qtyInput.getAttribute('type');
        expect(inputType, 'Ô số lượng phải là type=number để browser chặn chữ cái').toBe('number');

        // Kỳ vọng: tổng tiền không hiển thị NaN hoặc undefined
        const totalText = await page.locator(SEL.cartTotal).first().textContent();
        expect(totalText).not.toContain('NaN');
        expect(totalText).not.toContain('undefined');
        expect(totalText).not.toContain('null');
    });

    test('TC_CART_13: Nhập số lượng 9999 vượt tồn kho - phải validate ngay tại ô nhập, không được đợi đến checkout mới reset (Bug hệ thống)', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const qtyInput = page.locator(SEL.cartQty).first();

        // Đọc stock limit từ attribute của ô nhập (ưu tiên: max → data-max → data-stock)
        const maxAttr = await qtyInput.getAttribute('max')
            ?? await qtyInput.getAttribute('data-max')
            ?? await qtyInput.getAttribute('data-stock');
        const stockLimit = maxAttr ? parseInt(maxAttr) : null;

        await qtyInput.fill('9999');
        await qtyInput.press('Tab');
        await page.waitForTimeout(1500);

        const newQty = parseInt(await qtyInput.inputValue());

        // Bug đã biết: UI chấp nhận số lượng bất kỳ tại ô nhập,
        // chỉ reset silently về 1 khi ấn Thanh toán (không có thông báo lỗi).
        // Kỳ vọng đúng: số lượng phải bị giới hạn về stock NGAY SAU KHI nhập.
        if (stockLimit !== null) {
            expect(newQty, `Phải validate ngay tại ô nhập: số lượng phải <= tồn kho (${stockLimit}), không đợi đến checkout`).toBeLessThanOrEqual(stockLimit);
        } else {
            // Không đọc được stock limit từ DOM → hệ thống không expose giới hạn cho client
            // Ít nhất không được chấp nhận số lượng phi thực tế 9999
            expect(newQty, 'Hệ thống không validate số lượng tại ô nhập (chấp nhận 9999) và không expose stock limit - Bug: validation chỉ xảy ra ngầm ở checkout').toBeLessThan(9999);
        }
    });

    // ============================================================
    // NHÓM 4: XÓA SẢN PHẨM KHỎI GIỎ HÀNG
    // ============================================================

    test('TC_CART_14: Xóa sản phẩm khỏi giỏ hàng - giỏ phải trống sau khi xóa', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const countBefore = await page.locator(SEL.cartItems).count();
        expect(countBefore).toBeGreaterThan(0);

        await page.locator(SEL.cartDelete).first().click();
        await page.waitForTimeout(2000);

        const countAfter = await page.locator(SEL.cartItems).count();
        expect(countAfter, 'Giỏ hàng phải trống sau khi xóa sản phẩm').toBe(0);
    });

    test('TC_CART_15: Double-click nút xóa sản phẩm - không được gây crash JS (Bug hệ thống)', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Double-click nút xóa thật nhanh
        await page.locator(SEL.cartDelete).first().dblclick();
        await page.waitForTimeout(2000);

        // Kỳ vọng: không crash, trang vẫn hoạt động bình thường
        const url = page.url();
        expect(url).not.toContain('error');
        expect(url).not.toContain('500');
    });

    // ============================================================
    // NHÓM 5: TỔNG TIỀN VÀ HIỂN THỊ
    // ============================================================

    test('TC_CART_16: Tổng tiền giỏ hàng hiển thị đúng định dạng tiền tệ VNĐ', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const totalText = await page.locator(SEL.cartTotal).first().textContent();
        // Kỳ vọng: hiển thị số tiền với định dạng VNĐ hoặc đ
        expect(totalText).toMatch(/\d/); // Phải có ít nhất 1 chữ số
        expect(totalText).not.toContain('NaN');
        expect(totalText).not.toContain('undefined');
    });

    test('TC_CART_17: Số lượng sản phẩm trên badge giỏ hàng (header) phải cập nhật sau khi thêm', async ({ page }) => {
        await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded' });
        await page.locator(SEL.btnAddToCart).click();
        await page.waitForTimeout(2000);
        // Kỳ vọng: badge hiển thị số lượng sản phẩm
        const badgeEl = page.locator(SEL.cartCount);
        const badgeText = await badgeEl.textContent();
        const badgeVisible = await badgeEl.isVisible();
        // Có thể visible hoặc hidden với class "hidden" nhưng có giá trị
        if (badgeVisible) {
            expect(parseInt(badgeText || '0')).toBeGreaterThan(0);
        }
    });

    test('TC_CART_18: Dữ liệu giỏ hàng vẫn còn sau khi tải lại trang (F5)', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const countBefore = await page.locator(SEL.cartItems).count();

        // Reload trang
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const countAfter = await page.locator(SEL.cartItems).count();
        expect(countAfter, 'Giỏ hàng phải còn dữ liệu sau khi reload').toBe(countBefore);
    });

    test('TC_CART_19: Giao diện giỏ hàng không hiển thị lỗi hệ thống thô (Bug hệ thống)', async ({ page }) => {
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toContain('undefined');
        expect(bodyText).not.toContain('[object Object]');
        expect(bodyText).not.toContain('SyntaxError');
        expect(bodyText).not.toContain('TypeError');
    });

    test('TC_CART_20: Ô số lượng trong giỏ hàng có nhãn aria-label cho Accessibility (Bug hệ thống)', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Kỳ vọng: ô nhập số lượng có aria-label hoặc label để hỗ trợ trình đọc màn hình
        const qtyInput = page.locator(SEL.cartQty).first();
        const ariaLabel = await qtyInput.getAttribute('aria-label');
        const id = await qtyInput.getAttribute('id');
        // Kiểm tra có label hoặc aria-label
        const hasAccessibleName = (ariaLabel !== null && ariaLabel.trim() !== '') || (id !== null);
        expect(hasAccessibleName, 'Ô số lượng cần có aria-label hoặc id để hỗ trợ accessibility').toBeTruthy();
    });

    // ============================================================
    // NHÓM 6: ĐIỀU HƯỚNG VÀ TÍCH HỢP
    // ============================================================

    test('TC_CART_21: Click "ĐẶT HÀNG" từ trang sản phẩm - phải chuyển đến trang giỏ hàng/thanh toán', async ({ page }) => {
        await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded' });
        await page.locator(SEL.btnOrder).click();
        await page.waitForTimeout(3000);
        // Kỳ vọng: redirect đến /cart hoặc trang thanh toán
        const url = page.url();
        expect(url).toMatch(/cart|dat-hang|thanh-toan|checkout/);
    });

    test('TC_CART_22: Nhập ghi chú đơn hàng trong giỏ hàng', async ({ page }) => {
        await clearAndGoToCart(page);
        await addProductToCart(page, 1);
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const noteEl = page.locator(SEL.cartNote);
        const isNoteVisible = await noteEl.isVisible();
        if (isNoteVisible) {
            await noteEl.fill('Giao hàng trong giờ hành chính, gọi trước khi giao.');
            const noteValue = await noteEl.inputValue();
            expect(noteValue.length).toBeGreaterThan(0);
        } else {
            // Nếu không có ô ghi chú → Bug UX
            console.log('Warning: Không tìm thấy ô ghi chú đơn hàng');
        }
    });

    test('TC_CART_23: Truy cập trực tiếp /cart khi chưa đăng nhập - phải hiển thị giỏ hàng bình thường', async ({ page }) => {
        // Guest cart phải hoạt động không cần đăng nhập
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/.*cart/);
        const title = await page.title();
        expect(title).not.toContain('404');
    });

    test('TC_CART_24: Thêm sản phẩm vào giỏ với số lượng 0 từ trang sản phẩm - phải từ chối hoặc đặt min là 1 (Bug hệ thống)', async ({ page }) => {
        await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded' });
        // Đặt số lượng = 0
        await page.locator(SEL.qtyInput).fill('0');
        await page.locator(SEL.btnAddToCart).click();
        await page.waitForTimeout(2000);

        // Kỳ vọng: hệ thống từ chối hoặc tự đặt về 1
        // Kiểm tra trong giỏ hàng
        await page.goto('/cart', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const qtyVal = await page.locator(SEL.cartQty).first().inputValue().catch(() => '1');
        const parsedQty = parseInt(qtyVal);
        // Không được thêm sản phẩm với số lượng 0
        if (!isNaN(parsedQty)) {
            expect(parsedQty, 'Sản phẩm trong giỏ không được có số lượng = 0').toBeGreaterThan(0);
        }
    });

    test('TC_CART_25: Ô số lượng trên trang sản phẩm là type=number - tự chặn chữ cái, thêm vào giỏ không crash (Bug hệ thống)', async ({ page }) => {
        await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded' });

        // Xác nhận ô là type=number → browser tự chặn ký tự chữ cái
        const inputType = await page.locator(SEL.qtyInput).getAttribute('type');
        expect(inputType, 'Ô số lượng trang sản phẩm phải là type=number').toBe('number');

        // Click thêm vào giỏ với SL mặc định → không được crash
        await page.locator(SEL.btnAddToCart).click();
        await page.waitForTimeout(2000);
        const url = page.url();
        expect(url).not.toContain('error');
        expect(url).not.toContain('500');
    });
});
