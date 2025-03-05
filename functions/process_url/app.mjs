import crypto from 'crypto';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { url } from 'inspector';

function convertToSHA256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

export const handler = async (event, context) => {
  let browser = null;
  const urlHashMap = {};
  console.log('Received event:', JSON.stringify(event, null, 2));
  const urlToVisit = event.url ? event.url : '';
  if (!urlToVisit) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing URL parameter' })
    };
  }
  console.log('Starting program...');
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar'
      ),
      headless: chromium.headless,
    });
    const page = await browser.newPage();

    console.log('Opening page...');
    try {
      await page.goto(
        urlToVisit,
        { waitUntil: 'load' }
      );
    } catch (err) {
      console.error('Navigation failed:', err);
    }
    await page.waitForSelector('.TabBar.Document__Tabs');
    console.log('Page loaded');

    let mainTabs = await page.$$('.TabBar.Document__Tabs button');
    const mainTabCount = mainTabs.length;
    console.log(`Found ${mainTabCount} main tab buttons`);

    for (let i = 0; i < mainTabCount; i++) {
      await page.waitForSelector('.TabBar.Document__Tabs');
      mainTabs = await page.$$('.TabBar.Document__Tabs button');
      const mainTabButton = mainTabs[i];
      console.log(`Clicking main tab button ${i + 1}...`);

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
        mainTabButton.click(),
      ]);

      const currUrl_Main = page.url();
      console.log(`Main tab loaded: ${currUrl_Main}`);

      const mainContent = await page.$eval('.Document', el => el.textContent);
      const hashMain = convertToSHA256(mainContent);
      urlHashMap[currUrl_Main] = hashMain;
      await page.waitForSelector('.Document__Requirements');

      let subTabs = await page.$$('.Document__Requirements .Document__SubTab');
      const subTabCount = subTabs.length;
      console.log(`Found ${subTabCount} sub-tabs in main tab ${i + 1}`);

      for (let j = 0; j < subTabCount; j++) {
        await page.waitForSelector('.Document__Requirements .Document__SubTab');
        subTabs = await page.$$('.Document__Requirements .Document__SubTab');
        const subTab = subTabs[j];
        console.log(`  Clicking sub-tab ${j + 1}...`);

        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
          subTab.click(),
        ]);

        const currUrl_subtab = page.url();
        console.log(`  Sub-tab loaded: ${currUrl_subtab}`);

        const subContent = await page.$eval('.Document__Requirements', el => el.textContent);
        const hash_subcontent = convertToSHA256(subContent);
        console.log(`  Hash of sub-tab ${j + 1}: ${hash_subcontent}\n`);
        urlHashMap[currUrl_subtab] = hash_subcontent;
      }

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.goto(
          urlToVisit,
          { waitUntil: 'load' }
        ),
      ]);
      console.log('Returned to main page:', page.url());
      await page.waitForSelector('.TabBar.Document__Tabs');
    }
    await page.close();
    return {
      statusCode: 200,
      body: JSON.stringify(urlHashMap)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Unknown error' })
    };
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
      console.log('Browser closed');
    }
  }
};
