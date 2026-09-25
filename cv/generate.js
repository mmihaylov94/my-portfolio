const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, TabStopType, AlignmentType,
  BorderStyle, Footer, PageNumber, convertInchesToTwip,
} = require('docx');

// ── design tokens ────────────────────────────────────────────────────────────
const BLUE  = '0F5581';   // sampled from the original CV
const LBLUE = '5C89A6';   // company names
const BODY  = '1A1A1A';
const GREY  = '595959';
const F     = 'Libre Franklin';

const MARGIN     = convertInchesToTwip(0.6);           // 864
const PAGE_W     = 11906;                              // A4
const RIGHT_EDGE = PAGE_W - 2 * MARGIN;                // 10178
const RIGHT_TAB  = [{ type: TabStopType.RIGHT, position: RIGHT_EDGE }];

const S = 18;   // base size, half-points (9pt)

// ── run helpers ──────────────────────────────────────────────────────────────
const t  = (text, o = {}) => new TextRun({ text, size: S, color: BODY, font: F, ...o });
const tb = (text, o = {}) => t(text, { bold: true, ...o });
const ti = (text, o = {}) => t(text, { italics: true, ...o });

// ── paragraph helpers ────────────────────────────────────────────────────────
const gap = (pts) => new Paragraph({ children: [t('')], spacing: { after: pts * 20 } });

const sectionHeading = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: S + 3, color: BLUE, font: F })],
  spacing: { before: 150, after: 66 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 2 } },
});

const body = (children, o = {}) => new Paragraph({
  children,
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 48, line: 228 },
  ...o,
});

// square bullet with hanging indent
const bullet = (children, o = {}) => new Paragraph({
  children: [t('▪  ', { color: BLUE, bold: true }), ...children],
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 36, line: 228 },
  indent: { left: 260, hanging: 180 },
  ...o,
});

// role line: title | employer on the left, dates hard right
const roleLine = (title, employer, dates) => new Paragraph({
  children: [
    tb(title, { color: BLUE }),
    t(' | ', { color: GREY }),
    tb(employer, { color: LBLUE }),
    t('\t'),
    t(dates, { color: GREY }),
  ],
  tabStops: RIGHT_TAB,
  spacing: { before: 118, after: 0 },
  keepNext: true,
});

const subLine = (text) => new Paragraph({
  children: [t(text, { color: GREY, size: S - 1 })],
  spacing: { after: 50 },
  keepNext: true,
});

const intro = (text) => new Paragraph({
  children: [t(text)],
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 48, line: 228 },
  indent: { left: 120 },
});


// project title: no bullet, name in blue with the URL beside it
const projectName = (name, url) => new Paragraph({
  children: [
    new TextRun({ text: name, bold: true, size: S + 1, color: BLUE, font: F }),
    ...(url ? [t('   ' + url, { color: GREY, size: S - 1 })] : []),
  ],
  spacing: { before: 96, after: 16 },
  keepNext: true,
});

const projectDesc = (text) => new Paragraph({
  children: [t(text)],
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 30, line: 228 },
  indent: { left: 120 },
  keepNext: true,
});

const pBullet = (children) => new Paragraph({
  children: [t('\u25AA  ', { color: BLUE, bold: true }), ...children],
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 30, line: 228 },
  indent: { left: 380, hanging: 180 },
});

// ── document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: { default: { document: { run: { font: F, size: S, color: BODY } } } },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: 16838 },
        margin: { top: MARGIN, right: MARGIN, bottom: convertInchesToTwip(0.45), left: MARGIN },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ children: ['Page ', PageNumber.CURRENT, ' | ', PageNumber.TOTAL_PAGES],
                          size: S - 2, color: GREY, font: F }),
          ],
        })],
      }),
    },
    children: [

      // ── header ──────────────────────────────────────────────────────────
      new Paragraph({
        children: [
          new TextRun({ text: 'Mihail Mihaylov', bold: true, size: 34, color: BLUE, font: F }),
          t('\t'), t('Sofia, Bulgaria • +359 876 587 044', { color: GREY }),
        ],
        tabStops: RIGHT_TAB,
        spacing: { after: 0 },
      }),
      new Paragraph({
        children: [t('\t'), t('mihaylov.io • m.mihaylov94@gmail.com', { color: GREY })],
        tabStops: RIGHT_TAB, spacing: { after: 0 },
      }),
      new Paragraph({
        children: [t('\t'), t('linkedin.com/in/mihail-m-mihaylov', { color: GREY })],
        tabStops: RIGHT_TAB, spacing: { after: 90 },
      }),

      // ── title block with left accent bar ────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: 'Solutions Architect | AI, Automation & Integrations',
                                 bold: true, size: 24, color: BLUE, font: F })],
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: BLUE, space: 8 } },
        indent: { left: 120 },
        spacing: { after: 90 },
      }),

      // ── summary ─────────────────────────────────────────────────────────
      body([t('Solutions Architect specialising in custom tools and AI systems. Recent work includes production MCP servers, agentic workflows, and retrieval-augmented generation using vector search. Works directly with clients to understand their needs, and takes projects from initial requirements and solution design through development, deployment, and ongoing support, using TypeScript, Node.js, Vue, PHP, PostgreSQL, and pgvector on AWS.')]),
      body([t('Previously spent three years delivering projects for Deloitte LLP UK, designing solutions for enterprise clients and owning delivery from proposal to production. Managed a support engineering team that grew to fifteen people.')]),

      // ── experience ──────────────────────────────────────────────────────
      sectionHeading('Professional Experience'),

      roleLine('Solutions Architect', 'Businessmap', 'Jun 2023 – Current'),
      subLine('Sofia, Bulgaria'),
      intro('Designs and delivers integrations, custom applications, and internal tools that extend Businessmap\u2019s capabilities for customers and the wider business. Combines development on the product API with low-code automation, choosing the approach based on business needs, technical requirements, and budget.'),
      bullet([t('Built a '), tb('custom MCP server and supporting Claude Skills'), t(', backed by an SSO-authenticated proxy that strips personally identifiable information, letting business teams query CRM and internal platform data conversationally from Claude Desktop, Claude Code, and the browser.')]),
      bullet([t('Led the migration of a PHP CodeIgniter monolith to a single sign-on portal with a CodeIgniter API backend and Vue.js front end, consolidating 60 tools and generalising client-specific builds into reusable products. Now used by '), tb('100+ clients'), t(', and the basis for a '), tb('50% increase in Solution Architecture team revenue'), t(' through Support Package sales.')]),
      bullet([t('Designed and built a bi-directional, fully configurable integration between our platform and an external CRM, live over webhooks across '), tb('100,000+ records'), t(', with queue-based conflict resolution and targeted updates limited to fields that actually changed.')]),
      bullet([t('Built a Partner Hub integrating external CRM and billing systems, automating commission calculation across 50+ partners and '), tb('cutting a quarterly process from two weeks to two days'), t('.')]),
      bullet([t('Architecting and developing '), tb('40+ custom full-stack applications'), t(' that make administrative operations and reporting scalable, built on our platform API using PHP (CodeIgniter), Vue.js, and REST APIs.')]),
      bullet([t('Designing, building, and maintaining business process automation and system integrations using Zapier, Microsoft Power Automate, and n8n, delivering end-to-end solutions across finance, HR, and operations that save the business hundreds of hours of manual effort annually.')]),
      bullet([t('Acting as a technical escalation point, supporting production systems, ensuring stability, performance, and secure deployments.')]),

      roleLine('Technical Solution Architect', 'Deloitte LLP UK', 'Mar 2022 – Jun 2023'),
      subLine('Glasgow, United Kingdom'),
      intro('Designed and delivered automation solutions for enterprise clients, translating business requirements into technical designs and leading developers through implementation and testing. Shaped solution proposals directly with clients, and supported production rollouts and post-launch stabilisation.'),
      bullet([t('Won '), tb('four new projects'), t(' by introducing new technology, the Microsoft Power Platform, within the technical stack of the team.')]),
      bullet([t('Saved clients '), tb('10,000+ hours and £250,000 annually'), t(' by developing and implementing effective document processing automation.')]),
      bullet([t('Optimised governance of timesheet and forecasting tools through development of two innovative solutions for clients, resulting in saving '), tb('5,000+ hours per year'), t(' and improving governance by 30%.')]),
      bullet([t('Conceived, developed, and delivered multiple client projects leveraging advanced expertise in UiPath, Automation Anywhere, Python, SQL Server, C#, Microsoft Power Platform, and Azure Forms Recogniser.')]),

      roleLine('Automation Engineer to Solution Architect', 'Momenta Group Global', 'May 2020 – Mar 2022'),
      subLine('Contractor for Deloitte LLP UK • Glasgow, United Kingdom'),
      new Paragraph({
        children: [ti('Operational Solution Architect (Nov 2021 – Mar 2022) • Principal Automation Engineer (Apr – Nov 2021) • Senior Automation Engineer (Sep 2020 – Apr 2021) • Graduate Automation Engineer (May – Sep 2020)', { color: GREY, size: S - 1 })],
        spacing: { after: 50 },
        keepNext: true,
      }),
      intro('Progressed from graduate engineer to solution architect in under two years, across RPA design, delivery, support, and team leadership for enterprise clients. Line manager for a support engineering function that grew to fifteen people, and lead on delivery teams of three to four engineers per project.'),
      bullet([t('Brought more than '), tb('£80,000 in additional revenue'), t(' by designing over 40 changes consistent with client requirements.')]),
      bullet([t('Minimised overall '), tb('error rates by 25%'), t(' and '), tb('support time by 15%'), t(' through effective management of migration projects that optimised all internal automations into new platforms.')]),
      bullet([t('Built and ran the support engineering function: '), tb('hired, trained and mentored a team that grew to fifteen'), t(', advancing two engineers to senior roles within six months, with retention as high as 90%.')]),

      // ── projects ────────────────────────────────────────────────────────
      sectionHeading('Selected Projects'),

      projectName('Glotsmith', 'glotsmith.com'),
      projectDesc('Language-learning SaaS I designed, built, deployed and operate single-handedly. Vue 3, Vite and TypeScript front end; Node.js, Express and TypeScript back end, behind an 85% coverage gate in CI.'),
      pBullet([t('Runs on AWS: EC2 behind Cloudflare, RDS PostgreSQL with point-in-time recovery and a rehearsed restore drill, and S3 through an IAM instance role rather than static keys.')]),
      pBullet([t('Google Cloud Translation, Vision OCR and Speech behind a pluggable provider layer.')]),
      pBullet([t('Payments through Paddle as Merchant of Record.')]),
      pBullet([t('Fully automated deployment through GitHub Actions: a scripted release across staging and production, automated pre-deploy database snapshots and scripted rollback.')]),
      pBullet([t('GDPR, EU Digital Services Act, CCPA and DMCA obligations implemented in code and schema, with CI tests that fail the build when published legal statements and running configuration drift apart.')]),

      projectName('Threadline', 'threadline.mihaylov.io'),
      projectDesc('Moderated community forum built around role-based moderation, reporting workflows and an audit trail. Server-rendered CodeIgniter 4 and PHP on PostgreSQL, with Bootstrap 5 and vanilla JavaScript.'),
      pBullet([t('Three-tier role model of member, moderator and administrator, with a moderation queue, category approval, and audit logs recording every moderation and administrative action.')]),
      pBullet([t('Google OAuth 2.0 sign-in alongside local accounts with email verification and password reset, and reCAPTCHA v3 on registration, login and password-reset forms.')]),
      pBullet([t('CSRF protection on every form, user-generated HTML sanitised with HTMLPurifier against an allow-list, and an enforced Content Security Policy.')]),
      pBullet([t('Runs in Docker on AWS EC2 behind Cloudflare and Traefik. Source published on GitHub.')]),

      projectName('Portfolio & AI Assistant', 'mihaylov.io'),
      projectDesc('My portfolio site with a RAG assistant that answers questions about my work from a curated knowledge base.'),
      pBullet([t('Nuxt 4 and TypeScript, statically prerendered.')]),
      pBullet([t('Self-hosted n8n for orchestration, using its AI agent node with tool calling so the model chooses its own retrieval steps rather than following a fixed pipeline.')]),
      pBullet([t('PostgreSQL with pgvector for embeddings and vector search over a versioned markdown knowledge base.')]),
      pBullet([t('Runs in Docker on an AWS EC2 instance behind Cloudflare and Traefik, alongside the n8n instance and a shared pgvector database.')]),

      // ── education ───────────────────────────────────────────────────────
      sectionHeading('Education & Credentials'),
      new Paragraph({
        children: [tb('MSc Advanced Computer Science, Distinction'), t('\t'), t('Sep 2018 – Sep 2019', { color: GREY })],
        tabStops: RIGHT_TAB, spacing: { after: 0 },
      }),
      subLine('University of Strathclyde, Glasgow, UK'),
      new Paragraph({
        children: [ti('Dissertation: Predicting the Resolution Time and Priority of Bug Reports, A Deep Learning Approach', { color: GREY, size: S - 1 })],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [tb('BEng (Hons) Computer and Electronic Systems'), t('\t'), t('Sep 2013 – Jun 2017', { color: GREY })],
        tabStops: RIGHT_TAB, spacing: { after: 0 },
      }),
      subLine('University of Strathclyde, Glasgow, UK'),

      sectionHeading('Technologies'),
      body([t('JavaScript, TypeScript, Node.js, Express, Vue 3, Nuxt, React, Vite, Tailwind CSS, PHP, CodeIgniter, Laravel, PostgreSQL, pgvector, MySQL, SQL Server, REST APIs, webhooks, AWS (EC2, RDS, S3, IAM, SES, SNS, VPC), Cloudflare, Docker, Traefik, GitHub Actions, Git, Linux, LLM APIs, retrieval-augmented generation, vector search, MCP, Google Cloud AI, Azure AI Document Intelligence, n8n, Power Automate, Power Platform, Zapier, UiPath, Automation Anywhere, Vitest, Playwright, Paddle')]),

      sectionHeading('Professional Training & Certifications'),
      body([t('UiPath Certified Advanced RPA Developer (UiARD) • Certified RPA Associate (UiRPA) • Automation Anywhere Certified Advanced RPA Professional')]),
      new Paragraph({
        children: [tb('Languages  '), t('Bulgarian (Native) | English (Fluent, UK educated)')],
        spacing: { before: 40 },
      }),
    ],
  }],
});

const OUT_DIR = path.join(__dirname, 'build');
const OUT = path.join(OUT_DIR, 'Mihail_Mihaylov_CV.docx');

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log('Wrote ' + OUT);
});
