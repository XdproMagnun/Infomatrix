const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:"msedge"});
 const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://panel.test/**',route=>{const url=new URL(route.request().url());let f=path.join(process.cwd(),url.pathname==='/'?'dashboard/index.html':decodeURIComponent(url.pathname));if(!fs.existsSync(f))return route.fulfill({status:404});route.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'image/jpeg'});});
 await page.goto('https://panel.test/dashboard/index.html');
 for(const width of [320,375,390,768,1280]){
  await page.setViewportSize({width,height:844});
  for(const section of ['resumen','estudiantes','actividades','exportaciones','conexion','ayuda']){
   await page.evaluate(s=>location.hash=s,section);await page.waitForTimeout(80);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${width} ${section}`);
   assert(await page.locator('h1').count(),section);
  }
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>location.hash='resumen');
 await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.locator('[data-page="estudiantes"]').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
 if(process.env.SCREENSHOT_PATH) await page.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true});
 const demo=await page.evaluate(()=>window.DASHBOARD_DATA);
 let pending;let hold=false;let count=0;
 await page.route('https://xdpromagnun.github.io/**',route=>{const u=new URL(route.request().url());const f=path.join(process.cwd(),decodeURIComponent(u.pathname));route.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'image/jpeg'});});
 await page.route('https://unisalud.com.mx/**',async route=>{count++;if(hold)await new Promise(r=>pending=r);await route.fulfill({json:demo});});
 await page.goto('https://xdpromagnun.github.io/dashboard/index.html');
 await page.locator('[name=username]').fill('test');await page.locator('[name=password]').fill('test');await page.locator('#sign-in button').click();await page.locator('#sign-out').waitFor({state:'visible'});
 hold=true;await page.waitForTimeout(1200);assert(pending,'poll pending');await page.locator('#sign-out').click();pending();await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>data),undefined);assert.equal(await page.evaluate(()=>accessHeader),'');assert.equal(await page.locator('#detail-content').textContent(),'');assert(await page.locator('#sign-in').isVisible());const n=count;await page.waitForTimeout(1200);assert.equal(count,n,'polling stopped');
 await page.reload();assert(await page.locator('#sign-in').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS: six pages at five widths, mobile navigation, logout with pending request, polling stopped, reload locked, no browser errors.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

