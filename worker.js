// Cloudflare Worker: standalone maintenance page for Statsio.
// Keep this response synchronized with maintenant.html.
const html = String.raw`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f7f6fb">
    <meta name="description" content="Statsio est temporairement en maintenance.">
    <title>Maintenance en cours — Statsio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      :root {
        color-scheme: light;
        --purple: #8b5cf6;
        --blue: #3b82f6;
        --ink: #18181f;
        --muted: #626274;
        --surface: #f7f6fb;
        --line: #e7e4ef;
        --sans: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, monospace;
      }

      * { box-sizing: border-box; }
      html { min-height: 100%; background: var(--surface); }
      body {
        min-height: 100vh;
        margin: 0;
        color: var(--ink);
        font-family: var(--sans);
        background:
          radial-gradient(ellipse at 82% 34%, rgba(59, 130, 246, .12), transparent 34rem),
          radial-gradient(ellipse at 14% 86%, rgba(139, 92, 246, .12), transparent 30rem),
          var(--surface);
      }

      .page {
        width: min(100% - 48px, 1120px);
        min-height: 100vh;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
      }

      main {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 70px 0;
      }

      .copy {
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
        text-align: center;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        margin: 0 auto 34px;
      }

      .brand-logo {
        width: 54px;
        height: 54px;
        display: block;
      }

      .brand-name {
        font-size: 21px;
        font-weight: 800;
        letter-spacing: -.055em;
      }

      .brand-name span {
        color: var(--purple);
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        margin: 0 0 21px;
        color: #7250c5;
        font-family: var(--mono);
        font-size: 10px;
        font-weight: 600;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .eyebrow::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--purple), var(--blue));
        box-shadow: 0 0 0 4px rgba(139, 92, 246, .1);
      }

      h1 {
        margin: 0;
        font-size: clamp(48px, 7.8vw, 88px);
        line-height: 1.02;
        letter-spacing: -.075em;
        font-weight: 800;
      }

      h1 span {
        display: block;
        background: linear-gradient(105deg, #7c3aed 8%, #7250db 48%, #3b82f6 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .intro {
        max-width: 560px;
        margin: 27px auto 0;
        color: var(--muted);
        font-size: clamp(16px, 1.8vw, 19px);
        line-height: 1.75;
      }

      .detail {
        display: flex;
        align-items: flex-start;
        gap: 13px;
        max-width: 540px;
        margin: 32px auto 0;
        padding: 20px 22px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: rgba(255, 255, 255, .82);
        box-shadow: 0 12px 34px rgba(38, 31, 61, .06);
        color: #555568;
        font-size: 13px;
        line-height: 1.75;
        text-align: left;
      }

      .detail-icon {
        flex: 0 0 auto;
        width: 25px;
        height: 25px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        color: #7650d5;
        background: #f0eaff;
      }

      .detail-icon svg { width: 15px; height: 15px; }

      footer {
        min-height: 68px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border-top: 1px solid rgba(205, 199, 220, .65);
        color: #797789;
        font-size: 11px;
      }

      .footer-note {
        font-family: var(--mono);
        font-size: 9px;
        font-weight: 500;
        letter-spacing: .04em;
      }

      @media (max-width: 600px) {
        .page { width: min(100% - 32px, 480px); }
        main { padding: 52px 0; }
        .brand { margin-bottom: 29px; }
        .brand-logo { width: 46px; height: 46px; }
        .brand-name { font-size: 19px; }
        .eyebrow { font-size: 9px; margin-bottom: 17px; }
        h1 { font-size: clamp(46px, 13vw, 68px); }
        .intro { margin-top: 22px; font-size: 16px; }
        .detail { margin-top: 26px; padding: 17px; font-size: 12px; }
        footer { min-height: 62px; font-size: 10px; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { scroll-behavior: auto !important; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <main>
        <section class="copy" aria-labelledby="page-title">
          <div class="brand" aria-label="Statsio">
            <img class="brand-logo" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMTMgMTMgOTQgOTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgYXJpYS1oaWRkZW49InRydWUiPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuYmx1ZS1kYXJrICAgICB7IGZpbGw6ICMzQjgyRjY7IH0KICAgICAgLnB1cnBsZS1tZWRpdW0geyBmaWxsOiAjOEI1Q0Y2OyB9CiAgICAgIC5wdXJwbGUtbGlnaHQgIHsgZmlsbDogI2RjY2FmODsgfQogICAgICAuZGlhZy1saW5lICAgICB7IHN0cm9rZTogIzk1NWFlMDsgc3Ryb2tlLXdpZHRoOiAyLjg7IHN0cm9rZS1saW5lY2FwOiByb3VuZDsgfQogICAgPC9zdHlsZT4KCiAgICA8Y2xpcFBhdGggaWQ9ImNsaXAtcmlnaHQiIGNsaXBQYXRoVW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHBhdGggZD0iTTEwNCAxNCBMMTIxIDE0IEwxMjEgMTIxIEwxNCAxMjEgTDE0IDEwNiBaIi8+CiAgICA8L2NsaXBQYXRoPgoKICAgIDxjbGlwUGF0aCBpZD0iY2xpcC1sZWZ0IiBjbGlwUGF0aFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxwYXRoIGQ9Ik0xNCAxMDYgTDE0IC0xIEwxMjEgLTEgTDEwNiAxNCBaIi8+CiAgICA8L2NsaXBQYXRoPgogIDwvZGVmcz4KCiAgPCEtLSBDYW1lbWJlcnQgLS0+CiAgPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAtbGVmdCkiPgogICAgPGNpcmNsZSBjbGFzcz0icHVycGxlLW1lZGl1bSIgY3g9IjYwIiBjeT0iNjAiIHI9IjQwIi8+CiAgICA8cGF0aCBjbGFzcz0icHVycGxlLW1lZGl1bSIgZD0iTTYwIDYwIEwyMCA2MCBBNDAgNDAgMCAwIDEgNjAgMjAgWiIvPgogICAgPHBhdGggY2xhc3M9InB1cnBsZS1saWdodCIgZD0iTTYwIDYwIEwyMCA2MCBBNDAgNDAgMCAwIDAgNjAgMTAwIFoiLz4KICAgIDxwYXRoIGNsYXNzPSJibHVlLWRhcmsiIGQ9Ik02MCA2MCBMNjAgMjAgQTQwIDQwIDAgMCAxIDkzLjUgMzUuNSBaIi8+CiAgPC9nPgoKICA8IS0tIEJhcnJlcyBhbGlnbsOpZXMgZXQgZXNwYWPDqWVzIHVuaWZvcm3DqW1lbnQgLS0+CiAgPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAtcmlnaHQpIj4KICAgIDwhLS0gT24gZMOpZmluaXQgdW4gZXNwYWNlbWVudCBkZSAxMiBlbnRyZSBsZXMgYmFycmVzIHBvdXIgbCdleGVtcGxlIC0tPgogICAgPHJlY3QgY2xhc3M9ImJsdWUtZGFyayIgICAgIHg9IjMwIiB5PSI2OSIgd2lkdGg9IjEyIiBoZWlnaHQ9IjI0IiB0cmFuc2Zvcm09InJvdGF0ZSgtNDUgMzggODEpIi8+CiAgICA8cmVjdCBjbGFzcz0icHVycGxlLW1lZGl1bSIgeD0iNDYiIHk9IjQzIiB3aWR0aD0iMTIiIGhlaWdodD0iNDgiIHRyYW5zZm9ybT0icm90YXRlKC00NSA1NCA2NykiLz4KICAgIDxyZWN0IGNsYXNzPSJibHVlLWRhcmsiICAgICB4PSI2MiIgeT0iOSIgIHdpZHRoPSIxMiIgaGVpZ2h0PSI4OCIgdHJhbnNmb3JtPSJyb3RhdGUoLTQ1IDcwIDUzKSIvPgogICAgPHJlY3QgY2xhc3M9InB1cnBsZS1tZWRpdW0iIHg9IjgwIiB5PSIyNSIgd2lkdGg9IjEyIiBoZWlnaHQ9IjI0IiB0cmFuc2Zvcm09InJvdGF0ZSgtNDUgODYgMzkpIi8+CiAgPC9nPgoKICA8IS0tIExpZ25lIGRpYWdvbmFsZSAtLT4KICA8bGluZSBjbGFzcz0iZGlhZy1saW5lIiB4MT0iMTUiIHkxPSIxMDUiIHgyPSIxMDUiIHkyPSIxNSIvPgo8L3N2Zz4K" alt="">
            <span class="brand-name">stats<span>io</span></span>
          </div>
          <p class="eyebrow">Information aux visiteurs</p>
          <h1 id="page-title">On revient <span>très vite</span></h1>
          <p class="intro">Statsio est temporairement indisponible pendant une opération de maintenance.</p>
          <div class="detail">
            <span class="detail-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5 19 6v5.2c0 4.4-2.8 7.5-7 9.3-4.2-1.8-7-4.9-7-9.3V6l7-2.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
            <span>Nous effectuons une mise à jour technique et des vérifications de sécurité afin de maintenir un service fiable. Merci de votre patience ; Statsio sera de nouveau accessible une fois l’intervention terminée.</span>
          </div>
        </section>
      </main>
      <footer>
        <span>© Statsio</span>
        <span class="footer-note">Merci de votre compréhension</span>
      </footer>
    </div>
  </body>
</html>
`;
export default {
  async fetch() {
    return new Response(html, {
      status: 503,
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "cache-control": "no-store",
      },
    });
  },
};
