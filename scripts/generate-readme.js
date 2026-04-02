#!/usr/bin/env node
/**
 * PAWSTER - Smart Static README Generator (FREE - No API needed)
 * ==============================================================
 * Reads your actual source files and extracts:
 *   - Spring Boot: @GetMapping/@PostMapping/@PutMapping/@DeleteMapping endpoints
 *   - Spring Boot: @Entity classes, Security config, JWT config
 *   - PHP: Route definitions, controller methods, middleware
 *   - React: Routes, API calls (axios), components, hooks
 *   - Django: urls.py routes, views, models, serializers, settings
 *
 * Usage:
 *   node generate-readme.js          # Update all READMEs
 *   node generate-readme.js sb       # Update only sb/README.md
 *   node generate-readme.js php      # Update only php/README.md
 *   node generate-readme.js react    # Update only react/README.md
 *   node generate-readme.js django   # Update only django/README.md
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
  md += `                     └─► API request (Spring Boot / PHP / Django)\n`;
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
// ══════════════════════════════════════════════
//  DJANGO ANALYZER
// ══════════════════════════════════════════════
// ─────────────────────────────────────────────
function analyzeDjango(dir) {
  const ignore = ["__pycache__", ".git", "node_modules", "venv", "env", ".venv", "migrations", "staticfiles", "media"];
  const files = walkDir(dir, ignore, [".py", ".env", ".cfg", ".ini", ".toml"]);

  const endpoints = [];         // { method, path, view, auth, desc }
  const models = [];            // model class names
  const serializers = [];       // serializer class names
  const viewsets = [];          // viewset class names
  const fileDescriptions = [];  // { file, role }
  const configLines = [];       // important settings.py lines
  const authNotes = [];         // security/permission notes
  const appNames = [];          // installed Django apps (custom)

  // ── Track which url patterns came from which include() ──
  const urlIncludes = {}; // prefix → app

  for (const filePath of files) {
    const content = readFile(filePath);
    const fileName = path.basename(filePath);
    const relativePath = path.relative(dir, filePath);

    // ── .env file ──
    if (fileName === ".env" || fileName === ".env.example") {
      for (const line of content.split("\n")) {
        const t = line.trim();
        if (t && !t.startsWith("#")) configLines.push(t);
      }
      fileDescriptions.push({ file: relativePath, role: "Environment variables (DB, secret key, debug)" });
      continue;
    }

    if (!fileName.endsWith(".py")) continue;

    // ── settings.py ──
    if (fileName === "settings.py") {
      const interesting = [
        "DATABASES", "SECRET_KEY", "DEBUG", "ALLOWED_HOSTS",
        "INSTALLED_APPS", "REST_FRAMEWORK", "CORS_ALLOWED_ORIGINS",
        "CORS_ORIGIN_WHITELIST", "SIMPLE_JWT", "JWT_AUTH",
        "AUTH_USER_MODEL", "MIDDLEWARE", "AUTHENTICATION_BACKENDS",
        "DEFAULT_AUTHENTICATION_CLASSES", "DEFAULT_PERMISSION_CLASSES",
      ];
      const lines = content.split("\n");
      let inBlock = false;
      let blockDepth = 0;
      for (const line of lines) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const isKey = interesting.some((k) => t.startsWith(k));
        if (isKey) {
          inBlock = true;
          blockDepth = 0;
        }
        if (inBlock) {
          configLines.push(line.trimEnd());
          blockDepth += (line.match(/[\[{(]/g) || []).length;
          blockDepth -= (line.match(/[\]})]/g) || []).length;
          if (blockDepth <= 0 && configLines.length > 0 && !isKey) {
            inBlock = false;
          }
        }
      }
      // Extract custom apps from INSTALLED_APPS
      const appsMatch = content.match(/INSTALLED_APPS\s*=\s*\[([\s\S]*?)\]/);
      if (appsMatch) {
        const appEntries = appsMatch[1].matchAll(/['"]([a-z][a-z0-9_]*)['"](?!\s*,\s*#\s*django)/g);
        const builtins = new Set(["django","rest_framework","corsheaders","drf_yasg","debug_toolbar","channels"]);
        for (const m of appEntries) {
          if (!m[1].startsWith("django.") && !builtins.has(m[1])) appNames.push(m[1]);
        }
      }
      // Auth/permission globals
      if (content.includes("IsAuthenticated")) authNotes.push("Default permission: `IsAuthenticated` (JWT required on most endpoints)");
      if (content.includes("AllowAny")) authNotes.push("Some endpoints use `AllowAny` (public access)");
      if (content.includes("JWTAuthentication") || content.includes("SimpleJWT")) authNotes.push("Authentication: `JWTAuthentication` via djangorestframework-simplejwt");
      if (content.includes("TokenAuthentication")) authNotes.push("Authentication: DRF `TokenAuthentication`");
      if (content.includes("SessionAuthentication")) authNotes.push("Authentication: `SessionAuthentication` (cookie-based)");
      if (content.includes("CORS_ALLOWED_ORIGINS") || content.includes("CORS_ORIGIN_WHITELIST")) authNotes.push("CORS is configured — check `CORS_ALLOWED_ORIGINS` in settings");

      fileDescriptions.push({ file: relativePath, role: "Django settings (DB, auth, installed apps, DRF config)" });
      continue;
    }

    // ── Describe Python files by role ──
    let role = "";
    if (fileName === "urls.py") {
      role = content.includes("router") ? "URL router (DRF router + urlpatterns)" : "URL configuration (urlpatterns)";
    } else if (fileName === "views.py" || fileName.includes("view")) {
      if (content.includes("ViewSet")) role = "DRF ViewSet (CRUD via router)";
      else if (content.includes("APIView") || content.includes("generics.")) role = "DRF Class-Based API View";
      else if (content.includes("@api_view")) role = "DRF Function-Based API View";
      else if (content.includes("def get") || content.includes("def post")) role = "Django view (function or class)";
    } else if (fileName === "models.py" || fileName.includes("model")) {
      role = "Django ORM models (DB schema)";
    } else if (fileName === "serializers.py" || fileName.includes("serializer")) {
      role = "DRF Serializers (data validation & transformation)";
    } else if (fileName === "admin.py") {
      role = "Django admin registration";
    } else if (fileName === "apps.py") {
      role = "App configuration (AppConfig)";
    } else if (fileName === "permissions.py") {
      role = "Custom DRF permission classes";
    } else if (fileName === "authentication.py") {
      role = "Custom authentication backend";
    } else if (fileName === "middleware.py" || fileName.includes("middleware")) {
      role = "Custom request middleware";
    } else if (fileName === "signals.py") {
      role = "Django signals (model event hooks)";
    } else if (fileName === "utils.py" || fileName.includes("util") || fileName.includes("helper")) {
      role = "Utility / helper functions";
    } else if (fileName === "tasks.py") {
      role = "Celery async tasks";
    } else if (fileName === "tests.py" || fileName.startsWith("test_")) {
      role = "Unit / integration tests";
    } else if (fileName === "manage.py") {
      role = "Django management CLI entry point";
    } else if (fileName === "wsgi.py") {
      role = "WSGI server entry point (production)";
    } else if (fileName === "asgi.py") {
      role = "ASGI server entry point (async/WebSocket)";
    }
    if (role) fileDescriptions.push({ file: relativePath, role });

    // ── Extract Models ──
    if (fileName === "models.py" || fileName.includes("model")) {
      const modelMatches = [...content.matchAll(/class\s+(\w+)\s*\(\s*(?:models\.Model|Model)[^)]*\)/g)];
      for (const m of modelMatches) models.push(m[1]);
    }

    // ── Extract Serializers ──
    if (fileName === "serializers.py" || fileName.includes("serializer")) {
      const serMatches = [...content.matchAll(/class\s+(\w+Serializer)\s*\(/g)];
      for (const m of serMatches) serializers.push(m[1]);
    }

    // ── Extract ViewSets ──
    if (content.includes("ViewSet")) {
      const vsMatches = [...content.matchAll(/class\s+(\w+ViewSet)\s*\(/g)];
      for (const m of vsMatches) viewsets.push(m[1]);
    }

    // ── Extract URL patterns ──
    if (fileName === "urls.py") {
      // include() mappings: path('api/v1/', include('app.urls'))
      const includeMatches = [...content.matchAll(/path\s*\(\s*['"]([^'"]*)['"]\s*,\s*include\s*\(\s*['"]([^'"]+)['"]/g)];
      for (const m of includeMatches) urlIncludes[m[1]] = m[2];

      // DRF router registrations: router.register(r'endpoint', ViewSet)
      const routerMatches = [...content.matchAll(/router\.register\s*\(\s*r?['"]([^'"]+)['"]\s*,\s*(\w+)/g)];
      for (const m of routerMatches) {
        const vsName = m[1];
        const viewsetClass = m[2];
        // Router generates standard CRUD endpoints
        const base = `/${vsName}`;
        endpoints.push({ method: "GET",    path: `${base}/`,       view: viewsetClass, auth: "Yes (JWT)", desc: `List ${vsName}` });
        endpoints.push({ method: "POST",   path: `${base}/`,       view: viewsetClass, auth: "Yes (JWT)", desc: `Create ${vsName}` });
        endpoints.push({ method: "GET",    path: `${base}/{id}/`,  view: viewsetClass, auth: "Yes (JWT)", desc: `Retrieve ${vsName}` });
        endpoints.push({ method: "PUT",    path: `${base}/{id}/`,  view: viewsetClass, auth: "Yes (JWT)", desc: `Update ${vsName}` });
        endpoints.push({ method: "PATCH",  path: `${base}/{id}/`,  view: viewsetClass, auth: "Yes (JWT)", desc: `Partial update ${vsName}` });
        endpoints.push({ method: "DELETE", path: `${base}/{id}/`,  view: viewsetClass, auth: "Yes (JWT)", desc: `Delete ${vsName}` });
      }

      // Direct path() definitions: path('endpoint/', ViewClass.as_view())
      const pathMatches = [...content.matchAll(/path\s*\(\s*r?['"]([^'"]*)['"]\s*,\s*(\w+)(?:\.as_view\(\))?/g)];
      for (const m of pathMatches) {
        const routePath = m[1];
        const viewName = m[2];
        if (viewName === "include" || viewName === "re_path") continue;
        // Infer HTTP method from view name heuristics
        const name = viewName.toLowerCase();
        let method = "GET";
        if (/create|register|signup|login|post|add/i.test(name)) method = "POST";
        else if (/update|edit|put/i.test(name)) method = "PUT";
        else if (/delete|remove|destroy/i.test(name)) method = "DELETE";
        const isPublic = /login|register|signup|token|refresh|verify/i.test(routePath + viewName);
        endpoints.push({
          method,
          path: `/${routePath}`,
          view: viewName,
          auth: isPublic ? "No" : "Yes (JWT)",
          desc: viewName.replace(/([A-Z])/g, " $1").replace(/View$|APIView$/, "").trim(),
        });
      }

      // re_path() definitions
      const rePathMatches = [...content.matchAll(/re_path\s*\(\s*r?['"]([^'"]*)['"]\s*,\s*(\w+)(?:\.as_view\(\))?/g)];
      for (const m of rePathMatches) {
        const viewName = m[2];
        if (viewName === "include") continue;
        const isPublic = /login|register|signup|token|refresh/i.test(m[1] + viewName);
        endpoints.push({
          method: "GET/POST",
          path: `/${m[1]}`,
          view: viewName,
          auth: isPublic ? "No" : "Yes (JWT)",
          desc: viewName.replace(/([A-Z])/g, " $1").replace(/View$/, "").trim(),
        });
      }
    }

    // ── Extract @api_view decorated functions ──
    if (content.includes("@api_view")) {
      const decoratorMatches = [...content.matchAll(/@api_view\s*\(\s*\[([^\]]+)\]\s*\)\s*\ndef\s+(\w+)/g)];
      for (const m of decoratorMatches) {
        const methods = m[1].replace(/['"]/g, "").split(",").map((x) => x.trim()).join("|");
        const funcName = m[2];
        const isPublic = /login|register|signup|token|refresh/i.test(funcName);
        endpoints.push({
          method: methods,
          path: `(see urls.py → ${funcName})`,
          view: funcName,
          auth: isPublic ? "No" : "Yes (JWT)",
          desc: funcName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        });
      }
    }
  }

  // Deduplicate endpoints by path+method
  const seen = new Set();
  const uniqueEndpoints = endpoints.filter((e) => {
    const key = `${e.method}:${e.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Deduplicate models/serializers
  const uniqueModels = [...new Set(models)];
  const uniqueSerializers = [...new Set(serializers)];
  const uniqueViewsets = [...new Set(viewsets)];

  return {
    endpoints: uniqueEndpoints,
    models: uniqueModels,
    serializers: uniqueSerializers,
    viewsets: uniqueViewsets,
    fileDescriptions,
    configLines,
    authNotes,
    appNames: [...new Set(appNames)],
    urlIncludes,
  };
}

function generateDjangoReadme(dir) {
  const {
    endpoints, models, serializers, viewsets,
    fileDescriptions, configLines, authNotes, appNames, urlIncludes,
  } = analyzeDjango(dir);

  let md = "";

  // ── Architecture Overview ──
  md += `## 🏗️ Architecture Overview\n\n`;
  md += `PAWSTER's Django backend is a RESTful API built with Django REST Framework (DRF). `;
  if (viewsets.length) {
    md += `It uses DRF ViewSets and routers to auto-generate standard CRUD endpoints. `;
  }
  md += `JWT authentication (via \`djangorestframework-simplejwt\`) secures protected routes — `;
  md += `clients must send a valid \`Authorization: Bearer <access_token>\` header. `;
  if (models.length) {
    md += `Django ORM manages the database with ${models.length} model${models.length > 1 ? "s" : ""}: ${models.join(", ")}. `;
  }
  md += `The project follows standard Django MTV: Views → Serializers → Models.\n\n`;

  // ── Apps ──
  if (appNames.length) {
    md += `**Installed Custom Apps:** ${appNames.map((a) => `\`${a}\``).join(", ")}\n\n`;
  }

  // ── File structure ──
  md += `## 📁 Project Structure\n\n`;
  md += fileDescriptions.length
    ? mdTable(["File", "Role"], fileDescriptions.map((f) => [f.file, f.role]))
    : "_No Python files found._\n";
  md += "\n";

  // ── Auth Flow ──
  md += `## 🔐 Authentication Flow\n\n\`\`\`\n`;
  md += `1. POST /api/token/          → Submit credentials (username + password)\n`;
  md += `                            → Returns { access, refresh } JWT pair\n\n`;
  md += `2. POST /api/token/refresh/  → Submit { refresh } token\n`;
  md += `                            → Returns new { access } token\n\n`;
  md += `3. Protected Request         → Client: Authorization: Bearer <access_token>\n`;
  md += `                            → JWTAuthentication validates token\n`;
  md += `                            → Permission classes checked (IsAuthenticated, etc.)\n`;
  md += `                            → View executes\n\n`;
  md += `4. Token Expired             → 401 Unauthorized\n`;
  md += `                            → Client refreshes via /api/token/refresh/\n\`\`\`\n\n`;

  if (authNotes.length) {
    md += `**Security / Permissions:**\n`;
    for (const n of authNotes) md += `- ${n}\n`;
    md += "\n";
  }

  // ── URL Includes ──
  if (Object.keys(urlIncludes).length) {
    md += `## 🗺️ URL Structure\n\n`;
    md += mdTable(["Prefix", "App URLs"], Object.entries(urlIncludes).map(([prefix, app]) => [prefix, app]));
    md += "\n";
  }

  // ── API Endpoints ──
  md += `## 🌐 API Endpoints\n\n`;
  if (endpoints.length) {
    // Group by first path segment
    const grouped = {};
    for (const e of endpoints) {
      const segment = e.path.split("/").filter(Boolean)[0] || "root";
      if (!grouped[segment]) grouped[segment] = [];
      grouped[segment].push(e);
    }
    for (const [group, eps] of Object.entries(grouped)) {
      md += `### /${group}\n\n`;
      md += mdTable(
        ["Method", "Path", "View", "Auth", "Description"],
        eps.map((e) => [e.method, e.path, e.view, e.auth, e.desc])
      );
      md += "\n";
    }
  } else {
    md += "_No endpoints extracted. Make sure urls.py uses `path()`, `router.register()`, or `@api_view`._\n\n";
  }

  // ── DRF ViewSets ──
  if (viewsets.length) {
    md += `## 🔄 DRF ViewSets\n\n`;
    md += `The following ViewSets are registered with the DRF router and auto-generate `;
    md += `\`list\`, \`create\`, \`retrieve\`, \`update\`, \`partial_update\`, and \`destroy\` actions:\n\n`;
    for (const vs of viewsets) md += `- \`${vs}\`\n`;
    md += "\n";
  }

  // ── Data Flow ──
  md += `## 🗄️ Data Flow\n\n\`\`\`\n`;
  md += `HTTP Request\n`;
  md += `   └─► Django URL Router        (urls.py — matches path)\n`;
  md += `         └─► JWTAuthentication  (validates Bearer token)\n`;
  md += `               └─► Permission   (IsAuthenticated / custom)\n`;
  md += `                     └─► View / ViewSet (handles logic)\n`;
  md += `                           └─► Serializer (validate & serialize data)\n`;
  md += `                                 └─► Model / ORM (DB query)\n`;
  md += `                                       └─► JSON Response\n\`\`\`\n\n`;

  // ── Models ──
  if (models.length) {
    md += `## 🗃️ Database Models\n\n`;
    md += models.map((m) => `- \`${m}\``).join("\n") + "\n\n";
  }

  // ── Serializers ──
  if (serializers.length) {
    md += `## 📦 Serializers\n\n`;
    md += serializers.map((s) => `- \`${s}\``).join("\n") + "\n\n";
  }

  // ── Config ──
  if (configLines.length) {
    // Trim to avoid huge settings dumps — cap at 60 lines
    const capped = configLines.slice(0, 60);
    if (configLines.length > 60) capped.push("# ... (truncated — see settings.py for full config)");
    md += `## ⚙️ Configuration\n\n\`\`\`python\n${capped.join("\n")}\n\`\`\`\n\n`;
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
  django: {
    dir: path.join(ROOT, "django"),
    readme: path.join(ROOT, "django", "README.md"),
    label: "Django Backend",
    scanDirs: ["."],
    ignore: ["__pycache__",".git","node_modules","venv","env",".venv","migrations","staticfiles","media"],
    generate: generateDjangoReadme,
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
git add sb/README.md php/README.md react/README.md django/README.md
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