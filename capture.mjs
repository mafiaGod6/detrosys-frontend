// capture.mjs
// Full-height screenshots of your app, logged in on your own account.
// Opens pop-ups and inner pages, and cycles the email providers.
// Skips billing. Never types, saves, sends, deletes, verifies or upgrades.
//
// Setup (once, in the folder where this file is):
//   npm init -y
//   npm i playwright
//   npx playwright install chromium
//
// Step 1, log in once (window opens; log in; go to the dashboard; press Enter):
//   $env:LOGIN="1"; node capture.mjs
//
// Step 2, take all screenshots (no window):
//   Remove-Item Env:LOGIN; node capture.mjs
//
// Images go into the "screenshots" folder.

import { chromium } from "playwright";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const OUT_DIR = path.resolve("screenshots");
const PROFILE_DIR = path.join(os.homedir(), "detrosys-browser-profile");
const WIDTH = 1440;

// Clicks matching this are never made, so nothing changes on your account.
const BLOCKED_CLICK =
  /delete|remove|save|send|start|activate|pause|purchase|upgrade|billing|verify|initialize|submit|confirm|generate|cancel|pricing/i;

// Every page in your router, except billing and onboarding.
// actions:
//   { click: "text" }            opens a pop-up, or goes to an inner page
//   { selectEach, values }       switches a dropdown through each value
const STEPS = [
  // DASHBOARD
  { name: "01-dashboard", route: "/app" },

  // CAMPAIGNS
  {
    name: "02-campaigns",
    route: "/app/campaigns",
    actions: [{ click: "Create campaign" }],
  },

  // MESSAGING & INBOX
  {
    name: "03-messaging",
    route: "/app/messaging",
    actions: [{ click: "Open Inbox" }],
  },

  // AUDIENCES
  {
    name: "04-audiences",
    route: "/app/audiences",
    actions: [{ click: "Create audience" }],
  },

  // TEMPLATES
  {
    name: "05-templates-email",
    route: "/app/templates/email",
    actions: [{ click: "Create Email Template" }],
  },
  {
    name: "06-templates-sms",
    route: "/app/templates/sms",
    actions: [{ click: "Create SMS Template" }],
  },
  {
    name: "07-templates-library",
    route: "/app/templates/library",
    actions: [],
  },

  // AUTOMATIONS
  {
    name: "08-automations",
    route: "/app/automations",
    actions: [{ click: "Create automation" }],
  },

  // SETTINGS (billing excluded)
  {
    name: "09-settings-profile",
    route: "/app/settings/profile",
    actions: [],
  },
  {
    name: "10-settings-integrations",
    route: "/app/settings/integrations",
    actions: [
      {
        selectEach: "select",
        values: ["brevo", "mailgun", "resend", "sendgrid", "ses"],
      },
    ],
  },
  {
    name: "11-settings-account",
    route: "/app/settings/account",
    actions: [],
  },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(OUT_DIR, { recursive: true });

const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: process.env.LOGIN !== "1",
  viewport: { width: WIDTH, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});
const page = await context.newPage();

if (process.env.LOGIN === "1") {
  await page.goto(BASE_URL);
  console.log("Log in with your account in the browser window.");
  console.log("When you are on the dashboard, press Enter here.");
  await new Promise((resolve) => process.stdin.once("data", resolve));
  await context.close();
  console.log("Login saved. Now run: node capture.mjs");
  process.exit(0);
}

// Make the window as tall as the page, so nothing scrolls and the bottom bar stays visible.
// Many apps scroll inside a box instead of the page. This removes the height
// limit from those boxes during the capture so the whole content is laid out
// on the page, then makes the window that tall. Fixed bars (like the bottom
// dock) then sit at the real bottom of the image.
async function fitToPage() {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll("*").forEach((el) => {
      const s = getComputedStyle(el);
      if (s.overflowY === "auto" || s.overflowY === "scroll") {
        el.style.height = "auto";
        el.style.maxHeight = "none";
        el.style.overflow = "visible";
      }
    });
  });
  await wait(400);
  const h = await page.evaluate(() =>
    Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)),
  );
  await page.setViewportSize({ width: WIDTH, height: h });
  await wait(900);
  return h;
}

// Fixed bars (header, bottom dock, "Ask D.A.T.A.") are pinned to where they
// sit on the full-height page, so each appears once in the image instead of
// repeating at every scroll position.
async function pinFixedElements() {
  await page.evaluate(() => {
    document.querySelectorAll("*").forEach((el) => {
      if (getComputedStyle(el).position !== "fixed") return;
      const r = el.getBoundingClientRect();
      el.style.position = "absolute";
      el.style.top = r.top + window.scrollY + "px";
      el.style.left = r.left + "px";
      el.style.width = r.width + "px";
      el.style.height = r.height + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
    });
  });
  await wait(300);
}

async function shot(name) {
  const h = await fitToPage();
  await pinFixedElements();
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage: true,
  });
  console.log(`saved ${name}.png (${h}px)`);
}

async function openPage(route) {
  await page.goto(BASE_URL + route, { waitUntil: "load" });
  await wait(2500);
  return !page.url().includes("billing");
}

async function closePopups() {
  await page.keyboard.press("Escape");
  await wait(400);
}

for (const step of STEPS) {
  try {
    if (!(await openPage(step.route))) {
      console.log(`skipped ${step.name} (billing)`);
      continue;
    }
    await shot(step.name);

    for (const action of step.actions || []) {
      if (action.click) {
        if (BLOCKED_CLICK.test(action.click)) {
          console.log(`blocked click "${action.click}"`);
          continue;
        }
        const target = page
          .getByRole("button", { name: action.click, exact: false })
          .or(page.getByRole("link", { name: action.click, exact: false }))
          .first();
        if ((await target.count()) === 0) {
          console.log(`not found: "${action.click}" on ${step.route}`);
          continue;
        }
        await target.click();
        await wait(1500);
        await shot(`${step.name}-${action.click.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
        await closePopups();
        await openPage(step.route);
      }

      if (action.selectEach) {
        const dropdown = page.locator(action.selectEach).first();
        if ((await dropdown.count()) === 0) {
          console.log(`no dropdown "${action.selectEach}"`);
          continue;
        }
        for (const value of action.values) {
          await dropdown.selectOption(value);
          await wait(1200);
          await shot(`${step.name}-provider-${value}`);
        }
        await openPage(step.route);
      }
    }
  } catch (err) {
    console.log(`error on ${step.name}: ${err.message}`);
  }
}

await context.close();
console.log(`Done. Screenshots are in: ${OUT_DIR}`);
