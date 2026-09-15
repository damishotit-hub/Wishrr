export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #E8F5F2; color: #004040; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; box-sizing: border-box; background: #FFFFFF; border: 2px solid #004040; border-radius: 0.875rem; box-shadow: 5px 5px 0 #004040; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #004040; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.5rem; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; border: 2px solid #004040; box-shadow: 3px 3px 0 #004040; }
      .primary { background: #00A88F; color: #004040; }
      .secondary { background: #FFFFFF; color: #004040; }
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
