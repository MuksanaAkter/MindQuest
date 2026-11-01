import { test, expect, type Page } from "@playwright/test";
import { config } from "dotenv";
import { Pool } from "pg";
import type { ArenaView } from "@mindquest/server/arena/contracts";
config({path:"apps/web/.env",quiet:true});
test.use({extraHTTPHeaders:{"x-forwarded-for":"192.0.2.21"}});

async function inspectPage(page:Page,path:string,width:number) {
  await page.setViewportSize({width,height:900});
  const response=await page.goto(path);
  expect(response?.status(),`${path} at ${width}px`).toBe(path.includes("missing-quest")?404:200);
  await expect(page.getByRole("heading",{level:1})).toHaveCount(1, { timeout: 15000 });
  await expect(page.locator("main")).toBeVisible();
  const icons=await page.locator('head link[rel="icon"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute("href")));
  expect(icons.some(href=>href?.includes("favicon.ico")),path).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`${path} overflows at ${width}px`).toBe(true);
  await expect.poll(()=>page.locator("img").evaluateAll(images=>(images as HTMLImageElement[]).filter(img=>img.getBoundingClientRect().top<innerHeight&&img.getBoundingClientRect().bottom>0).every(img=>img.complete&&img.naturalWidth>0)),{message:`Visible artwork loads: ${path}`}).toBe(true);
}

test("auth buttons have breathing room and full input width on phone, tablet and desktop",async({page,request})=>{
  for(const path of ["/login","/signup"]) {
    for(const width of [320,390,768,1280]) {
      await inspectPage(page,path,width);
      const password=await page.getByLabel("Password",{exact:true}).boundingBox();
      const button=await page.getByRole("button",{name:path==="/login"?"Open creator dashboard":"Create account",exact:true}).boundingBox();
      expect(button!.y-(password!.y+password!.height)).toBeGreaterThanOrEqual(22);
      expect(Math.abs(button!.width-password!.width)).toBeLessThanOrEqual(1);
    }
  }
  for(const path of ["/favicon.ico","/icon.svg","/apple-icon.png"]) {
    const response=await request.get(path);expect(response.ok()).toBe(true);expect(response.headers()["content-type"]).toMatch(/^image\//);
  }
});

test("public, player, creator and result pages stay readable with loaded artwork",async({page})=>{
  test.skip(process.env.RUN_DB_E2E!=="1","Needs local database and creator auth environment.");test.setTimeout(120000);
  const pool=new Pool({connectionString:process.env.DATABASE_URL});let creatorId:string|undefined;let ownerKey:string|undefined;
  const failures:string[]=[];
  page.on("pageerror",error=>failures.push(error.message));
  try {
    for(const width of [390,1280]) for(const path of ["/","/me","/arena","/missing-quest-layout-check"]) await inspectPage(page,path,width);
    const signup=await page.request.post("/api/auth/sign-up/email",{data:{name:"Layout Explorer",email:`layout-${Date.now()}@example.com`,password:"Test-password-42!"},headers:{Origin:"http://localhost:3000"}});
    expect(signup.ok()).toBe(true);creatorId=(await signup.json()).user.id;
    for(const width of [390,768,1280]) for(const path of ["/dashboard","/create","/quests"]) await inspectPage(page,path,width);
    const created=await page.request.post("/api/quizzes",{data:{title:"Layout discovery quiz",timed:false,questions:[{prompt:"Which planet is the Red Planet?",options:["Mars","Venus","Earth","Jupiter"],correctIndex:0,explanation:"Mars has iron-rich minerals that give it a red appearance."}]}});
    const quiz=await created.json();
    const joined=await page.request.post("/api/quizzes/join",{data:{code:quiz.code,name:"Layout Player",avatar:"fox"}});
    const round:ArenaView=(await joined.json()).attempt;
    const guest=(await page.context().cookies()).find(cookie=>cookie.name==="mq_guest")!;ownerKey=`guest:${guest.value}`;
    for(const width of [390,1280]) await inspectPage(page,`/play/${round.id}`,width);
    const selected=round.question!.options.find(option=>option.text==="Mars")!;
    await page.request.post(`/api/arena/${round.id}`,{data:{action:"answer",questionId:round.question!.id,choiceId:selected.id}});
    await page.request.post(`/api/arena/${round.id}`,{data:{action:"next",questionId:round.question!.id}});
    for(const width of [390,1280]) {await inspectPage(page,`/results/${round.id}`,width);await expect(page.getByRole("region",{name:"Your quiz rewards"})).toBeVisible();}
    expect(failures).toEqual([]);
  } finally {
    if(ownerKey){await pool.query('DELETE FROM "GameAttempt" WHERE "ownerKey"=$1',[ownerKey]);await pool.query('DELETE FROM "PlayerProfile" WHERE "ownerKey"=$1',[ownerKey]);}
    if(creatorId)await pool.query('DELETE FROM "User" WHERE id=$1',[creatorId]);
    await pool.end();
  }
});
