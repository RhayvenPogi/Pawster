# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

<!-- AUTO:START -->
> 🔍 **Auto-generated documentation** — last updated: 2026-04-04 16:57:58 UTC
> Run `node scripts/generate-readme.js react` to refresh.

---

## 🏗️ Architecture Overview

PAWSTER's React frontend is a single-page application (SPA) using React Router for client-side routing. An Axios instance with interceptors handles all API calls — JWT is automatically attached to every request. Route guards (`ProtectedRoute`, `GuestRoute`) enforce authentication at the route level. Custom hooks (`useAuth`) manage shared state.

## 📁 Project Structure

| File                                 | Type               | Export             |
| ------------------------------------ | ------------------ | ------------------ |
| eslint.config.js                     | Component          | defineConfig       |
| postcss.config.js                    | Component          | postcss.config     |
| src\App.jsx                          | Root App           | App                |
| src\components\GuestRoute.jsx        | Route Guard        | GuestRoute         |
| src\components\ProtectedRoute.jsx    | Route Guard        | ProtectedRoute     |
| src\config\axios.js                  | API / Axios Config | api                |
| src\hooks\integration.js             | API / Axios Config | App                |
| src\hooks\useAuth.js                 | Custom Hook        | useAuth            |
| src\main.jsx                         | Entry Point        | main               |
| src\pages\About.jsx                  | Component          | About              |
| src\pages\admin\ActivityPanel.jsx    | Component          | ActivityPanel      |
| src\pages\admin\AnimalsPanel.jsx     | Component          | AnimalsPanel       |
| src\pages\admin\DashboardPanel.jsx   | Component          | DashboardPanel     |
| src\pages\admin\GeoMapPanel.jsx      | Component          | GeoMapPanel        |
| src\pages\admin\MissingPetsPanel.jsx | Component          | MissingPetsPanel   |
| src\pages\admin\ProfilePanel.jsx     | Component          | ProfilePanel       |
| src\pages\admin\RequestsPanel.jsx    | Component          | RequestsPanel      |
| src\pages\admin\SurveysPanel.jsx     | Component          | SurveysPanel       |
| src\pages\admin\UsersPanel.jsx       | Component          | UsersPanel         |
| src\pages\AdminDashboard.jsx         | Component          | AdminDashboard     |
| src\pages\FindaPet.jsx               | Component          | FindAPet           |
| src\pages\FollowUpSurveys.jsx        | Component          | FollowUpSurveys    |
| src\pages\ForgotPasswordPage.jsx     | Component          | ForgotPasswordPage |
| src\pages\HomePage.jsx               | Component          | HomePage           |
| src\pages\HowItWorks.jsx             | Component          | HowItWorks         |
| src\pages\LandingPage.jsx            | Component          | LandingPage        |
| src\pages\LoginPage.jsx              | Component          | LoginPage          |
| src\pages\MissingPets.jsx            | Component          | MissingPets        |
| src\pages\Navbar.jsx                 | Component          | Navbar             |
| src\pages\NotificationBell.jsx       | Component          | NotificationBell   |
| src\pages\ProfilePage.jsx            | Component          | ProfilePage        |
| src\pages\RegisterPage.jsx           | Component          | RegisterPage       |
| src\pages\Rehome.jsx                 | Component          | Rehome             |
| src\pages\UserDashboard.jsx          | Component          | UserDashboard      |
| src\shared.jsx                       | Component          | shared             |
| tailwind.config.js                   | Component          | tailwind.config    |
| vite.config.js                       | Component          | defineConfig       |

## 🔐 Auth & Routing Flow

```
1. User visits /login
   → GuestRoute: already logged in? → redirect to /home

2. Login form submitted
   → POST /api/auth/login
   → JWT stored in localStorage
   → Redirect to /home

3. User visits protected page
   → ProtectedRoute checks localStorage for token
   → No token → redirect to /login
   → Has token → render page

4. API call made
   → Axios interceptor adds: Authorization: Bearer <token>
   → 401 response → clear token → redirect to /login
```

## 📄 Pages & Routes

| Route              | Component      | Access    |
| ------------------ | -------------- | --------- |
| /                  | Navigate       | Public    |
| /login             | GuestRoute     | Public    |
| /register          | GuestRoute     | Public    |
| /forgot-password   | GuestRoute     | Protected |
| /home              | ProtectedRoute | Protected |
| /pets              | ProtectedRoute | Protected |
| /profile/edit      | ProtectedRoute | Protected |
| /profile           | ProtectedRoute | Protected |
| /how-it-works      | ProtectedRoute | Public    |
| /rehome            | ProtectedRoute | Protected |
| /missing-pets      | ProtectedRoute | Protected |
| /about             | ProtectedRoute | Public    |
| /admin             | ProtectedRoute | Protected |
| /follow-up-surveys | ProtectedRoute | Protected |
| *                  | Navigate       | Protected |

## 🔗 API Calls by Component

| Component          | Method | Endpoint                  |
| ------------------ | ------ | ------------------------- |
| useAuth            | GET    | /api/auth/me              |
| useAuth            | POST   | /api/auth/login           |
| useAuth            | POST   | /api/auth/register        |
| useAuth            | POST   | /api/auth/logout          |
| ForgotPasswordPage | POST   | /api/auth/forgot-password |
| ForgotPasswordPage | POST   | /api/auth/verify-otp      |
| ForgotPasswordPage | POST   | /api/auth/forgot-password |
| ForgotPasswordPage | POST   | /api/auth/reset-password  |
| ProfilePage        | GET    | /api/users/${user.id}     |
| ProfilePage        | PUT    | /api/users/${user?.id ??  |
| ProfilePage        | PUT    | /api/users/${user?.id ??  |
| ProfilePage        | PUT    | /api/users/${userId ??    |

## ⚙️ Axios Configuration

- Base URL: `http://localhost:8080`
- Request interceptor: attaches JWT token to every outgoing request
- Response interceptor: catches 401 → clears token → redirects to /login
- Token stored/retrieved from localStorage
- Token stored/retrieved from localStorage

## 🗄️ Data Flow

```
User Action
   └─► Component (state/handler)
         └─► integration.js / axios call
               └─► Axios interceptor adds JWT header
                     └─► API request (Spring Boot / PHP / Django)
                           └─► JSON response
                                 └─► useState update → re-render
```

## 🧩 Custom Hooks

- `useAuth` — shared stateful logic


## 📂 File Tree

```
react/
├── src/
│   ├── App.css
│   ├── App.jsx
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components/
│   │   ├── GuestRoute.jsx
│   │   └── ProtectedRoute.jsx
│   ├── config/
│   │   └── axios.js
│   ├── hooks/
│   │   ├── integration.js
│   │   └── useAuth.js
│   ├── images/
│   │   ├── Dogs.png
│   │   ├── dog.png
│   │   ├── forgot_dog.png
│   │   └── logo.png
│   ├── index.css
│   ├── main.jsx
│   ├── pages/
│   │   ├── About.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── FindaPet.jsx
│   │   ├── FollowUpSurveys.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── HowItWorks.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── MissingPets.jsx
│   │   ├── Navbar.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── Rehome.jsx
│   │   ├── UserDashboard.jsx
│   │   └── admin/
│   │       ├── ActivityPanel.jsx
│   │       ├── AnimalsPanel.jsx
│   │       ├── DashboardPanel.jsx
│   │       ├── GeoMapPanel.jsx
│   │       ├── MissingPetsPanel.jsx
│   │       ├── ProfilePanel.jsx
│   │       ├── RequestsPanel.jsx
│   │       ├── SurveysPanel.jsx
│   │       └── UsersPanel.jsx
│   └── shared.jsx
```

<!-- AUTO:END -->
