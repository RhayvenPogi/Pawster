#!/usr/bin/env node
/**
 * PAWSTER - Auto README Generator
 * ================================
 * Scans sb/, php/, and react/ directories and auto-updates
 * their README.md files with current file structure and flow.
 *
 * Usage:
 *   node generate-readme.js          # Update all READMEs
 *   node generate-readme.js sb       # Update only sb/README.md
 *   node generate-readme.js php      # Update only php/README.md
 *   node generate-readme.js react    # Update only react/README.md
 *
 * To run automatically on every git commit, install the git hook:
 *   node generate-readme.js --install-hook
 */

const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const ROOT = process.cwd(); // Run from Pawster root

const TARGETS = {
  sb: {
    dir: path.join(ROOT, "sb"),
    readme: path.join(ROOT, "sb", "README.md"),
    scanDirs: ["src/main/java/com/pawstar/pawster", "resources"],
    ignore: ["target", "node_modules", ".mvn", ".git"],
    describeFile: describeJavaFile,
  },
  php: {
    dir: path.join(ROOT, "php"),
    readme: path.join(ROOT, "php", "README.md"),
    scanDirs: ["Controller", "Core", "Middleware", "src"],
    ignore: ["vendor", "node_modules", ".git", "uploads"],
    describeFile: describePhpFile,
  },
  react: {
    dir: path.join(ROOT, "react"),
    readme: path.join(ROOT, "react", "README.md"),
    scanDirs: ["src"],
    ignore: ["node_modules", ".git", "dist", "build"],
    describeFile: describeReactFile,
  },
};

// ─────────────────────────────────────────────
// FILE DESCRIPTIONS (customize as your project grows)
// ─────────────────────────────────────────────
function describeJavaFile(name) {
  const map = {
    "AuthController.java": "Auth endpoints (register/login/logout/verify)",
    "AnimalController.java": "Animal listing CRUD endpoints",
    "AdoptionController.java": "Adoption request endpoints",
    "RehomeController.java": "Rehoming request endpoints",
    "SurveyController.java": "Post-adoption survey endpoints",
    "MissingPetController.java": "Missing pet report endpoints",
    "UserController.java": "User profile endpoints",
    "AdminUserController.java": "Admin user management endpoints",
    "ActivityLogController.java": "Activity log endpoints",
    "WebConfig.java": "CORS and web configuration",
    "SecurityConfig.java": "Spring Security filter chain",
    "JwtUtils.java": "JWT generation and validation",
    "JwtAuthenticationFilter.java": "Validates JWT on every request",
    "CustomUserDetailsService.java": "Loads user from DB for Spring Security",
    "DataInitializer.java": "Seeds default admin/data on startup",
    "PawsterApplication.java": "Main Spring Boot entry point",
    "application.properties": "DB, JWT, mail, and server config",
  };
  return map[name] || "";
}

function describePhpFile(name) {
  const map = {
    "AdminDashboardController.php": "Admin dashboard summary endpoints",
    "Router.php": "Custom HTTP router (method + URI matching)",
    "JwtMiddleware.php": "Validates JWT Bearer token on protected routes",
    "routes.php": "All route definitions",
    "index.php": "Application entry point, bootstraps app",
    ".htaccess": "Rewrites all requests to index.php",
    "composer.json": "PHP dependency manifest",
  };
  return map[name] || "";
}

function describeReactFile(name) {
  const map = {
    "App.jsx": "Root component — defines all routes",
    "main.jsx": "ReactDOM entry point, mounts App",
    "shared.jsx": "Shared UI components (buttons, cards, modals)",
    "axios.js": "Axios instance with JWT interceptor",
    "useAuth.js": "Authentication state hook",
    "integration.js": "API call helpers for all modules",
    "GuestRoute.jsx": "Redirects logged-in users away from /login",
    "ProtectedRoute.jsx": "Blocks unauthenticated users from private pages",
    "LandingPage.jsx": "Public-facing landing/marketing page",
    "LoginPage.jsx": "Login form → calls /api/auth/login",
    "RegisterPage.jsx": "Registration form → calls /api/auth/register",
    "HomePage.jsx": "Logged-in user home page",
    "FindaPet.jsx": "Browse adoptable animals → calls /api/animals",
    "Rehome.jsx": "Submit rehoming request → calls /api/rehoming",
    "MissingPets.jsx": "Missing pet board → calls /api/missing",
    "ProfilePage.jsx": "User profile + ID upload",
    "UserDashboard.jsx": "User's adoption/rehoming history and notifications",
    "AdminDashboard.jsx": "Admin overview and request management",
    "About.jsx": "About PAWSTER page",
    "HowItWorks.jsx": "Onboarding/explainer page",
    "Navbar.jsx": "Top navigation bar with auth state awareness",
  };
  return map[name] || "";
}

// ─────────────────────────────────────────────
// SCANNER: Build a tree string from a directory
// ─────────────────────────────────────────────
function scanDir(baseDir, dir, ignore, describer, prefix = "", depth = 0) {
  if (depth > 5) return "";
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) return "";

  let output = "";
  let items;
  try {
    items = fs.readdirSync(fullPath).sort();
  } catch {
    return "";
  }

  items.forEach((item, i) => {
    if (ignore.some((ig) => item === ig || item.startsWith("."))) return;

    const itemPath = path.join(fullPath, item);
    const isLast = i === items.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = prefix + (isLast ? "    " : "│   ");

    let stat;
    try {
      stat = fs.statSync(itemPath);
    } catch {
      return;
    }

    if (stat.isDirectory()) {
      output += `${prefix}${connector}${item}/\n`;
      output += scanDir(
        baseDir,
        path.join(dir, item),
        ignore,
        describer,
        childPrefix,
        depth + 1
      );
    } else {
      const desc = describer(item);
      const comment = desc ? `   # ${desc}` : "";
      output += `${prefix}${connector}${item}${comment}\n`;
    }
  });

  return output;
}

// ─────────────────────────────────────────────
// TIMESTAMP
// ─────────────────────────────────────────────
function timestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

// ─────────────────────────────────────────────
// README UPDATER
// Updates only the "Auto-generated file tree" section
// Preserves all hand-written content above and below
// ─────────────────────────────────────────────
function updateReadme(key) {
  const config = TARGETS[key];

  if (!fs.existsSync(config.dir)) {
    console.log(`⚠️  Skipping ${key} — directory not found: ${config.dir}`);
    return;
  }

  // Build file tree
  let tree = `${key}/\n`;
  config.scanDirs.forEach((scanDir_) => {
    const fullScan = path.join(config.dir, scanDir_);
    if (fs.existsSync(fullScan)) {
      tree += `├── ${scanDir_}/\n`;
      tree += scanDir(
        config.dir,
        scanDir_,
        config.ignore,
        config.describeFile,
        "│   "
      );
    }
  });

  const autoBlock = `<!-- AUTO:START -->
> 🤖 **Auto-generated file tree** — last updated: ${timestamp()}
> Run \`node scripts/generate-readme.js ${key}\` to refresh.

\`\`\`
${tree}\`\`\`
<!-- AUTO:END -->`;

  if (!fs.existsSync(config.readme)) {
    console.log(
      `⚠️  README not found at ${config.readme}. Creating a stub...`
    );
    fs.writeFileSync(
      config.readme,
      `# PAWSTER — ${key.toUpperCase()} Backend\n\n## 📁 File Structure\n\n${autoBlock}\n`
    );
    console.log(`✅ Created ${config.readme}`);
    return;
  }

  let content = fs.readFileSync(config.readme, "utf8");

  // Replace existing auto block, or append it after the first ## 📁 heading
  if (content.includes("<!-- AUTO:START -->")) {
    content = content.replace(/<!-- AUTO:START -->[\s\S]*?<!-- AUTO:END -->/m, autoBlock);
  } else {
    // Inject after the first ## 📁 Project Structure heading
    content = content.replace(
      /(## 📁 Project Structure\n\n```[\s\S]*?```)/m,
      `## 📁 Project Structure\n\n${autoBlock}`
    );
  }

  fs.writeFileSync(config.readme, content);
  console.log(`✅ Updated ${config.readme}`);
}

// ─────────────────────────────────────────────
// GIT HOOK INSTALLER
// ─────────────────────────────────────────────
function installGitHook() {
  const hookDir = path.join(ROOT, ".git", "hooks");
  const hookPath = path.join(hookDir, "pre-commit");

  if (!fs.existsSync(hookDir)) {
    console.log("❌ No .git/hooks directory found. Are you in the project root?");
    process.exit(1);
  }

  const hookContent = `#!/bin/sh
# PAWSTER Auto README Generator — pre-commit hook
echo "🐾 Updating README files..."
node "$(git rev-parse --show-toplevel)/scripts/generate-readme.js"
git add sb/README.md php/README.md react/README.md
echo "✅ READMEs updated and staged."
`;

  fs.writeFileSync(hookPath, hookContent);
  fs.chmodSync(hookPath, "755");
  console.log(`✅ Git pre-commit hook installed at ${hookPath}`);
  console.log("   Every 'git commit' will now auto-update your README files!");
}

// ─────────────────────────────────────────────
// WATCH MODE: Auto-update on file changes
// ─────────────────────────────────────────────
function watchMode(key) {
  const config = TARGETS[key];
  console.log(`👁️  Watching ${config.dir} for changes...`);
  console.log("   Press Ctrl+C to stop.\n");

  let debounceTimer;
  fs.watch(config.dir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (config.ignore.some((ig) => filename.includes(ig))) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`📝 Change detected: ${filename}`);
      updateReadme(key);
    }, 500);
  });
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes("--install-hook")) {
  installGitHook();
  process.exit(0);
}

if (args.includes("--watch")) {
  const target = args.find((a) => TARGETS[a]);
  if (!target) {
    console.log("Usage: node generate-readme.js --watch <sb|php|react>");
    process.exit(1);
  }
  watchMode(target);
} else {
  // Update specified target(s) or all
  const targets = args.filter((a) => TARGETS[a]);
  const toUpdate = targets.length > 0 ? targets : Object.keys(TARGETS);

  console.log("🐾 PAWSTER README Generator\n");
  toUpdate.forEach(updateReadme);
  console.log("\nDone!");
}