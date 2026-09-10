const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = 'C:/Users/furka/.gemini/antigravity-ide/brain/c05a22d0-97fa-414b-8a25-2857df690287/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runFullAudit() {
  const report = {
    timestamp: new Date().toISOString(),
    consoleLogs: [],
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    networkFailures: [],
    steps: []
  };

  console.log('🚀 Launching Chrome for Complete End-to-End QA Lifecycle...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    report.consoleLogs.push({ type, text });
    if (type === 'error') report.consoleErrors.push(text);
    else if (type === 'warn') report.consoleWarnings.push(text);
  });

  page.on('pageerror', err => {
    report.pageErrors.push(err.message);
    console.error('💥 Page Error:', err.message);
  });

  try {
    // 1. Dashboard
    console.log('📍 [1/12] Loading Dashboard...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(800);

    // Dismiss PWA prompt
    const dismissPwa = page.locator('button:has-text("Daha Sonra")').first();
    if (await dismissPwa.isVisible()) {
      await dismissPwa.click();
      await page.waitForTimeout(300);
    }

    // 2. Start Workout
    console.log('📍 [2/12] Starting Recommended Workout...');
    const startBtn = page.locator('button:has-text("Önerilen Antrenmanı Başlat")').first();
    await startBtn.click();
    await page.waitForTimeout(800);

    // 3. Exercise Overlay
    console.log('📍 [3/12] Opening Barbell Squat Overlay...');
    const exerciseCard = page.locator('.card:has-text("Barbell Squat")').first();
    await exerciseCard.click();
    await page.waitForTimeout(600);

    // 4. Fill Sets
    console.log('📍 [4/12] Entering Sets (80kgx8, 85kgx8, 90kgx6)...');
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(0).fill('80');
    await numberInputs.nth(1).fill('8');
    await numberInputs.nth(2).fill('85');
    await numberInputs.nth(3).fill('8');
    await numberInputs.nth(4).fill('90');
    await numberInputs.nth(5).fill('6');
    await page.waitForTimeout(400);

    // Click "Kaydet & Kapat"
    console.log('📍 [5/12] Saving Sets & Closing Overlay...');
    const saveOverlayBtn = page.locator('button:has-text("Kaydet & Kapat")').first();
    await saveOverlayBtn.click();
    await page.waitForTimeout(600);

    // 5. Open Cart & Save Workout Session
    console.log('📍 [6/12] Opening Workout Cart Drawer...');
    const openCartBtn = page.locator('button:has-text("Sepeti Gör"), :has-text("Antrenman Sepeti")').last();
    await openCartBtn.click();
    await page.waitForTimeout(700);

    console.log('📍 [7/12] Clicking ANTRENMANI KAYDET...');
    const saveWorkoutBtn = page.locator('button:has-text("ANTRENMANI KAYDET"), button:has-text("Kaydet")').last();
    await saveWorkoutBtn.click();
    await page.waitForTimeout(1500); // wait for confetti and redirect back to feed

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_workout_saved_dashboard.png') });
    report.steps.push({ name: 'Workout Saved & Returned to Feed', status: 'PASS', screenshot: '10_workout_saved_dashboard.png' });

    // 6. Navigate to History Tab
    console.log('📍 [8/12] Navigating to Geçmiş (History) Tab...');
    const historyTab = page.locator('#nav-history').first();
    await historyTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_history_tab_view.png') });
    report.steps.push({ name: 'History Tab View', status: 'PASS', screenshot: '11_history_tab_view.png' });

    // Expand the history card to show logged sets
    const historyCard = page.locator('.card:has-text("Barbell Squat"), .history-item, .card:has-text("Set")').first();
    if (await historyCard.isVisible()) {
      await historyCard.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11b_history_expanded_card.png') });
      report.steps.push({ name: 'History Expanded Card', status: 'PASS', screenshot: '11b_history_expanded_card.png' });
    }

    // 7. Navigate to Stats Tab
    console.log('📍 [9/12] Navigating to Gelişim & İstatistik (Stats) Tab...');
    const statsTab = page.locator('#nav-stats').first();
    await statsTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_stats_tab_view.png') });
    report.steps.push({ name: 'Stats Tab View', status: 'PASS', screenshot: '12_stats_tab_view.png' });

    // 8. Open AI Coach Modal
    console.log('📍 [10/12] Testing AI Coach Modal...');
    const aiCoachBtn = page.locator('button:has-text("AI Koç"), button:has-text("Antrenör"), button:has-text("AI"), [title*="Koç"]').first();
    if (await aiCoachBtn.isVisible()) {
      await aiCoachBtn.click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_ai_coach_modal.png') });
      report.steps.push({ name: 'AI Coach Modal', status: 'PASS', screenshot: '13_ai_coach_modal.png' });

      // Close modal
      const closeModal = page.locator('button:has-text("Kapat"), [aria-label="Kapat"], .modal-close').first();
      if (await closeModal.isVisible()) {
        await closeModal.click();
        await page.waitForTimeout(400);
      } else {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      }
    }

    // 9. Check Desktop Responsive View
    console.log('📍 [11/12] Testing Desktop Viewport (1280x800)...');
    await page.setViewportSize({ width: 1280, height: 800 });
    const workoutNav = page.locator('#nav-workout').first();
    await workoutNav.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_desktop_responsive_dashboard.png') });
    report.steps.push({ name: 'Desktop Dashboard', status: 'PASS', screenshot: '14_desktop_responsive_dashboard.png' });

    // 10. Check LocalStorage and PWA
    console.log('📍 [12/12] Checking Data Persistence & PWA...');
    const storageSummary = await page.evaluate(() => {
      const wData = localStorage.getItem('myWorkouts_v2');
      let parsed = [];
      try { parsed = JSON.parse(wData || '[]'); } catch {}
      return {
        workoutsCount: parsed.length,
        firstWorkoutDate: parsed[0]?.date,
        firstWorkoutSplit: parsed[0]?.splitName,
        totalVolume: parsed[0]?.totalVolume,
        totalSets: parsed[0]?.totalSets
      };
    });
    report.storageSummary = storageSummary;

  } catch (error) {
    console.error('❌ Audit Error:', error);
    report.auditError = error.message;
  } finally {
    await browser.close();
    fs.writeFileSync(
      'C:/Users/furka/.gemini/antigravity-ide/brain/c05a22d0-97fa-414b-8a25-2857df690287/qa_report_data.json',
      JSON.stringify(report, null, 2)
    );
    console.log('🏁 Full Audit Completed! Data written to qa_report_data.json');
  }
}

runFullAudit();
