export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Wishr - This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" />
    <style>
      :root { --background: oklch(0.989 0.002 260); --foreground: oklch(0.245 0.012 260); --card: oklch(1 0 0); --primary: oklch(0.29 0.018 260); --primary-foreground: oklch(0.99 0.002 260); --border: oklch(0.87 0.008 260); --shadow: 0 4px 20px color-mix(in oklch, var(--foreground) 5%, transparent); }
      body { font: 15px/1.5 'Plus Jakarta Sans', system-ui, sans-serif; background: var(--background); color: var(--foreground); display: grid; place-items: center; min-height: 100vh; box-sizing: border-box; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; box-sizing: border-box; background: var(--card); border: 1px solid var(--border); border-radius: 0.5rem; box-shadow: var(--shadow); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: var(--foreground); margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.5rem; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; border: 1px solid var(--border); box-shadow: var(--shadow); }
      .primary { background: var(--primary); color: var(--primary-foreground); }
      .secondary { background: var(--card); color: var(--foreground); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
