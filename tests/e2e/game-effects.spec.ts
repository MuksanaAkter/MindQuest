import { test, expect } from "@playwright/test";
import { config } from "dotenv";
import { Pool } from "pg";
import type { ArenaView } from "@mindquest/server/arena/contracts";
config({path:"apps/web/.env",quiet:true});
test.use({extraHTTPHeaders:{"x-forwarded-for":"192.0.2.32"}});

test("timer, correct/wrong/timeout animations, real sound scheduling and mute work with saved answers",async({page})=>{
  test.skip(process.env.RUN_DB_E2E!=="1","Needs the migrated local database.");
  const pool=new Pool({connectionString:process.env.DATABASE_URL});let creatorId:string|undefined;let ownerKey:string|undefined;
  // Observe actual Web Audio nodes without replacing their playback implementation.
  await page.addInitScript(()=>{
    const wrongPlayback: { media: HTMLMediaElement | null; plays: number } = { media: null, plays: 0 };
    Object.defineProperty(window, "__wrongPlayback", { value: wrongPlayback });
    const playMedia = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() {
      if (this.src.includes("/sounds/wrong-answer.wav")) {
        wrongPlayback.media = this;
        if (!this.muted) wrongPlayback.plays++;
      }
      return playMedia.call(this);
    };
    const frequencies:number[]=[];
    Object.defineProperty(window,"__gameFrequencies",{value:frequencies});
    const levels: number[] = [];
    Object.defineProperty(window, "__gameLevels", { value: levels });
    const createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function() {
      const gain = createGain.call(this); const connect = gain.connect.bind(gain);
      gain.connect = ((destination: AudioNode) => {
        const result = connect(destination);
        if (destination === this.destination) {
          const analyser = this.createAnalyser(); analyser.fftSize = 256; connect(analyser);
          const samples = new Float32Array(analyser.fftSize);
          setInterval(() => {
            analyser.getFloatTimeDomainData(samples);
            levels.push(Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length));
          }, 10);
        }
        return result;
      }) as typeof gain.connect;
      return gain;
    };
    const claps:number[]=[];Object.defineProperty(window,"__gameClaps",{value:claps});
    const createBuffer=AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource=function(){const source=createBuffer.call(this);const start=source.start.bind(source);source.start=(at=0,offset=0,duration?:number)=>{claps.push(at);if(duration===undefined)start(at,offset);else start(at,offset,duration);};return source;};
    const create=AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator=function(){const oscillator=create.call(this);const start=oscillator.start.bind(oscillator);oscillator.start=(at=0)=>{frequencies.push(oscillator.frequency.value);start(at);};return oscillator;};
  });
  const sounds=()=>page.evaluate(()=>Reflect.get(window,"__gameFrequencies") as number[]);
  const applause=()=>page.evaluate(()=>Reflect.get(window,"__gameClaps") as number[]);
  try {
    const signup=await page.request.post("/api/auth/sign-up/email",{data:{name:"Effects Creator",email:`effects-${Date.now()}@example.com`,password:"Test-password-42!"},headers:{Origin:"http://localhost:3000"}});
    expect(signup.ok()).toBe(true);creatorId=(await signup.json()).user.id;
    const created=await page.request.post("/api/quizzes",{data:{title:"Sound and sparkle quiz",timed:true,questions:[
      {prompt:"What is 2 + 3?",options:["5","4","6","7"],correctIndex:0,explanation:"Two plus three makes five."},
      {prompt:"Which ocean is the biggest?",options:["Pacific Ocean","Atlantic Ocean","Indian Ocean","Arctic Ocean"],correctIndex:0,explanation:"The Pacific is the largest ocean."},
      {prompt:"Which planet is called the Red Planet?",options:["Mars","Venus","Earth","Jupiter"],correctIndex:0,explanation:"Mars has iron-rich minerals."},
      {prompt:"Which animal can fly?",options:["Owl","Fox","Cat","Dog"],correctIndex:0,explanation:"Owls have wings and can fly."}
    ]}});
    expect(created.ok()).toBe(true);const quiz=await created.json();
    const joined=await page.request.post("/api/quizzes/join",{data:{code:quiz.code,name:"Effects Explorer",avatar:"fox"}});
    const round:ArenaView=(await joined.json()).attempt;
    expect(new Date(round.deadline!).getTime()-new Date(round.serverTime).getTime()).toBeGreaterThan(14000);
    expect(new Date(round.deadline!).getTime()-new Date(round.serverTime).getTime()).toBeLessThanOrEqual(15000);
    const guest=(await page.context().cookies()).find(c=>c.name==="mq_guest")!;ownerKey=`guest:${guest.value}`;
    await page.goto(`/play/${round.id}`);await expect(page.getByRole("timer")).toBeVisible();
    await page.getByRole("heading",{name:"What is 2 + 3?",exact:true}).click();
    await expect.poll(async()=>(await sounds()).filter(frequency=>frequency===880).length).toBeGreaterThanOrEqual(2);
    await expect.poll(() => page.evaluate(() => Math.max(0, ...Reflect.get(window, "__gameLevels") as number[]))).toBeGreaterThan(.03);
    await expect(page.getByRole("timer")).not.toHaveClass(/is-urgent/);
    await page.getByRole("button",{name:/^[ABCD] 5$/}).click();
    await page.getByRole("button",{name:"Lock in answer",exact:true}).click();
    await expect(page.getByRole("heading",{name:"A brilliant discovery!"})).toBeVisible();
    await expect(page.getByRole("status",{name:/Correct! 100 points earned/})).toBeVisible();
    await expect(page.locator(".answer-confetti i")).toHaveCount(36);
    await expect.poll(sounds).toContain(1046.5);
    await expect.poll(async()=>(await applause()).length).toBe(6);
    const saved:ArenaView=await(await page.request.get(`/api/arena/${round.id}`)).json();expect(saved.reviews).toHaveLength(1);
    await page.getByRole("button",{name:"Next discovery",exact:true}).click();await expect(page.getByRole("timer")).toBeVisible();
    // Move only this disposable attempt near its real server deadline; no fake browser clock.
    await pool.query('UPDATE "GameAttempt" SET state=jsonb_set(state,\'{questionStartedAt}\',to_jsonb($2::text)) WHERE id=$1',[round.id,new Date(Date.now()-11000).toISOString()]);
    await page.reload();await page.getByRole("heading",{name:"Which ocean is the biggest?",exact:true}).click();
    await expect(page.getByRole("timer")).toHaveClass(/is-urgent/);
    await expect.poll(sounds).toContain(880);
    await expect(page.getByRole("heading",{name:"The hourglass ran out."})).toBeVisible({timeout:8000});
    const timeout:ArenaView=await(await page.request.get(`/api/arena/${round.id}`)).json();
    expect(timeout.feedback?.timedOut).toBe(true);expect(timeout.reviews).toHaveLength(2);
    await expect.poll(async()=>(await sounds()).some(frequency=>Math.abs(frequency-261.63)<.01)).toBe(true);
    await page.getByRole("button",{name:"Next discovery",exact:true}).click();
    await page.getByRole("button",{name:/^[ABCD] Venus$/}).click();await page.getByRole("button",{name:"Lock in answer",exact:true}).click();
    await expect(page.getByRole("heading",{name:"A new thing learned."})).toBeVisible();
    await expect.poll(() => page.evaluate(() => {
      const playback = Reflect.get(window, "__wrongPlayback") as { media: HTMLMediaElement | null; plays: number };
      return playback.plays > 0 && Boolean(playback.media && !playback.media.muted && playback.media.volume > .5 && playback.media.currentTime > .03);
    })).toBe(true);
    await expect(page.getByText("Knowledge grows with every answer, even the unexpected ones.", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Progress saved after every answer", { exact: true })).toHaveCount(0);
    await page.getByRole("button",{name:"Next discovery",exact:true}).click();
    await page.getByRole("button",{name:"Mute game sounds",exact:true}).click();
    const before=(await sounds()).length;const clapsBefore=(await applause()).length;
    const mediaBefore = await page.evaluate(() => Reflect.get(window, "__wrongPlayback").plays as number);
    await page.getByRole("button",{name:/^[ABCD] Fox$/}).click();await page.getByRole("button",{name:"Lock in answer",exact:true}).click();
    await expect(page.getByRole("heading",{name:"A new thing learned."})).toBeVisible();
    expect((await sounds()).length).toBe(before);expect((await applause()).length).toBe(clapsBefore);
    expect(await page.evaluate(() => Reflect.get(window, "__wrongPlayback").plays as number)).toBe(mediaBefore);
    expect(await page.evaluate(() => Reflect.get(window, "__wrongPlayback").media.paused as boolean)).toBe(true);
    await expect(page.locator(".celebration-learning")).toBeVisible();
    await expect(page.locator(".celebration-learning .celebration-buddy")).toHaveText("😔");
    await expect(page.getByText("Oops… not this one",{exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Reveal my results",exact:true}).click();
    await expect(page.getByText("1/4",{exact:true})).toBeVisible();
    await expect(page.locator(".result-celebration i")).toHaveCount(24);
    const final:ArenaView=await(await page.request.get(`/api/arena/${round.id}`)).json();expect(final.reviews).toHaveLength(4);
    await page.emulateMedia({reducedMotion:"reduce"});await expect(page.locator(".result-celebration")).toBeHidden();
    for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`${width}px: ${JSON.stringify(await page.locator("body *").evaluateAll(nodes=>nodes.map(n=>({tag:n.tagName,cls:n.className,x:n.getBoundingClientRect().x,right:n.getBoundingClientRect().right})).filter(n=>n.right>innerWidth+1||n.x< -1)))}`).toBe(true);}
  } finally {
    if(ownerKey){await pool.query('DELETE FROM "GameAttempt" WHERE "ownerKey"=$1',[ownerKey]);await pool.query('DELETE FROM "PlayerProfile" WHERE "ownerKey"=$1',[ownerKey]);}
    if(creatorId)await pool.query('DELETE FROM "User" WHERE id=$1',[creatorId]);await pool.end();
  }
});
