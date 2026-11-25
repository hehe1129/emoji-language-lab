async page => {
 page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000); const base = 'https://emoji-language-lab.pages.dev'; const checks=[];const assert=(ok,name)=>{if(!ok)throw new Error(name);checks.push(name);console.log('PASS '+name);};
 const settle=async()=>{await page.waitForFunction(()=>[...document.images].every(i=>i.complete));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(450);};
 const click=async(name)=>{await page.evaluate(name=>globalThis.__stage=name,name);await page.getByRole('button',{name,exact:true}).first().click();};
 await page.goto(base);
 await page.evaluate(()=>localStorage.clear());await page.reload();
 await click('开始体验');
 await page.getByRole('heading',{name:'从一个梦，出发。'}).waitFor();
 assert(await page.locator('.map-node:not(:disabled)').count()===1,'new session only opens 01');
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:/01 夜晚的梦 可进入/}).click();await page.locator('.prompt-banner button').click();
 assert(await page.getByRole('button',{name:'确认提交',exact:true}).isDisabled(),'empty sequence cannot submit');
 await click('添加小猫');await click('添加小猫');await click('添加月亮');
 const ids=()=>page.locator('[data-item]').evaluateAll(els=>els.map(e=>e.dataset.emoji));
 assert(JSON.stringify(await ids())==='["cat","cat","moon"]','same emoji repeat preserves order');
 const drag=async(from,to,xRatio=.5)=>{const a=await from.boundingBox(),b=await to.boundingBox();if(!a||!b)throw new Error('missing drag target');await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width*xRatio,b.y+b.height/2,{steps:15});await page.mouse.up();};
 await drag(page.locator('[data-asset="sleep"]'),page.locator('[data-item="1"]'),.1);
 assert(JSON.stringify(await ids())==='["cat","sleep","cat","moon"]','mouse drag inserts palette asset between items');
 await drag(page.locator('[data-item="3"]'),page.locator('[data-item="0"]'),.1);
 assert(JSON.stringify(await ids())==='["moon","cat","sleep","cat"]','mouse reorders existing item');
 await drag(page.locator('[data-item="1"]'),page.locator('[data-trash]'));
 assert(JSON.stringify(await ids())==='["moon","sleep","cat"]','mouse drag to trash removes one item');
 await page.locator('[data-item="2"]').click();await click('左移');
 assert(JSON.stringify(await ids())==='["moon","cat","sleep"]','click sorting alternative works');
 await click('添加星星');await click('添加床');await click('添加闪光');await click('添加小猫');
 assert(await page.locator('[data-item]').count()===6,'limit blocks a seventh item');
 await click('清空排列');await click('再想一想');assert(await page.locator('[data-item]').count()===6,'cancel clear retains draft');
 await click('清空排列');await click('确认清空');assert(await page.locator('[data-item]').count()===0,'confirmed clear empties sequence');
 await click('添加小猫');await click('添加月亮');await click('确认提交');await click('再想一想');
 assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('emoji-language-lab.session.v1')).completed)).length===0,'cancel submission does not unlock');
 const before=(await page.evaluate(async()=>await (await fetch('/api/works?level=01')).json())).total;
 let failedId='';
 await page.route('**/api/works',async route=>{if(route.request().method()==='POST'){failedId=route.request().postDataJSON().id;await page.evaluate(async ({body,authorization})=>await (await fetch('/api/works?response-loss-test=1',{method:'POST',headers:{'Content-Type':'application/json',Authorization:authorization},body})).json(),{body:route.request().postData(),authorization:route.request().headers().authorization});await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'模拟保存响应丢失'})});}else await route.continue();});
 await click('确认提交');await click('确认收录');
 await page.getByRole('alert').filter({hasText:'模拟保存响应丢失'}).first().waitFor();
 let s=await page.evaluate(()=>JSON.parse(localStorage.getItem('emoji-language-lab.session.v1')));
 assert(s.completed.length===0&&s.pending['01'].id===failedId&&s.drafts['01'].length===2,'failure retains pending ID/draft without unlocking even when server saved');
 await page.unroute('**/api/works');await click('确认收录');await page.getByRole('heading',{name:'你的理解，已被收录。'}).waitFor();
 assert((await page.evaluate(async()=>await (await fetch('/api/works?level=01')).json())).total===before+1,'same-ID retry after lost response creates only one public work');
 await click('返回探索地图');assert(await page.locator('.map-node:not(:disabled)').count()===3,'01 simultaneously opens 02 and 03');
 await page.getByRole('button',{name:/03 月面日出 可进入/}).click();await page.locator('.prompt-banner button').click();await click('添加火箭');await click('添加月亮');
 await page.reload();await click('继续本次体验');await page.getByRole('heading',{name:'我想去月球上看一场日出。'}).waitFor();
 assert(JSON.stringify(await ids())==='["rocket","moon"]','refresh restores current editor and unsubmitted draft');
 await click('确认提交');await click('确认收录');await page.getByRole('heading',{name:'你的理解，已被收录。'}).waitFor();await click('返回探索地图');
 assert(await page.getByRole('button',{name:/04 分享快乐 已锁定/}).isDisabled(),'03 completion does not unlock 04');
 for(const [id,name,asset] of [['05','温柔世界','地球'],['02','回家的路','雨'],['04','分享快乐','笑脸']]){
  await page.getByRole('button',{name:new RegExp(id+' '+name+' 可进入')}).click();await page.locator('.prompt-banner button').click();await click('添加'+asset);await click('确认提交');await click('确认收录');
  if(id!=='04'){await page.getByRole('heading',{name:'你的理解，已被收录。'}).waitFor();await click('返回探索地图');}
 }
 await page.getByRole('heading',{name:'这就是，你的图形语言。'}).waitFor();
 assert(await page.locator('.review-list article').count()===5,'five completed levels show full personal review');
 s=await page.evaluate(()=>JSON.parse(localStorage.getItem('emoji-language-lab.session.v1')));const savedId=s.works[0].id;await page.evaluate(s=>globalThis.__emojiReview=s,s);
 await page.locator('.toast').waitFor({state:'hidden',timeout:9000});
 await click('结束本次体验');await click('结束并重置');await click('开始体验');await page.getByRole('heading',{name:'从一个梦，出发。'}).waitFor();
 assert(await page.locator('.map-node:not(:disabled)').count()===1,'end and new session reset progression');
 assert((await page.evaluate(async()=>await (await fetch('/api/works?level=01')).json())).works.some(w=>w.id===savedId),'public works survive end/reset');
 await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile map has no horizontal overflow');
 await page.setViewportSize({width:768,height:1024});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'tablet map has no horizontal overflow');
 return {checks:checks.length,result:'passed',details:checks};
}








