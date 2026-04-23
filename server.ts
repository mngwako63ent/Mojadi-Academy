import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  let vite: any;

  if (process.env.NODE_ENV !== "production") {
    // 1. Create Vite server in middleware mode
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // 2. Use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { index: false }));
  }

  // API routes would go here (before the catch-all)

  // 3. The Catch-all handler for SPA
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip if it's a file request that wasn't caught by static/vite (e.g. .js, .css)
    if (url.includes('.') && !url.endsWith('.html')) {
      return next();
    }

    try {
      let template: string;
      if (process.env.NODE_ENV !== "production") {
        // Development: Always read fresh index.html from root
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
      } else {
        // Production: Read from dist
        template = fs.readFileSync(path.resolve(__dirname, 'dist', 'index.html'), 'utf-8');
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).send(template);
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
