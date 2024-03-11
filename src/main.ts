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

  /*  
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

        // Process the results
        for (const divID of widgetContents) {
            console.log(divID);
              /*  
              const anchorTagsArray: string[] = []; // Specify the type as string[]

            
            const shadowRootContent = await page.evaluate((divID) => {
                const divElement = document.getElementById(divID);

                   
                if (divElement && divElement.shadowRoot) {
                    const shadowRoot = divElement.shadowRoot;
                    const allAnchorTags = shadowRoot.querySelectorAll('a'); // Select all anchor tags inside shadowRoot
            
                     console.log( "shadowRoot",shadowRoot );
                     console.log( "shadowRoot.innerHTML",shadowRoot.innerHTML );
                     console.log( "allAnchorTags", allAnchorTags );
                    allAnchorTags.forEach(anchorTag => {
                        if (anchorTag.href && anchorTag.href.includes('clck.')) {
                            // If the href attribute contains 'clck.', push it to the array
                            //anchorTagsArray.push(anchorTag.href);
                            console.log(anchorTag);
                            console.log(anchorTag.href);
                        }
                    });
            
                    //return anchorTagsArray;
                    return allAnchorTags;
                   // return divElement.shadowRoot.innerHTML;
                } else {
                    return 'The div does not contain a shadowRoot.';
                }
            }, divID);

            console.log(shadowRootContent);

            */
/*
//working fine
            const shadowRootContent = await page.evaluate((divID) => {
    const divElement = document.getElementById(divID);
    const anchorTagsArray: string[] = []; // Specify the type as string[]


    if (divElement && divElement.shadowRoot) {
        const shadowRoot = divElement.shadowRoot;
        const allAnchorTags = shadowRoot.querySelectorAll('a'); // Select all anchor tags inside shadowRoot

        allAnchorTags.forEach(anchorTag => {
            if (anchorTag.href && anchorTag.href.includes('clck.')) {
                anchorTagsArray.push(anchorTag); // Push href attribute to the array
                
            }
        });

        return anchorTagsArray; // Return the array of href attributes
    } else {
        return 'The div does not contain a shadowRoot.';
    }
}, divID);

console.log(shadowRootContent); // This should print an array of href attributes

            */

            const shadowRootContent = await page.evaluate(async (divID) => {
    const divElement = document.getElementById(divID);
 const anchorTagsArray: string[] = []; // Specify the type as string[]

    if (divElement && divElement.shadowRoot) {
        const shadowRoot = divElement.shadowRoot;
        const allAnchorTags = shadowRoot.querySelectorAll('a'); // Select all anchor tags inside shadowRoot

        // Click on the third link
        const thirdAnchorTag = allAnchorTags[2]; // Index starts from 0, so 2 is the third link
        thirdAnchorTag.click();
        
        console.log("clicked on this link", thirdAnchorTag.href);
            
        // Wait for the page to load for 2 minutes
       await new Promise(resolve => setTimeout(resolve, 1 * 30 * 1000));
        //await sleep(  1 * 30 * 1000 );
        // Take a snapshot and name it as 'pagelink'
        await page.screenshot({ path: 'pagelink.png', fullPage: true });

        
        // Return success message
        return 'Snapshot taken and saved as pagelink.png';
    } else {
        return 'The div does not contain a shadowRoot.';
    }
}, divID);

console.log(shadowRootContent); // Print the result



            
        }
        */

        // Execute JavaScript within the page context to access the shadow DOM content
const widgetContents = await page.evaluate(() => {
    const widgetContents = document.getElementsByClassName('widget-content');
    const results = [];

    // Process each widget content
    for (let i = 0; i < widgetContents.length; i++) {
        const divElement = widgetContents[i];
        const divID = divElement.querySelector('div')?.id || '';

        // Check if the div contains a shadowRoot
        if (divID.includes('ScriptRoot')) {
            results.push(divID);
        }
    }

    return results;
});

// Process the results and perform the click
for (let i = 0; i <1; i++) {
    const divID = widgetContents[i];

    console.log(divID);

    // Access the shadowRoot and find the link
    const shadowRootContent = await page.evaluate(async (divID) => {
        const divElement = document.getElementById(divID);

        if (divElement && divElement.shadowRoot) {
            const shadowRoot = divElement.shadowRoot;
            const allAnchorTags = shadowRoot.querySelectorAll('a');

            // Return the href of the third anchor tag
            return allAnchorTags[2].href;
        } else {
            return 'The div does not contain a shadowRoot.';
        }
    }, divID);

    // Click on the link
    await page.goto(shadowRootContent);

    // Take a screenshot
    await page.screenshot({ path: 'pagelink.png', fullPage: true });

    console.log('Clicked on link:', shadowRootContent);
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
