// Setup guide content for each provider.
// Text lives here, not in components, so you can update a provider's steps
// when its dashboard changes without touching UI code.
// Check button names against each provider's live dashboard before launch.

export type ProviderId =
  | "resend"
  | "brevo"
  | "mailgun"
  | "sendgrid"
  | "ses"
  | "twilio";

export type SetupStep = {
  title: string;
  // One short line shown in the flow strip at the top of the guide.
  short: string;
  // What the user does, in order.
  points: string[];
  // Optional tip shown under the points.
  tip?: string;
  link?: { label: string; href: string };
};

export type SetupGuide = {
  provider: ProviderId;
  label: string;
  channel: "email" | "sms";
  summary: string;
  steps: SetupStep[];
  note?: string;
};

export const SETUP_GUIDES: Record<ProviderId, SetupGuide> = {
  resend: {
    provider: "resend",
    label: "Resend",
    channel: "email",
    summary: "Send your campaigns from your own domain through Resend.",
    steps: [
      {
        title: "Create an API key",
        short: "API key",
        points: [
          "Log in to Resend and open API Keys.",
          "Click Create API Key.",
          "Give it Sending access. Full access also works, but Sending is safer.",
          "Copy the key right away. Resend shows it only once.",
          "Paste it into the API key field in Detrosys and save.",
        ],
        link: { label: "Open Resend API keys", href: "https://resend.com/api-keys" },
      },
      {
        title: "Add your sending domain",
        short: "Add domain",
        points: [
          "In Resend, open Domains and click Add Domain.",
          "Type your own domain, for example yourcompany.com. Don't use gmail.com or other free addresses.",
          "Choose the region closest to your customers, then continue.",
        ],
      },
      {
        title: "Add the DNS records at your registrar",
        short: "DNS records",
        points: [
          "Resend shows a list of records. Keep that page open.",
          "Log in to where you bought your domain (GoDaddy, Namecheap, Cloudflare, etc.) and open its DNS settings.",
          "For each record, add a new record with the same type (TXT, MX, or CNAME), name, and value.",
          "Save each one. Don't change the values.",
        ],
        tip: "Some registrars add your domain name automatically. If so, enter only the part Resend shows (for example resend._domainkey), not the full name.",
      },
      {
        title: "Click Verify",
        short: "Verify",
        points: [
          "Go back to Resend and open your domain.",
          "Click Verify DNS Records.",
          "If it still says pending, wait. DNS can take a few minutes to a few hours.",
          "Click Verify again later. Don't keep clicking; wait a bit between tries.",
        ],
      },
      {
        title: "Send",
        short: "Send",
        points: [
          "When the domain shows Verified in Resend, your campaigns can send from it.",
          "Until then, Resend only lets you send to your own email address.",
        ],
      },
    ],
    note: "A verified domain lets you send to anyone, but it doesn't guarantee delivery. Only email people who have opted in, and include an unsubscribe link.",
  },

  brevo: {
    provider: "brevo",
    label: "Brevo",
    channel: "email",
    summary: "Send your campaigns from your own domain through Brevo.",
    steps: [
      {
        title: "Create an API key",
        short: "API key",
        points: [
          "Log in to Brevo and open SMTP & API.",
          "Open the API Keys tab and click Generate a new API key.",
          "Copy the v3 key right away and paste it into the API key field in Detrosys.",
        ],
        link: { label: "Open Brevo SMTP & API", href: "https://app.brevo.com/settings/keys/api" },
      },
      {
        title: "Add your sending domain",
        short: "Add domain",
        points: [
          "In Brevo, open Senders, Domains & Dedicated IPs, then the Domains tab.",
          "Click Add a domain and enter your own domain.",
          "Brevo shows the DNS records to add.",
        ],
      },
      {
        title: "Add the DNS records at your registrar",
        short: "DNS records",
        points: [
          "Keep the Brevo records page open.",
          "Open your registrar's DNS settings (GoDaddy, Namecheap, Cloudflare, etc.).",
          "Add each record exactly as shown: type, name, and value.",
          "Save each one.",
        ],
        tip: "If your registrar adds the domain name automatically, leave it out of the name field.",
      },
      {
        title: "Authenticate the domain",
        short: "Verify",
        points: [
          "Back in Brevo, click Authenticate this domain.",
          "If it fails, wait and try again. DNS changes can take a while.",
        ],
      },
      {
        title: "Add a sender address",
        short: "Sender",
        points: [
          "In Brevo, open Senders and add a sender such as hello@yourcompany.com.",
          "Use an address on the domain you just authenticated.",
          "Confirm the sender if Brevo emails you a link.",
        ],
      },
      {
        title: "Send",
        short: "Send",
        points: [
          "Once the domain is authenticated and the sender is confirmed, your campaigns can send from it.",
        ],
      },
    ],
  },

  mailgun: {
    provider: "mailgun",
    label: "Mailgun",
    channel: "email",
    summary: "Send your campaigns from your own domain through Mailgun.",
    steps: [
      {
        title: "Create an API key",
        short: "API key",
        points: [
          "Log in to Mailgun and open your account's API Keys section.",
          "Create a key with permission to send mail (a sending key works).",
          "Copy the key and paste it into the API key field in Detrosys.",
        ],
      },
      {
        title: "Add your sending domain",
        short: "Add domain",
        points: [
          "In Mailgun, open Sending, then Domains, and click Add New Domain.",
          "Enter your own domain, for example yourcompany.com.",
          "Pick the region that matches your Mailgun account, then continue.",
        ],
      },
      {
        title: "Add the DNS records at your registrar",
        short: "DNS records",
        points: [
          "Mailgun shows the records to add. They are usually TXT records for SPF and DKIM, and a CNAME for tracking.",
          "Open your registrar's DNS settings and add each record exactly as shown.",
          "Save each one.",
        ],
        tip: "Mailgun can show extra MX records for receiving. Only add them if you need to receive email through Mailgun.",
      },
      {
        title: "Verify the DNS records",
        short: "Verify",
        points: [
          "Back in Mailgun, open the domain and click Verify DNS Settings.",
          "If it says pending, wait and try again later.",
        ],
      },
      {
        title: "Send",
        short: "Send",
        points: [
          "When the domain shows Active or verified, your campaigns can send from it.",
        ],
      },
    ],
  },

  sendgrid: {
    provider: "sendgrid",
    label: "SendGrid",
    channel: "email",
    summary: "Send your campaigns from your own domain through SendGrid.",
    steps: [
      {
        title: "Create an API key",
        short: "API key",
        points: [
          "Log in to SendGrid and open Settings, then API Keys.",
          "Click Create API Key.",
          "Choose Restricted Access and turn on Mail Send. Leave everything else off.",
          "Copy the key right away and paste it into the API key field in Detrosys.",
        ],
        link: { label: "Open SendGrid API keys", href: "https://app.sendgrid.com/settings/api_keys" },
      },
      {
        title: "Authenticate your domain",
        short: "Add domain",
        points: [
          "In SendGrid, open Settings, then Sender Authentication.",
          "Click Authenticate Your Domain.",
          "Choose your DNS host (the company where you manage your domain) and enter your domain.",
        ],
      },
      {
        title: "Add the DNS records at your registrar",
        short: "DNS records",
        points: [
          "SendGrid shows CNAME records. They are usually two DKIM records and one for link tracking.",
          "Open your registrar's DNS settings and add each CNAME exactly as shown.",
          "Save each one.",
        ],
        tip: "Enter the name without the domain if your registrar adds it automatically.",
      },
      {
        title: "Verify",
        short: "Verify",
        points: [
          "Back in SendGrid, click Verify.",
          "If it fails, wait and try again. DNS can take a few hours.",
        ],
      },
      {
        title: "Send",
        short: "Send",
        points: [
          "When the domain is verified, your campaigns can send from it.",
        ],
      },
    ],
  },

  ses: {
    provider: "ses",
    label: "Amazon SES",
    channel: "email",
    summary: "Send your campaigns from your own domain through Amazon SES.",
    steps: [
      {
        title: "Create IAM credentials",
        short: "Credentials",
        points: [
          "In AWS, open IAM, then Users, and create a user for sending mail.",
          "Attach a policy that allows ses:SendEmail.",
          "Create an access key for that user.",
          "Copy the access key ID and secret key and paste them into Detrosys.",
        ],
        tip: "Use a dedicated IAM user for this. Don't use your root account.",
      },
      {
        title: "Choose a region",
        short: "Region",
        points: [
          "In the SES console, pick the region you want to send from (top-right corner).",
          "Use the same region everywhere: the verification, the credentials, and the app setting.",
        ],
      },
      {
        title: "Verify your domain",
        short: "Add domain",
        points: [
          "In SES, open Identities, then click Create identity.",
          "Choose Domain, enter your domain, and keep Easy DKIM turned on (RSA 2048).",
          "Click Create identity.",
        ],
      },
      {
        title: "Add the DNS records at your registrar",
        short: "DNS records",
        points: [
          "SES shows three CNAME records for DKIM. Add all three exactly as shown.",
          "If SES shows a TXT verification record, add that too.",
          "Save each one.",
        ],
      },
      {
        title: "Wait for Verified",
        short: "Verify",
        points: [
          "Back in SES, open the identity. Wait until its status shows Verified.",
          "This can take a few minutes to a few hours.",
        ],
      },
      {
        title: "Request production access",
        short: "Production",
        points: [
          "New SES accounts are in the sandbox. In the sandbox you can only send to addresses you have verified.",
          "In the SES console, open Account dashboard and click Request production access.",
          "Fill in the form honestly, including how you collect consent and handle unsubscribes.",
        ],
      },
      {
        title: "Send",
        short: "Send",
        points: [
          "After production access is approved and the domain is verified, your campaigns can send to anyone who opted in.",
        ],
      },
    ],
  },

  twilio: {
    provider: "twilio",
    label: "Twilio",
    channel: "sms",
    summary: "Send SMS campaigns through Twilio. No DNS records are needed.",
    steps: [
      {
        title: "Copy your Account SID and Auth Token",
        short: "Credentials",
        points: [
          "Log in to the Twilio Console. The home page shows your Account SID and Auth Token.",
          "Copy both and paste them into the matching fields in Detrosys.",
        ],
        link: { label: "Open Twilio Console", href: "https://console.twilio.com" },
      },
      {
        title: "Get a sender number",
        short: "Number",
        points: [
          "In the Twilio Console, go to Phone Numbers, then Buy a number.",
          "Choose a number with SMS capability for your target country.",
          "Copy the number in international format, for example +14155550123.",
        ],
      },
      {
        title: "Register for SMS (where your country requires it)",
        short: "Register",
        points: [
          "India: register on DLT through a telecom operator or Twilio. Register your business (principal entity), your sender ID, and each message template. Messages with unregistered templates are blocked by carriers.",
          "United States: register your brand and campaign for 10DLC in Twilio. Unregistered traffic from US numbers is often blocked.",
          "Other countries: check the local rules before you launch.",
        ],
      },
      {
        title: "Save and test",
        short: "Save",
        points: [
          "Save the integration in Detrosys.",
          "If saving fails, read the message shown. It names the missing field.",
          "Send a test message to your own phone first.",
        ],
      },
    ],
    note: "Some carriers block messages from unregistered senders even when the API call succeeds. Registration rules change, so check them with Twilio.",
  },
};
