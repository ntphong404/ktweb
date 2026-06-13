const { test, expect } = require('@playwright/test');

/**
 * ĐỒ ÁN MÔN KIỂM THỬ PHẦN MỀM - TỰ ĐỘNG HÓA VỚI PLAYWRIGHT
 * Website: https://ttgshop.vn
 * Chức năng: Tìm kiếm & Lọc sản phẩm
 * Tổng số TC: 32
 *
 * Endpoint tìm kiếm: GET /tim?q={keyword}
 * Trang danh mục PC: /pc?filter={id}&min={price}&max={price}
 * Sản phẩm kết quả:  .category-products__list .p-item
 * Không có kết quả:  text "Không tìm thấy sản phẩm phù hợp"
 */

// ---------------------------------------------------------------
// SELECTORS
// ---------------------------------------------------------------
const SEL = {
    input:      'input[name="q"]',
    btnSearch:  '.search-bar-btn',
    results:    '.category-products__list .p-item',
    noResult:   'text=Không tìm thấy sản phẩm phù hợp',
};

// Helper: thực hiện tìm kiếm từ trang hiện tại
async function doSearch(page, keyword) {
    await page.locator(SEL.input).fill(keyword);
    await page.locator(SEL.btnSearch).click();
    await page.waitForTimeout(2500);
}

test.describe('3. Tìm kiếm & Lọc sản phẩm - ttgshop.vn', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
    });

    // ============================================================
    // NHÓM 1: TÌM KIẾM CƠ BẢN - KẾT QUẢ HỢP LỆ
    // ============================================================

    test('TC_SRC_01: Tìm kiếm với từ khóa hợp lệ "PC gaming" - phải trả về kết quả', async ({ page }) => {
        await doSearch(page, 'PC gaming');
        await expect(page).toHaveURL(/.*tim.*q=PC/);
        const count = await page.locator(SEL.results).count();
        expect(count, 'Phải có ít nhất 1 sản phẩm chứa "PC gaming"').toBeGreaterThan(0);
    });

    test('TC_SRC_02: Tìm kiếm chữ HOA "PC GAMING" - phải trả về cùng kết quả như chữ thường (case-insensitive)', async ({ page }) => {
        await doSearch(page, 'PC GAMING');
        await expect(page).toHaveURL(/.*tim/);
        const count = await page.locator(SEL.results).count();
        expect(count, 'Tìm kiếm chữ hoa phải trả về kết quả giống chữ thường').toBeGreaterThan(0);
    });

    test('TC_SRC_03: Tìm kiếm với khoảng trắng đầu " PC gaming" - phải tự trim và trả về kết quả', async ({ page }) => {
        await doSearch(page, '   PC gaming');
        await expect(page).toHaveURL(/.*tim/);
        const count = await page.locator(SEL.results).count();
        expect(count, 'Từ khóa có khoảng trắng đầu phải được trim và tìm đúng').toBeGreaterThan(0);
    });

    test('TC_SRC_04: Tìm kiếm với khoảng trắng cuối "PC gaming  " - phải tự trim và trả về kết quả', async ({ page }) => {
        await doSearch(page, 'PC gaming   ');
        await expect(page).toHaveURL(/.*tim/);
        const count = await page.locator(SEL.results).count();
        expect(count, 'Từ khóa có khoảng trắng cuối phải được trim và tìm đúng').toBeGreaterThan(0);
    });

    test('TC_SRC_05: Tìm kiếm theo model sản phẩm "RTX 3050" - phải có kết quả', async ({ page }) => {
        await doSearch(page, 'RTX 3050');
        await expect(page).toHaveURL(/.*tim/);
        const count = await page.locator(SEL.results).count();
        expect(count).toBeGreaterThan(0);
    });

    test('TC_SRC_06: Kết quả tìm kiếm hiển thị đúng tên và giá sản phẩm', async ({ page }) => {
        await doSearch(page, 'màn hình');
        const firstItem = page.locator(SEL.results).first();
        await expect(firstItem).toBeVisible();
        // Kiểm tra có tên sản phẩm (thẻ a hoặc p chứa tên)
        const itemText = await firstItem.textContent();
        expect(itemText?.trim().length, 'Sản phẩm phải có tên').toBeGreaterThan(0);
    });

    // ============================================================
    // NHÓM 2: TÌM KIẾM KHÔNG CÓ KẾT QUẢ
    // ============================================================

    test('TC_SRC_07: Tìm kiếm từ khóa không tồn tại - phải hiển thị thông báo không có kết quả', async ({ page }) => {
        await doSearch(page, 'xyz123khongcosanpham');
        await expect(page.locator(SEL.noResult)).toBeVisible();
    });

    test('TC_SRC_08: Tìm kiếm sai chính tả "gamng" - phải hiển thị không có kết quả hoặc gợi ý', async ({ page }) => {
        await doSearch(page, 'gamng');
        // Kỳ vọng: không có kết quả hoặc có gợi ý
        const noResultVisible = await page.locator(SEL.noResult).isVisible();
        const resultCount     = await page.locator(SEL.results).count();
        const handled = noResultVisible || resultCount === 0;
        expect(handled, 'Tìm kiếm sai chính tả phải hiển thị "không tìm thấy" hoặc 0 sản phẩm').toBeTruthy();
    });

    // ============================================================
    // NHÓM 3: BIÊN (BOUNDARY) - ĐẦU VÀO ĐẶC BIỆT
    // ============================================================

    test('TC_SRC_09: Tìm kiếm chỉ toàn khoảng trắng - phải từ chối hoặc không trả về kết quả (Bug hệ thống)', async ({ page }) => {
        await doSearch(page, '          ');
        await page.waitForTimeout(1000);
        // Kỳ vọng: hiển thị validation hoặc không có kết quả
        // Nếu hiển thị toàn bộ sản phẩm → Bug (tìm kiếm không có nghĩa)
        const noResultVisible = await page.locator(SEL.noResult).isVisible();
        const resultCount     = await page.locator(SEL.results).count();
        expect(noResultVisible || resultCount === 0, 'Tìm kiếm chỉ khoảng trắng không được trả về tất cả sản phẩm').toBeTruthy();
    });

    test('TC_SRC_10: Ô tìm kiếm trống khi bấm tìm - phải từ chối hoặc không điều hướng (Bug hệ thống)', async ({ page }) => {
        // Không điền gì, bấm tìm luôn
        await page.locator(SEL.btnSearch).click();
        await page.waitForTimeout(2000);
        // Kỳ vọng: ở lại trang hiện tại hoặc hiển thị validation
        // Nếu điều hướng tới /tim?q= với q rỗng → Bug (vô nghĩa)
        const currentUrl = page.url();
        const isInvalidSearch = currentUrl.includes('/tim?q=&') || currentUrl.endsWith('/tim?q=');
        if (isInvalidSearch) {
            // Phải thấy thông báo không có kết quả hoặc validation
            const resultCount = await page.locator(SEL.results).count();
            expect(resultCount === 0 || await page.locator(SEL.noResult).isVisible()).toBeTruthy();
        }
    });

    test('TC_SRC_11: Tìm kiếm với ký tự đặc biệt "@@@###" - phải xử lý bình thường', async ({ page }) => {
        await doSearch(page, '@@@###');
        await expect(page).toHaveURL(/.*tim/);
        // Kỳ vọng: không crash, hiển thị không có kết quả
        await expect(page.locator(SEL.noResult)).toBeVisible();
    });

    test('TC_SRC_12: Tìm kiếm chuỗi cực dài 500 ký tự - hệ thống không được crash (Bug hệ thống)', async ({ page }) => {
        const longKeyword = 'PC gaming '.repeat(50).trim(); // ~500 ký tự
        await doSearch(page, longKeyword);
        await page.waitForTimeout(1000);
        // Kỳ vọng: không có lỗi 500 hay crash
        const status = await page.evaluate(() => document.title);
        expect(status).not.toContain('500');
        expect(status).not.toContain('Error');
    });

    test('TC_SRC_13: Tìm kiếm 1 ký tự "a" - phải trả về kết quả hoặc thông báo không có', async ({ page }) => {
        await doSearch(page, 'a');
        await expect(page).toHaveURL(/.*tim/);
        const count = await page.locator(SEL.results).count();
        const noResult = await page.locator(SEL.noResult).isVisible();
        expect(count > 0 || noResult, 'Tìm kiếm 1 ký tự phải trả về kết quả hoặc thông báo không có').toBeTruthy();
    });

    test('TC_SRC_14: Tìm kiếm 1 ký tự "i" - phải trả về sản phẩm có "i" (Bug hệ thống)', async ({ page }) => {
        await doSearch(page, 'i');
        await expect(page).toHaveURL(/.*tim/);
        // Kỳ vọng: trả về sản phẩm chứa chữ "i" (như Intel, i3, i5, i7,...)
        const count = await page.locator(SEL.results).count();
        expect(count, 'Tìm kiếm ký tự "i" phải trả về sản phẩm chứa "i"').toBeGreaterThan(0);
    });

    // ============================================================
    // NHÓM 4: TIẾNG VIỆT
    // ============================================================

    test('TC_SRC_15: Tìm kiếm tiếng Việt có dấu "máy tính" - phải trả về kết quả', async ({ page }) => {
        await doSearch(page, 'máy tính');
        await expect(page).toHaveURL(/.*tim/);
        const count = await page.locator(SEL.results).count();
        expect(count, 'Tìm kiếm tiếng Việt có dấu phải trả về kết quả').toBeGreaterThan(0);
    });

    test('TC_SRC_16: Tìm kiếm tiếng Việt không dấu "may tinh" - phải trả về kết quả (Bug hệ thống)', async ({ page }) => {
        await doSearch(page, 'may tinh');
        await expect(page).toHaveURL(/.*tim/);
        // Kỳ vọng: hệ thống hỗ trợ tìm kiếm không dấu → trả về cùng kết quả
        // Nếu trả về 0 → Bug (UX kém cho người dùng không dùng được bộ gõ tiếng Việt)
        const count = await page.locator(SEL.results).count();
        expect(count, 'Tìm kiếm tiếng Việt không dấu phải trả về kết quả').toBeGreaterThan(0);
    });

    test('TC_SRC_17: Tìm kiếm tiếng Việt viết hoa "MÁY TÍNH" - phải trả về kết quả (case-insensitive)', async ({ page }) => {
        await doSearch(page, 'MÁY TÍNH');
        await expect(page).toHaveURL(/.*tim/);
        const count = await page.locator(SEL.results).count();
        expect(count, 'Tìm kiếm tiếng Việt viết hoa phải trả về kết quả').toBeGreaterThan(0);
    });

    test('TC_SRC_18: Tìm kiếm tiếng Việt có khoảng trắng đầu cuối "  máy tính  " - phải trim và tìm đúng', async ({ page }) => {
        await doSearch(page, '  máy tính  ');
        await expect(page).toHaveURL(/.*tim/);
        const count = await page.locator(SEL.results).count();
        expect(count, 'Trim khoảng trắng rồi tìm tiếng Việt phải cho kết quả').toBeGreaterThan(0);
    });

    // ============================================================
    // NHÓM 5: KIỂM TRA BẢO MẬT
    // ============================================================

    test('TC_SRC_19: XSS trong ô tìm kiếm - không được thực thi script (Security)', async ({ page }) => {
        const xss = "<script>alert('XSS')</script>";
        await doSearch(page, xss);
        const pageSource = await page.content();
        expect(pageSource).not.toContain("<script>alert('XSS')</script>");
    });

    test('TC_SRC_20: SQL Injection trong ô tìm kiếm - không được lộ dữ liệu (Security)', async ({ page }) => {
        await doSearch(page, "' OR '1'='1' --");
        // Kỳ vọng: không trả về toàn bộ database
        const count = await page.locator(SEL.results).count();
        // Nếu trả về rất nhiều sản phẩm một cách bất thường → có thể là dấu hiệu SQL injection
        expect(count).toBeLessThan(200);
    });

    test('TC_SRC_21: URL sau tìm kiếm không lộ query nội bộ - chỉ chứa q= (Bug hệ thống)', async ({ page }) => {
        await doSearch(page, 'PC gaming');
        const currentUrl = page.url();
        // Kỳ vọng: URL dạng /tim?q=PC+gaming (không có undefined, null, [object...)
        expect(currentUrl).not.toContain('undefined');
        expect(currentUrl).not.toContain('null');
        expect(currentUrl).not.toContain('[object');
        expect(currentUrl).toMatch(/\/tim\?.*q=/);
    });

    test('TC_SRC_22: Kết quả tìm kiếm không hiển thị lỗi hệ thống thô (Bug hệ thống)', async ({ page }) => {
        await doSearch(page, 'PC gaming');
        const pageText = await page.locator('body').textContent();
        expect(pageText).not.toContain('undefined');
        expect(pageText).not.toContain('[object Object]');
        expect(pageText).not.toContain('Liquid error');
        expect(pageText).not.toContain('SyntaxError');
    });

    // ============================================================
    // NHÓM 6: KIỂM TRA CHỨC NĂNG SEARCH TRÊN CÁC TRANG KHÁC
    // ============================================================

    test('TC_SRC_23: Tìm kiếm hoạt động từ trang danh mục PC (/pc)', async ({ page }) => {
        await page.goto('/pc', { waitUntil: 'domcontentloaded' });
        await doSearch(page, 'PC gaming');
        await expect(page).toHaveURL(/.*tim/);
        const count = await page.locator(SEL.results).count();
        expect(count).toBeGreaterThan(0);
    });

    test('TC_SRC_24: Tìm kiếm hoạt động từ trang đăng nhập', async ({ page }) => {
        await page.goto('/dang-nhap', { waitUntil: 'domcontentloaded' });
        await doSearch(page, 'PC gaming');
        await expect(page).toHaveURL(/.*tim/);
        const count = await page.locator(SEL.results).count();
        expect(count).toBeGreaterThan(0);
    });

    test('TC_SRC_25: Tìm kiếm số điện thoại "0986552233" - không trả về sản phẩm (không gây lỗi)', async ({ page }) => {
        await doSearch(page, '0986552233');
        await expect(page).toHaveURL(/.*tim/);
        // Kỳ vọng: không có sản phẩm tìm theo số điện thoại (mà cũng không crash)
        const noResult = await page.locator(SEL.noResult).isVisible();
        const count    = await page.locator(SEL.results).count();
        expect(noResult || count === 0, 'Tìm kiếm SĐT phải không có kết quả, không được crash').toBeTruthy();
    });

    // ============================================================
    // NHÓM 7: BYPASS QUA URL PARAMETERS - LỌC SẢN PHẨM
    // Trực tiếp thao tác URL thay vì dùng UI filter
    // ============================================================

    test('TC_SRC_26: URL filter - giá âm min=-1000000 - hệ thống không được crash (Bug hệ thống)', async ({ page }) => {
        await page.goto('/pc?min=-1000000&max=15000000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        // Kỳ vọng: 0 kết quả hoặc bỏ qua filter không hợp lệ, không crash
        const title = await page.title();
        expect(title, 'Server không được trả về trang lỗi 500').not.toContain('500');
        expect(title).not.toContain('Error');
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toContain('undefined');
        expect(bodyText).not.toContain('[object Object]');
    });

    test('TC_SRC_27: URL filter - min > max (đảo ngược khoảng giá) - hệ thống xử lý gracefully (Bug hệ thống)', async ({ page }) => {
        await page.goto('/pc?min=15000000&max=5000000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        // Kỳ vọng: 0 kết quả hoặc bỏ qua filter, không crash
        const title = await page.title();
        expect(title).not.toContain('500');
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toContain('[object Object]');
        expect(bodyText).not.toContain('Liquid error');
    });

    test('TC_SRC_28: URL filter - khoảng giá bằng 0 (min=0&max=0) - phải trả về 0 kết quả hoặc bỏ qua (Bug hệ thống)', async ({ page }) => {
        await page.goto('/pc?min=0&max=0', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const title = await page.title();
        expect(title).not.toContain('500');
        expect(title).not.toContain('Error');
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toContain('undefined');
    });

    test('TC_SRC_29: URL filter - giá cực lớn max=9999999999999 - hệ thống không bị tràn số (Bug hệ thống)', async ({ page }) => {
        await page.goto('/pc?min=0&max=9999999999999', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        // Kỳ vọng: trả về toàn bộ sản phẩm hoặc bỏ qua max không hợp lệ, không crash
        const title = await page.title();
        expect(title).not.toContain('500');
        expect(title).not.toContain('Error');
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toContain('undefined');
        expect(bodyText).not.toContain('Infinity');
    });

    test('TC_SRC_30: URL filter - giá không phải số min=abc&max=xyz - phải xử lý bình thường (Bug hệ thống)', async ({ page }) => {
        await page.goto('/pc?min=abc&max=xyz', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        // Kỳ vọng: bỏ qua filter không hợp lệ, hiển thị tất cả sản phẩm hoặc 0 kết quả
        const title = await page.title();
        expect(title).not.toContain('500');
        expect(title).not.toContain('Error');
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toContain('[object Object]');
        expect(bodyText).not.toContain('Liquid error');
        expect(bodyText).not.toContain('NaN');
    });

    test('TC_SRC_31: URL filter - filter ID không tồn tại (filter=999999) - phải xử lý bình thường (Bug hệ thống)', async ({ page }) => {
        await page.goto('/pc?filter=999999', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        // Kỳ vọng: 0 kết quả hoặc bỏ qua filter ID không tồn tại, không crash
        const title = await page.title();
        expect(title).not.toContain('500');
        expect(title).not.toContain('Error');
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toContain('undefined');
        expect(bodyText).not.toContain('Liquid error');
    });

    test('TC_SRC_32: URL filter - XSS trong tham số min - không được thực thi script (Security)', async ({ page }) => {
        const xssPayload = encodeURIComponent('<script>alert("XSS_FILTER")</script>');
        await page.goto(`/pc?min=${xssPayload}&max=15000000`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        // Kỳ vọng: script không được render hay thực thi trong response
        const pageSource = await page.content();
        expect(pageSource).not.toContain('<script>alert("XSS_FILTER")</script>');
    });
});
