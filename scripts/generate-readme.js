#!/usr/bin/env node
/**
 * PAWSTER - Smart Static README Generator (FREE - No API needed)
 * ==============================================================
 * Reads your actual source files and extracts:
 *   - Spring Boot: @GetMapping/@PostMapping/@PutMapping/@DeleteMapping endpoints
 *   - Spring Boot: @Entity classes, Security config, JWT config
 *   - PHP: Route definitions, controller methods, middleware
 *   - React: Routes, API calls (axios), components, hooks
 *
 * Usage:
 *   node generate-readme.js          # Update all READMEs
 *   node generate-readme.js sb       # Update only sb/README.md
 *   node generate-readme.js php      # Update only php/README.md
 *   node generate-readme.js react    # Update only react/README.md
 *
 * Install git hook (auto-run on every commit):
 *   node generate-readme.js --install-hook
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function readFile(filePath) {
  try { return fs.readFileSync(filePath, "utf8"); } catch { return ""; }
}

function timestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function walkDir(dir, ignore, extensions, results = []) {
  if (!fs.existsSync(dir)) return results;
  let items;
  try { items = fs.readdirSync(dir); } catch { return results; }
  for (const item of items) {
    if (ignore.some((ig) => item === ig || item.startsWith("."))) continue;
    const fullPath = path.join(dir, item);
    let stat;
    try { stat = fs.statSync(fullPath); } catch { continue; }
    if (stat.isDirectory()) walkDir(fullPath, ignore, extensions, results);
    else if (extensions.includes(path.extname(item).toLowerCase())) results.push(fullPath);
  }
  return results;
}

function walkTree(dir, ignore, prefix, depth) {
  if (depth > 6) return "";
  let output = "";
  let items;
  try { items = fs.readdirSync(dir).sort(); } catch { return ""; }
  const visible = items.filter((i) => !ignore.some((ig) => i === ig || i.startsWith(".")));
  visible.forEach((item, i) => {
    const full = path.join(dir, item);
    const isLast = i === visible.length - 1;
    const conn = isLast ? "└── " : "├── ";
    const child = prefix + (isLast ? "    " : "│   ");
    let stat;
    try { stat = fs.statSync(full); } catch { return; }
    if (stat.isDirectory()) {
      output += `${prefix}${conn}${item}/\n`;
      output += walkTree(full, ignore, child, depth + 1);
    } else {
      output += `${prefix}${conn}${item}\n`;
    }
  });
  return output;
}

function buildTree(baseDir, scanDirs, ignore) {
  let output = "";
  for (const sd of scanDirs) {
    const full = path.join(baseDir, sd);
    if (!fs.existsSync(full)) continue;
    output += `├── ${sd}/\n`;
    output += walkTree(full, ignore, "│   ", 0);
  }
  return output;
}

function mdTable(headers, rows) {
  if (!rows.length) return "_None found._\n";
  const cols = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] || "").length)));
  const header = "| " + headers.map((h, i) => h.padEnd(cols[i])).join(" | ") + " |";
  const sep    = "| " + cols.map((c) => "-".repeat(c)).join(" | ") + " |";
  const body   = rows.map((r) => "| " + r.map((c, i) => (c || "").padEnd(cols[i])).join(" | ") + " |").join("\n");
  return [header, sep, body].join("\n") + "\n";
}

// ─────────────────────────────────────────────
// ══════════════════════════════════════════════
//  SPRING BOOT ANALYZER
// ══════════════════════════════════════════════
// ─────────────────────────────────────────────
function analyzeSpringBoot(dir) {
  const ignore = ["target", "node_modules", ".mvn", ".git"];
  const files = walkDir(dir, ignore, [".java", ".properties", ".yml", ".yaml"]);

  const endpoints = [];
  const entities = [];
  const securityNotes = [];
  const configLines = [];
  const controllers = {};
  const fileDescriptions = [];

  for (const filePath of files) {
    const content = readFile(filePath);
    const fileName = path.basename(filePath);
    const relativePath = path.relative(dir, filePath);

    // ── application.properties / yml ──
    if (fileName === "application.properties" || fileName === "application.yml") {
      const interesting = ["server.port","spring.datasource","spring.jpa","jwt.","app.jwt","spring.mail","cors","allowed-origins","spring.security","spring.profiles"];
      for (const line of content.split("\n")) {
        const t = line.trim();
        if (t && !t.startsWith("#") && interesting.some((k) => t.toLowerCase().includes(k)))
          configLines.push(t);
      }
      fileDescriptions.push({ file: relativePath, role: "App configuration (DB, JWT, mail, server)" });
      continue;
    }

    if (!fileName.endsWith(".java")) continue;

    // ── Detect file role ──
    let role = "";
    if (content.includes("@RestController") || content.includes("@Controller")) role = "REST Controller";
    else if (content.includes("@Service")) role = "Service layer";
    else if (content.includes("@Repository")) role = "JPA Repository";
    else if (content.includes("@Entity")) {
      role = "JPA Entity (DB table)";
      const m = content.match(/public\s+class\s+(\w+)/);
      if (m) entities.push(m[1]);
    }
    else if (content.includes("@Configuration") && content.includes("Security")) role = "Security configuration";
    else if (content.includes("@Configuration")) role = "Spring configuration";
    else if (content.includes("@Component") && fileName.includes("Filter")) role = "JWT request filter";
    else if (content.includes("@Component")) role = "Spring component";
    else if (fileName.includes("Application.java")) role = "Spring Boot entry point (@SpringBootApplication)";
    else if (fileName.includes("Utils") || fileName.includes("Util")) role = "Utility class";
    if (role) fileDescriptions.push({ file: relativePath, role });

    // ── Security config notes ──
    if (content.includes("SecurityFilterChain") || content.includes("HttpSecurity")) {
      const permitAll = [...content.matchAll(/\.requestMatchers\(([^)]+)\)\.permitAll/g)].map((m) => m[1].replace(/["\s]/g, ""));
      if (permitAll.length) securityNotes.push(`Public (no auth): ${permitAll.join(", ")}`);
      if (content.includes(".anyRequest().authenticated()")) securityNotes.push("All other requests require JWT Bearer token");
      if (content.includes("CorsConfiguration") || content.includes("cors()")) securityNotes.push("CORS is configured in SecurityConfig");
    }

    if (!content.includes("@RestController") && !content.includes("@Controller")) continue;

    // ── Extract class name + base mapping ──
    const classMatch = content.match(/public\s+class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : fileName.replace(".java","");
    const baseMapping = content.match(/@RequestMapping\s*\(\s*["']([^"']+)["']/);
    const basePath = baseMapping ? baseMapping[1] : "";
    if (!controllers[className]) controllers[className] = [];

    // ── Extract endpoints ──
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const httpMap = ["GetMapping","PostMapping","PutMapping","DeleteMapping","PatchMapping","RequestMapping"].find((m) => line.includes(`@${m}`));
      if (!httpMap) continue;

      const pathMatch = line.match(/@\w+Mapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/);
      const mappedPath = pathMatch ? pathMatch[1] : "";
      const fullPath = (basePath + mappedPath).replace(/\/+/g, "/") || "/";

      let method = "GET";
      if (httpMap === "PostMapping") method = "POST";
      else if (httpMap === "PutMapping") method = "PUT";
      else if (httpMap === "DeleteMapping") method = "DELETE";
      else if (httpMap === "PatchMapping") method = "PATCH";

      let methodName = "";
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const sig = lines[j].trim().match(/(?:public|private|protected)\s+\S+\s+(\w+)\s*\(/);
        if (sig) { methodName = sig[1]; break; }
      }

      const desc = methodName.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
      const endpoint = { method, path: fullPath, controller: className, auth: "Yes (JWT)", desc };
      endpoints.push(endpoint);
      controllers[className].push(endpoint);
    }
  }

  return { endpoints, entities, securityNotes, configLines, controllers, fileDescriptions };
}

function generateSpringBootReadme(dir) {
  const { endpoints, entities, securityNotes, configLines, controllers, fileDescriptions } = analyzeSpringBoot(dir);

  let md = "";

  md += `## 🏗️ Architecture Overview\n\n`;
  md += `PAWSTER's Spring Boot backend is a RESTful API secured with Spring Security and JWT authentication. `;
  md += `Clients receive a signed token on login and must send it as a \`Bearer\` header on every protected request. `;
  md += `Spring Data JPA handles all database access`;
  if (entities.length) md += ` with ${entities.length} entity model${entities.length > 1 ? "s" : ""}: ${entities.join(", ")}`;
  md += `. The app follows standard Spring MVC: Controllers → Services → Repositories.\n\n`;

  md += `## 📁 Project Structure\n\n`;
  md += fileDescriptions.length
    ? mdTable(["File", "Role"], fileDescriptions.map((f) => [f.file, f.role]))
    : "_No Java files found._\n";
  md += "\n";

  md += `## 🔐 Authentication Flow\n\n\`\`\`\n`;
  md += `1. POST /api/auth/register  → Hash password (BCrypt) + save to DB\n`;
  md += `                           → Return success\n\n`;
  md += `2. POST /api/auth/login     → CustomUserDetailsService loads user\n`;
  md += `                           → JwtUtils.generateToken() signs JWT\n`;
  md += `                           → Return { token, user info }\n\n`;
  md += `3. Protected Request        → Client: Authorization: Bearer <token>\n`;
  md += `                           → JwtAuthenticationFilter validates token\n`;
  md += `                           → Spring Security context set\n`;
  md += `                           → Controller executes\n\`\`\`\n\n`;

  if (securityNotes.length) {
    md += `**Security Rules:**\n`;
    for (const n of securityNotes) md += `- ${n}\n`;
    md += "\n";
  }

  md += `## 🌐 API Endpoints\n\n`;
  if (Object.keys(controllers).length) {
    for (const [ctrl, eps] of Object.entries(controllers)) {
      md += `### ${ctrl}\n\n`;
      md += mdTable(["Method","Path","Auth","Description"], eps.map((e) => [e.method, e.path, e.auth, e.desc]));
      md += "\n";
    }
  } else {
    md += "_No endpoints extracted. Make sure @RestController and @GetMapping etc. are present._\n\n";
  }

  md += `## 🗄️ Data Flow\n\n\`\`\`\n`;
  md += `HTTP Request\n`;
  md += `   └─► JwtAuthenticationFilter   (validates Bearer token)\n`;
  md += `         └─► Spring Security      (sets auth context)\n`;
  md += `               └─► @RestController (handles route)\n`;
  md += `                     └─► @Service  (business logic)\n`;
  md += `                           └─► @Repository / JPA (DB query)\n`;
  md += `                                 └─► JSON Response\n\`\`\`\n\n`;

  md += `## ⚙️ Configuration\n\n`;
  if (configLines.length) {
    md += "```properties\n" + configLines.join("\n") + "\n```\n\n";
  } else {
    md += "_No application.properties found or no relevant keys detected._\n\n";
  }

  if (entities.length) {
    md += `## 🗃️ Database Entities\n\n`;
    md += entities.map((e) => `- \`${e}\``).join("\n") + "\n\n";
  }

  return md;
}

// ─────────────────────────────────────────────
// ══════════════════════════════════════════════
//  PHP ANALYZER
// ══════════════════════════════════════════════
// ─────────────────────────────────────────────
function analyzePHP(dir) {
  const ignore = ["vendor","node_modules",".git","uploads"];
  const files = walkDir(dir, ignore, [".php",".json"]);

  const routes = [];
  const middlewares = [];
  const fileDescriptions = [];
  const configLines = [];

  for (const filePath of files) {
    const content = readFile(filePath);
    const fileName = path.basename(filePath);
    const relativePath = path.relative(dir, filePath);

    // ── Describe file ──
    let role = "";
    if (fileName === "index.php") role = "Entry point — bootstraps app, loads router";
    else if (fileName === "routes.php") role = "All route definitions";
    else if (fileName === "Router.php") role = "Custom HTTP router (method + URI matching)";
    else if (fileName.includes("Middleware")) role = "Request middleware (JWT validation)";
    else if (fileName.includes("Controller")) role = "Controller — handles HTTP requests";
    else if (fileName === "composer.json") role = "PHP dependency manifest";
    else if (fileName === ".htaccess") role = "Rewrites all requests to index.php";
    if (role) fileDescriptions.push({ file: relativePath, role });

    // ── Extract routes ──
    const patterns = [
      /\$router->(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:\[([^\]]+)\]|['"]([^'"]+)['"])/gi,
      /Route::(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const routePath = match[2];
        const handler = (match[3] || match[4] || "").replace(/\s+/g, " ").trim();
        const beforeRoute = content.slice(0, match.index);
        const hasAuth = beforeRoute.includes("JwtMiddleware") || beforeRoute.includes("middleware");
        routes.push({ method, path: routePath, handler: handler || "—", auth: hasAuth ? "Yes (JWT)" : "No" });
      }
    }

    // ── Middleware detection ──
    if (content.includes("JwtMiddleware") || content.includes("validateToken")) {
      if (!middlewares.includes("JwtMiddleware — validates Bearer token on protected routes"))
        middlewares.push("JwtMiddleware — validates Bearer token on protected routes");
    }

    // ── Env config ──
    if (fileName === ".env.example" || fileName === ".env") {
      for (const line of content.split("\n")) {
        const t = line.trim();
        if (t && !t.startsWith("#")) configLines.push(t);
      }
    }
  }

  return { routes, middlewares, fileDescriptions, configLines };
}

function generatePHPReadme(dir) {
  const { routes, middlewares, fileDescriptions, configLines } = analyzePHP(dir);

  let md = "";

  md += `## 🏗️ Architecture Overview\n\n`;
  md += `PAWSTER's PHP backend uses a lightweight custom MVC structure. All HTTP requests are funneled through \`index.php\` via Apache's \`.htaccess\` rewrite rules. `;
  md += `The router matches method + URI and dispatches to the correct Controller. Protected routes pass through \`JwtMiddleware\` which validates the \`Authorization: Bearer\` header before the controller executes.\n\n`;

  md += `## 📁 Project Structure\n\n`;
  md += fileDescriptions.length
    ? mdTable(["File","Role"], fileDescriptions.map((f) => [f.file, f.role]))
    : "_No PHP files found._\n";
  md += "\n";

  md += `## 🔐 Authentication Flow\n\n\`\`\`\n`;
  md += `1. POST /api/auth/login    → Validate credentials against DB\n`;
  md += `                          → Generate signed JWT\n`;
  md += `                          → Return { token, user }\n\n`;
  md += `2. Protected Request       → Client sends: Authorization: Bearer <token>\n`;
  md += `                          → JwtMiddleware::handle() validates token\n`;
  md += `                          → Valid: Controller runs\n`;
  md += `                          → Invalid: 401 Unauthorized\n\`\`\`\n\n`;

  if (middlewares.length) {
    md += `**Middleware:**\n`;
    for (const m of middlewares) md += `- ${m}\n`;
    md += "\n";
  }

  md += `## 🌐 API Endpoints\n\n`;
  if (routes.length) {
    const grouped = {};
    for (const r of routes) {
      const group = r.path.split("/")[2] || "root";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(r);
    }
    for (const [group, groupRoutes] of Object.entries(grouped)) {
      md += `### /${group}\n\n`;
      md += mdTable(["Method","Path","Auth","Handler"], groupRoutes.map((r) => [r.method, r.path, r.auth, r.handler]));
      md += "\n";
    }
  } else {
    md += "_No routes extracted. Make sure routes.php uses `$router->get(...)` etc._\n\n";
  }

  md += `## 🗄️ Data Flow\n\n\`\`\`\n`;
  md += `HTTP Request\n`;
  md += `   └─► .htaccess           (rewrites all to index.php)\n`;
  md += `         └─► index.php     (bootstraps app)\n`;
  md += `               └─► Router  (matches method + URI)\n`;
  md += `                     └─► JwtMiddleware (if protected)\n`;
  md += `                           └─► Controller::method()\n`;
  md += `                                 └─► PDO / DB\n`;
  md += `                                       └─► JSON Response\n\`\`\`\n\n`;

  if (configLines.length) {
    md += `## ⚙️ Configuration (.env)\n\n\`\`\`env\n${configLines.join("\n")}\n\`\`\`\n\n`;
  }

  return md;
}

// ─────────────────────────────────────────────
// ══════════════════════════════════════════════
//  REACT ANALYZER
// ══════════════════════════════════════════════
// ─────────────────────────────────────────────
function analyzeReact(dir) {
  const ignore = ["node_modules",".git","dist","build"];
  const files = walkDir(dir, ignore, [".jsx",".js",".ts",".tsx"]);

  const routes = [];
  const apiCalls = [];
  const components = [];
  const hooks = [];
  const axiosConfig = [];

  for (const filePath of files) {
    const content = readFile(filePath);
    const fileName = path.basename(filePath);
    const relativePath = path.relative(dir, filePath);

    // ── File type ──
    let type = "Component";
    if (/^use[A-Z]/.test(fileName)) { type = "Custom Hook"; hooks.push(fileName.replace(/\.\w+$/, "")); }
    else if (/^App\.(jsx|tsx|js)$/.test(fileName)) type = "Root App";
    else if (fileName.includes("Route")) type = "Route Guard";
    else if (fileName === "axios.js" || fileName.includes("integration") || fileName === "api.js") type = "API / Axios Config";
    else if (/^(main|index)\.(jsx|tsx|js)$/.test(fileName)) type = "Entry Point";

    const exportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
    const exportName = exportMatch ? exportMatch[1] : fileName.replace(/\.\w+$/, "");
    components.push({ file: relativePath, type, name: exportName });

    // ── React Router routes ──
    const routePattern = /path=["']([^"']+)["'][^>]*element=\{<(\w+)/g;
    let rm;
    while ((rm = routePattern.exec(content)) !== null)
      if (!routes.find((r) => r.path === rm[1])) routes.push({ path: rm[1], component: rm[2] });

    // ── API calls ──
    const axiosPat = /(?:axios|api|http|client)\.(get|post|put|delete|patch)\s*\(\s*[`'"](\/[^`'"]+)[`'"]/g;
    let am;
    while ((am = axiosPat.exec(content)) !== null)
      apiCalls.push({ component: exportName, method: am[1].toUpperCase(), endpoint: am[2] });

    // ── Axios config ──
    if (type === "API / Axios Config" || content.includes("baseURL") || content.includes("interceptors")) {
      const bu = content.match(/baseURL\s*:\s*["'`]([^"'`]+)["'`]/);
      if (bu) axiosConfig.push(`Base URL: \`${bu[1]}\``);
      if (content.includes("interceptors.request")) axiosConfig.push("Request interceptor: attaches JWT token to every outgoing request");
      if (content.includes("interceptors.response") && content.includes("401")) axiosConfig.push("Response interceptor: catches 401 → clears token → redirects to /login");
      if (content.includes("localStorage")) axiosConfig.push("Token stored/retrieved from localStorage");
    }
  }

  const uniqueRoutes = routes.filter((r, i, arr) => arr.findIndex((x) => x.path === r.path) === i);
  return { routes: uniqueRoutes, apiCalls, components, hooks, axiosConfig };
}

function generateReactReadme(dir) {
  const { routes, apiCalls, components, hooks, axiosConfig } = analyzeReact(dir);

  let md = "";

  md += `## 🏗️ Architecture Overview\n\n`;
  md += `PAWSTER's React frontend is a single-page application (SPA) using React Router for client-side routing. `;
  md += `An Axios instance with interceptors handles all API calls — JWT is automatically attached to every request. `;
  md += `Route guards (\`ProtectedRoute\`, \`GuestRoute\`) enforce authentication at the route level.`;
  if (hooks.length) md += ` Custom hooks (${hooks.map((h) => `\`${h}\``).join(", ")}) manage shared state.`;
  md += "\n\n";

  md += `## 📁 Project Structure\n\n`;
  md += mdTable(["File","Type","Export"], components.map((c) => [c.file, c.type, c.name]));
  md += "\n";

  md += `## 🔐 Auth & Routing Flow\n\n\`\`\`\n`;
  md += `1. User visits /login\n`;
  md += `   → GuestRoute: already logged in? → redirect to /home\n\n`;
  md += `2. Login form submitted\n`;
  md += `   → POST /api/auth/login\n`;
  md += `   → JWT stored in localStorage\n`;
  md += `   → Redirect to /home\n\n`;
  md += `3. User visits protected page\n`;
  md += `   → ProtectedRoute checks localStorage for token\n`;
  md += `   → No token → redirect to /login\n`;
  md += `   → Has token → render page\n\n`;
  md += `4. API call made\n`;
  md += `   → Axios interceptor adds: Authorization: Bearer <token>\n`;
  md += `   → 401 response → clear token → redirect to /login\n\`\`\`\n\n`;

  md += `## 📄 Pages & Routes\n\n`;
  if (routes.length) {
    md += mdTable(
      ["Route","Component","Access"],
      routes.map((r) => [
        r.path, r.component,
        r.path === "/" || /login|register|landing|about|how/i.test(r.path) ? "Public" : "Protected"
      ])
    );
  } else {
    md += "_No routes extracted. Make sure App.jsx uses `<Route path=... element=...>`._\n";
  }
  md += "\n";

  md += `## 🔗 API Calls by Component\n\n`;
  if (apiCalls.length) {
    md += mdTable(["Component","Method","Endpoint"], apiCalls.map((a) => [a.component, a.method, a.endpoint]));
  } else {
    md += "_No axios calls detected. Make sure you use `axios.get('/...')` or `api.get('/...')`._\n";
  }
  md += "\n";

  if (axiosConfig.length) {
    md += `## ⚙️ Axios Configuration\n\n`;
    for (const note of axiosConfig) md += `- ${note}\n`;
    md += "\n";
  }

  md += `## 🗄️ Data Flow\n\n\`\`\`\n`;
  md += `User Action\n`;
  md += `   └─► Component (state/handler)\n`;
  md += `         └─► integration.js / axios call\n`;
  md += `               └─► Axios interceptor adds JWT header\n`;
  md += `                     └─► API request (Spring Boot / PHP)\n`;
  md += `                           └─► JSON response\n`;
  md += `                                 └─► useState update → re-render\n\`\`\`\n\n`;

  if (hooks.length) {
    md += `## 🧩 Custom Hooks\n\n`;
    for (const h of hooks) md += `- \`${h}\` — shared stateful logic\n`;
    md += "\n";
  }

  return md;
}

// ─────────────────────────────────────────────
// README WRITER
// ─────────────────────────────────────────────
const TARGETS = {
  sb: {
    dir: path.join(ROOT, "sb"),
    readme: path.join(ROOT, "sb", "README.md"),
    label: "Spring Boot Backend",
    scanDirs: ["src/main/java/com/pawstar/pawster", "src/main/resources"],
    ignore: ["target","node_modules",".mvn",".git"],
    generate: generateSpringBootReadme,
  },
  php: {
    dir: path.join(ROOT, "php"),
    readme: path.join(ROOT, "php", "README.md"),
    label: "PHP Backend",
    scanDirs: ["Controller","Core","Middleware","src","."],
    ignore: ["vendor","node_modules",".git","uploads"],
    generate: generatePHPReadme,
  },
  react: {
    dir: path.join(ROOT, "react"),
    readme: path.join(ROOT, "react", "README.md"),
    label: "React Frontend",
    scanDirs: ["src"],
    ignore: ["node_modules",".git","dist","build"],
    generate: generateReactReadme,
  },
};

function updateReadme(key) {
  const config = TARGETS[key];
  if (!fs.existsSync(config.dir)) {
    console.log(`⚠️  Skipping ${key} — directory not found: ${config.dir}`);
    return;
  }

  console.log(`📖 Analyzing ${key}/...`);
  const content = config.generate(config.dir);
  const tree = buildTree(config.dir, config.scanDirs, config.ignore);

  const autoBlock =
`<!-- AUTO:START -->
> 🔍 **Auto-generated documentation** — last updated: ${timestamp()}
> Run \`node scripts/generate-readme.js ${key}\` to refresh.

---

${content}
## 📂 File Tree

\`\`\`
${key}/
${tree}\`\`\`

<!-- AUTO:END -->`;

  if (!fs.existsSync(config.readme)) {
    fs.writeFileSync(config.readme, `# PAWSTER — ${config.label}\n\n${autoBlock}\n`);
  } else {
    let existing = fs.readFileSync(config.readme, "utf8");
    if (existing.includes("<!-- AUTO:START -->")) {
      existing = existing.replace(/<!-- AUTO:START -->[\s\S]*?<!-- AUTO:END -->/m, autoBlock);
    } else {
      existing = existing.trimEnd() + "\n\n" + autoBlock + "\n";
    }
    fs.writeFileSync(config.readme, existing);
  }

  console.log(`✅ Updated ${config.readme}`);
}

// ─────────────────────────────────────────────
// GIT HOOK
// ─────────────────────────────────────────────
function installGitHook() {
  const hookDir = path.join(ROOT, ".git", "hooks");
  const hookPath = path.join(hookDir, "pre-commit");
  if (!fs.existsSync(hookDir)) { console.log("❌ No .git/hooks directory found."); process.exit(1); }
  const hookContent =
`#!/bin/sh
echo "🐾 Updating PAWSTER README files..."
node "$(git rev-parse --show-toplevel)/scripts/generate-readme.js"
git add sb/README.md php/README.md react/README.md
echo "✅ READMEs updated and staged."
`;
  fs.writeFileSync(hookPath, hookContent);
  fs.chmodSync(hookPath, "755");
  console.log(`✅ Git pre-commit hook installed at ${hookPath}`);
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes("--install-hook")) { installGitHook(); process.exit(0); }

const targets = args.filter((a) => TARGETS[a]);
const toUpdate = targets.length > 0 ? targets : Object.keys(TARGETS);

console.log("🐾 PAWSTER README Generator (Static Analyzer — Free)\n");
toUpdate.forEach(updateReadme);
console.log("\n✨ Done!");