import crypto from 'crypto';
import { chromium } from 'playwright';

function convertToSHA256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

export const handler = async (event) => {
  const urlHashMap = {};
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the starting URL
  await page.goto('https://mediatechspecs.disney.com/localization/audio/localized-audio?tab=foreign-supersessions');
  await page.waitForSelector('.TabBar.Document__Tabs');

  // Main tabs
  const mainTabs = page.locator('.TabBar.Document__Tabs button');
  const mainTabCount = await mainTabs.count();
  console.log(`Found ${mainTabCount} main tab buttons`);

  for (let i = 0; i < mainTabCount; i++) {
    await page.waitForSelector('.TabBar.Document__Tabs');
    const mainTabButton = mainTabs.nth(i);
    console.log(`Clicking main tab button ${i + 1}...`);
    await Promise.all([
      page.waitForLoadState('load'),
      mainTabButton.click()
    ]);

    const currUrl_Main = page.url();
    console.log(`Main tab loaded: ${currUrl_Main}`);
    const mainContent = await page.textContent('.Document');
    const hashMain = convertToSHA256(mainContent);
    urlHashMap[currUrl_Main] = hashMain;
    console.log('Sponge Hash of main tab content:\n', mainContent, '\n');
    await page.waitForSelector('.Document__Requirements');

    // Sub-tabs
    const subTabs = page.locator('.Document__Requirements .Document__SubTab');
    const subTabCount = await subTabs.count();
    console.log(`Found ${subTabCount} sub-tabs in main tab ${i + 1}`);

    for (let j = 0; j < subTabCount; j++) {
      await page.waitForSelector('.Document__Requirements .Document__SubTab');
      const subTab = subTabs.nth(j);
      console.log(`  Clicking sub-tab ${j + 1}...`);
      
      await Promise.all([
        page.waitForLoadState('load'),
        subTab.click()
      ]);
      
      const currUrl_subtab = page.url();
      console.log(`  Sub-tab loaded: ${currUrl_subtab}`);
      const subContent = await page.textContent('.Document__Requirements');
      const hash_subcontent = convertToSHA256(subContent);
      console.log(`  Hash of sub-tab ${j+1}: ${hash_subcontent}\n`);
      urlHashMap[currUrl_subtab] = hash_subcontent;

      await Promise.all([
        page.waitForLoadState('load'),
        page.goBack()
      ]);
      await page.waitForSelector('.Document__Requirements .Document__SubTab');
    }

    await Promise.all([
      page.waitForLoadState('load'),
      page.goBack()
    ]);
    await page.waitForSelector('.TabBar.Document__Tabs');
  }

  await browser.close();
  console.log(urlHashMap);

  return {
    statusCode: 200,
    body: JSON.stringify(urlHashMap)
  };
};