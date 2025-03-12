import crypto from 'crypto';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

function convertToSHA256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

export const handler = async (event, context) => {
  let browser = null;

  console.log('Received event:', JSON.stringify(event, null, 2));
  const urlToVisit = event.url ? event.url : '';
  if (!urlToVisit) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing URL parameter' })
    };
  }
  const huge_json_data = event.huge_json_data ? event.huge_json_data : {};
  
  const prev_hash = huge_json_data && urlToVisit in huge_json_data? huge_json_data[urlToVisit] : '';

  console.log('prev_hash:', prev_hash);

  const updated_hash = {};
  const new_hash = {};
  const deleted_hash = {};
  const list_of_hash = {};

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
        { waitUntil: 'domcontentloaded' }
      );
    } catch (err) {
      console.error('Navigation failed:', err);
    }
    await page.waitForSelector('.TabBar.Document__Tabs');
    console.log('Page loaded');

    let mainTabs = await page.$$('.TabBar.Document__Tabs .TabBar__tab');
    const mainTabCount = mainTabs.length;
    console.log(`Found ${mainTabCount} main tab buttons`);

    for (let i = 0; i < mainTabCount; i++) {
      await page.waitForSelector('.TabBar.Document__Tabs');
      mainTabs = await page.$$('.TabBar.Document__Tabs .TabBar__tab');
      const mainTabButton = mainTabs[i];
      console.log(`Clicking main tab button ${i + 1}...`);

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
        mainTabButton.click(),
      ]);

 

      await page.waitForSelector('.Document__Requirements');

      let subTabs = await page.$$('.Document__Requirements .Document__SubTab');
      const subTabCount = subTabs.length;
      if (!subTabCount){
        const currUrl_Main = page.url();
        console.log(`Main tab loaded: ${currUrl_Main} and doesnt have a subcontent`);
  
        const mainContent = await page.$eval('.Document', el => el.textContent);
        const new_hash_main = convertToSHA256(mainContent);
  
        list_of_hash[currUrl_Main] = new_hash_main;
        if ( !(prev_hash) || !(prev_hash[currUrl_Main]) ) {
          new_hash[currUrl_Main] = new_hash_main;
          console.log('new_hash updated:', new_hash);
        } else if (new_hash_main != prev_hash[currUrl_Main] ) {
          updated_hash[currUrl_Main] = new_hash_main;
          console.log('updated_hash updated:', updated_hash);
        }
      }
      console.log(`Found ${subTabCount} sub-tabs in main tab ${i + 1}`);

      for (let j = 0; j < subTabCount; j++) {
        await page.waitForSelector('.Document__Requirements .Document__SubTab');
        subTabs = await page.$$('.Document__Requirements .Document__SubTab');
        const subTabButton = subTabs[j];
        console.log(`  Clicking sub-tab ${j + 1}...`);

        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
          subTabButton.click(),
        ]);

        const currUrl_subtab = page.url();
        console.log(`  Sub-tab loaded: ${currUrl_subtab}`);

        const subContent = await page.$eval('.Document__Requirements', el => el.textContent);
        const new_hash_subcontent = convertToSHA256(subContent);
        
        list_of_hash[currUrl_subtab] = new_hash_subcontent;
        if (!(prev_hash) || !(prev_hash[currUrl_subtab])) {
          new_hash[currUrl_subtab] = new_hash_subcontent;
        } else if (new_hash_subcontent != prev_hash[currUrl_subtab]) {
          updated_hash[currUrl_subtab] = new_hash_subcontent;
        }

      
        console.log(`  Hash of sub-tab ${j + 1}: ${new_hash_subcontent}\n`);
      }
    }
    await page.close();

    for (const key in prev_hash) {
      if (!(key in list_of_hash)) {
        deleted_hash[key] = prev_hash[key];
      }
    }

    
    return {
      statusCode: 200,
      body: {'main_url': urlToVisit, 'updated_hash': updated_hash, 'new_hash': new_hash, 'deleted_hash': deleted_hash}
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
