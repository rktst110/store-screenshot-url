import { Actor, log } from "apify";
import { sleep, PuppeteerCrawler } from "crawlee";

import { parseInput } from "./parseInput.js";

import type { Input } from "./types.js";
import { calculateRequestHandlerTimeoutSecs, generateUrlStoreKey } from "./utils.js";

//manually importing BrowserName, DeviceCategory, OperatingSystemsName on 20-Jan-2024
import { BrowserName, DeviceCategory, OperatingSystemsName  } from '@crawlee/browser-pool';

const { APIFY_DEFAULT_KEY_VALUE_STORE_ID } = process.env;

const NAVIGATION_TIMEOUT_SECS = 3600;
const TIMEOUT_MS = 3600000;

await Actor.init();
const input = (await Actor.getInput()) as Input;

const {
    urls,
    waitUntil,
    delay,
    width,
    scrollToBottom,
    delayAfterScrolling,
    waitUntilNetworkIdleAfterScroll,
    waitUntilNetworkIdleAfterScrollTimeout,
    proxy,
    selectorsToHide,
} = await parseInput(input);

const requestHandlerTimeoutSecs = calculateRequestHandlerTimeoutSecs(
    scrollToBottom,
    waitUntilNetworkIdleAfterScroll,
    waitUntilNetworkIdleAfterScrollTimeout,
    delayAfterScrolling,
    delay,
);


        //manually adding browserPoolOptionsObject on 20-Jan-2024
        var browserPoolOptionsObject={}
     
        	browserPoolOptionsObject = {
                useFingerprints: true, // this is the default
                fingerprintOptions: {
                    fingerprintGeneratorOptions: {
                        browsers: [
                            BrowserName.chrome,
                            BrowserName.firefox,
                            BrowserName.edge,
                            BrowserName.safari,
                        ],
                        devices: [
                            DeviceCategory.desktop,
                        ],
                         operatingSystems: [
                             OperatingSystemsName.windows,
                             OperatingSystemsName.linux,
                             OperatingSystemsName.macos,
                        ],
                        //locales: [ 'en-US', ],
                    },
                },
            }
        

const puppeteerCrawler = new PuppeteerCrawler({
    launchContext: {
        useChrome: true,
    },
   
    proxyConfiguration: await Actor.createProxyConfiguration(proxy),
    navigationTimeoutSecs: NAVIGATION_TIMEOUT_SECS,
    requestHandlerTimeoutSecs,
    headless: Actor.isAtHome(),
    preNavigationHooks: [
        async ({ page }, goToOptions) => {
            goToOptions!.waitUntil = waitUntil;
            goToOptions!.timeout = TIMEOUT_MS;

            await page.setViewport({ width, height: 1080 });
        },
    ],
    browserPoolOptions: browserPoolOptionsObject,
    requestHandler: async ({ page }) => {
        if (delay > 0) {
            log.info(`Waiting ${delay}ms as specified in input`);
            await sleep(delay);
        }

        if (scrollToBottom) {
            log.info("Scrolling to bottom of the page");
            try {
                await page.evaluate(async () => {
                    let i = 0;
                    while (i < document.body.scrollHeight) {
                        i += 250;
                        await new Promise((resolve) => setTimeout(resolve, 50));
                        window.scrollTo(0, i);
                    }
                });
                if (waitUntilNetworkIdleAfterScroll) {
                    log.info("Waiting until network is idle");
                    await page.waitForNetworkIdle({ timeout: waitUntilNetworkIdleAfterScrollTimeout }).catch(() => {
                        log.warning("Waiting until network is idle after scroll failed!");
                    });
                }
                if (delayAfterScrolling > 0) {
                    log.info(`Waiting ${delayAfterScrolling}ms after scroll as specified in input`);
                    await sleep(delayAfterScrolling);
                }
            } catch (error) {
                log.warning("Scrolling to bottom of the page failed!");
            }
        }

        if (selectorsToHide?.length) {
            await page.$$eval(selectorsToHide, (elements) => {
                for (const element of elements) {
                    (element as HTMLElement).style.display = "none";
                }
            });
        }

        log.info("Saving screenshot...");
        const screenshotKey = input.urls?.length ? generateUrlStoreKey(page.url()) : 'screenshot';
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        await Actor.setValue(screenshotKey, screenshotBuffer, { contentType: "image/png" });
        const screenshotUrl = `https://api.apify.com/v2/key-value-stores/${APIFY_DEFAULT_KEY_VALUE_STORE_ID}/records/${screenshotKey}?disableRedirect=true`;
        log.info(`Screenshot saved, you can view it here: \n${screenshotUrl}`);

        const html = await page.content(); // Get full HTML content of the page
        //console.log(html); // Print the full HTML to the console

  
    await sleep(delay);
        
         // Execute JavaScript within the page context to access the shadow DOM content
        const widgetContents = await page.evaluate(() => {
            const widgetContents = document.getElementsByClassName('widget-content');
            const results = [];

            for (let i = 0; i < widgetContents.length; i++) {
                const divID = '';
                if (widgetContents[i].getElementsByTagName('div')[0].id.includes('ScriptRoot')) {
                    const divID = widgetContents[i].getElementsByTagName('div')[0].id;
                    results.push(divID);
                }
            }

            return results;
        });
        

    await sleep(delay);

  /*      
// Process the results and perform the click
for (let i = 0; i < 1; i++) {
    const divID = widgetContents[i];

    console.log(divID);

    await page.evaluate(() => {
        const widgetContent = document.querySelector('.widget-content');
        console.log("widgetContent", widgetContent)
        if (widgetContent) {
            const shadowRoot = widgetContent.getElementsByTagName('div')[0].shadowRoot;
            console.log("shadowRoot", shadowRoot)
            if (shadowRoot) {
                const anchor = shadowRoot.querySelector('div.mcimg > a') as HTMLAnchorElement;
                 console.log("anchor", anchor)
                if (anchor) {
                    anchor.click();
                } else {
                    console.log('Anchor element not found inside shadow root.');
                }
            } else {
                console.log('Shadow root not found.');
            }
        } else {
            console.log('Widget content not found.');
        }
    });

    await sleep(delay);

    const pageurl = await page.url(); // Get full HTML content of the page
    console.log("pageurl", pageurl); // Print the full HTML to the console
    const pagecontent = await page.content(); // Get full HTML content of the page
    console.log("pagecontent", pagecontent); // Print the full HTML to the console

    // Take a screenshot
    //await page.screenshot({ path: 'pagelink.png', fullPage: true });

    log.info("Saving screenshot...");
    const screenshotKey = input.urls?.length ? generateUrlStoreKey(page.url()) : 'screenshot';
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    await Actor.setValue(screenshotKey, screenshotBuffer, { contentType: "image/png" });
    const screenshotUrl = `https://api.apify.com/v2/key-value-stores/${APIFY_DEFAULT_KEY_VALUE_STORE_ID}/records/${screenshotKey}?disableRedirect=true`;
    log.info(`Screenshot saved, you can view it here: \n${screenshotUrl}`);
}
*/

        
// Process the results and perform the click
for (let i = 0; i < 1; i++) {
    const divID = widgetContents[i];

    console.log(divID);

    const anchorHref = await page.evaluate((divID) => {
        const divElement = document.getElementById(divID);
        if (divElement && divElement.shadowRoot) {
            const anchor = divElement.shadowRoot.querySelector('div.mcimg > a');
            if (anchor) {
                anchor.click();
                return anchor.href;
            } else {
                console.error('Anchor element not found inside shadow root.');
                return null;
            }
        } else {
            console.error('Shadow root not found.');
            return null;
        }
    }, divID);

    if (anchorHref) {
        console.log('Clicked on anchor with href:', anchorHref);
    } else {
        console.log('Failed to click on anchor inside shadow root.');
    }

    await sleep(delay);

    const pageurl = await page.url(); // Get full HTML content of the page
    console.log("pageurl", pageurl); // Print the full HTML to the console
    const pagecontent = await page.content(); // Get full HTML content of the page
    console.log("pagecontent", pagecontent); // Print the full HTML to the console

    // Take a screenshot
    //await page.screenshot({ path: 'pagelink.png', fullPage: true });

    log.info("Saving screenshot...");
    const screenshotKey = input.urls?.length ? generateUrlStoreKey(page.url()) : 'screenshot';
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    await Actor.setValue(screenshotKey, screenshotBuffer, { contentType: "image/png" });
    const screenshotUrl = `https://api.apify.com/v2/key-value-stores/${APIFY_DEFAULT_KEY_VALUE_STORE_ID}/records/${screenshotKey}?disableRedirect=true`;
    log.info(`Screenshot saved, you can view it here: \n${screenshotUrl}`);
}



        await Actor.pushData({
            url: page.url(),
            screenshotUrl,
            screenshotKey,
            html, // Add HTML content to the output data
        });
    },
});

await puppeteerCrawler.run(urls);

await Actor.exit();
