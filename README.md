<h1 align="center">🚀 Admin V1 — Smart AI Admin Dashboard</h1>

<p align="center">
AI-powered Admin Dashboard giúp quản trị hệ thống bằng ngôn ngữ tự nhiên
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue"/>
  <img src="https://img.shields.io/badge/TypeScript-5-blue"/>
  <img src="https://img.shields.io/badge/Vite-fast-purple"/>
  <img src="https://img.shields.io/badge/TailwindCSS-modern-cyan"/>
  <img src="https://img.shields.io/badge/AI-Agent-enabled-green"/>
</p>

---

# 🧠 Overview

**Admin V1** là một hệ thống **AI-powered Admin Dashboard** cho phép quản trị viên điều khiển hệ thống thông qua **AI Agent** bằng ngôn ngữ tự nhiên.

Thay vì phải thao tác thủ công qua nhiều trang quản trị, người dùng có thể **chat trực tiếp với AI** để:

* truy vấn dữ liệu
* phân tích kinh doanh
* tạo biểu đồ
* quản lý sản phẩm
* duyệt đơn hàng
* điều hướng dashboard

Dự án tập trung vào:

* 🤖 **AI-driven interaction**
* ⚡ **hiệu năng cao**
* 🎨 **trải nghiệm người dùng hiện đại**
* 🧩 **kiến trúc dễ mở rộng**

---

# 🎥 Demo

## Dashboard

<img width="1863" height="955" alt="Ảnh màn hình 2026-03-17 lúc 11 53 04" src="https://github.com/user-attachments/assets/1f0e093c-4c62-44b7-a07d-c2de2b3444c9" />


---

## AI Chat

<img width="1901" height="950" alt="Ảnh màn hình 2026-03-17 lúc 11 54 45" src="https://github.com/user-attachments/assets/4c178f13-e20d-49f0-8e7d-2a588dc30112" />


---

## Video Demo

[![Watch the video](https://img.youtube.com/vi/59lGlm5MynY/0.jpg)](https://www.youtube.com/watch?v=59lGlm5MynY)

---

# 🤖 AI Agent Features

AI Agent là **trái tim của hệ thống**.

Cho phép quản trị viên điều khiển dashboard bằng chat.

---

## 💬 Smart Chat

AI có thể trả lời các câu hỏi về hệ thống.

Ví dụ:

```text
Show today's revenue
List pending orders
How many users registered this week?
```

---

## 📊 ChatChart — Generate Charts

AI có thể **tự động tạo biểu đồ** từ dữ liệu.

Ví dụ:

```text
Draw revenue chart for this week
Show monthly sales statistics
```

---

## 🧾 Smart Forms (AI Prefill)

AI có thể **tạo form và điền sẵn dữ liệu**.

Ví dụ:

```text
Add a new product called iPhone 15
```

AI sẽ:

* mở form sản phẩm
* điền thông tin
* cho phép chỉnh sửa trước khi lưu

---

## 📦 Order Management

AI hỗ trợ quản lý đơn hàng:

```text
Approve pending orders
Show latest orders
```

---

## 🧭 Smart Navigation

Điều hướng dashboard bằng AI.

```text
Go to product management
Open customer list
```

---

# 📦 Business Modules

Dashboard gồm các module quản trị chính.

---

## 🛍 Products

Quản lý sản phẩm:

* danh sách sản phẩm
* bộ lọc thông minh
* chỉnh sửa trực quan

---

## 📦 Orders

Quản lý vòng đời đơn hàng:

* pending
* processing
* completed

---

## 👤 Users

Quản lý khách hàng:

* thông tin người dùng
* lịch sử giao dịch

---

## 📬 Contact Requests

Quản lý các yêu cầu hỗ trợ từ khách hàng.

---

# 🎨 UI / UX Features

## 🌗 Dark / Light Mode

* chuyển đổi giao diện
* lưu cấu hình qua `localStorage`

---

## ✨ Animations

Sử dụng **Framer Motion**:

* page transitions
* UI animations
* micro interactions

---

## 📱 Responsive Design

Hoạt động tốt trên:

* desktop
* tablet
* mobile

---

# 🧠 AI Agent Architecture

Hệ thống sử dụng kiến trúc **AI-driven UI**.

```
User
 │
 ▼
Chat Interface
 │
 ▼
AI Agent Controller
 │
 ├── Intent Detection
 ├── Action Router
 ├── Data Query
 │
 ▼
Business Modules
 │
 ├── Products
 ├── Orders
 ├── Users
 │
 ▼
UI Renderer
 │
 ├── Charts
 ├── Forms
 ├── Tables
 │
 ▼
Dashboard UI
```

---

# 🔄 AI Workflow

Ví dụ khi user nhập:

```
Show revenue chart for this week
```

Workflow:

```
User Message
     │
     ▼
AI Intent Parser
     │
     ▼
Action: Generate Chart
     │
     ▼
Fetch Revenue Data
     │
     ▼
Transform Data
     │
     ▼
Render Chart (Recharts)
     │
     ▼
Display in Chat UI
```

---

# 🧱 Tech Stack

## Frontend

* React 18
* TypeScript
* Vite

---

## Styling

* Tailwind CSS
* PostCSS

---

## AI Integration

Message-based AI API architecture.

---

## UI Libraries

* Lucide React — icons
* Recharts — charts
* React Markdown
* Syntax Highlighter

---

## Routing

* React Router DOM v7

---

# 🚀 Getting Started

## Requirements

* Node.js (latest version)
* npm hoặc yarn

---

## Clone Repository

```bash
git clone https://github.com/your-username/admin-v1.git
cd admin-v1
```

---

## Install Dependencies

```bash
npm install
```

---

## Run Development Server

```bash
npm run dev
```

App chạy tại:

```
http://localhost:5173
```

---

## Build Production

```bash
npm run build
```

---

# 📂 Project Structure

```
src
│
├── components
│   ├── Chat
│   ├── Products
│   ├── Orders
│   └── UI
│
├── services
│   ├── api
│   └── ai-agent
│
├── types
│
├── utils
│
├── App.tsx
│
└── index.css
```

---

# 💡 Example AI Commands

### Product

```
Add a new product called iPhone 15
```

---

### Orders

```
Approve latest pending orders
```

---

### Analytics

```
Show revenue chart for this week
```

---

### Navigation

```
Go to customer management
```

---

# ⚡ Performance Optimizations

* ⚡ Vite build system
* ⚡ lazy loading
* ⚡ component splitting
* ⚡ optimized chart rendering

---

# 🔮 Future Improvements

Planned features:

* 🔐 Role-based AI permissions
* 📈 Advanced analytics
* 🤖 Autonomous AI actions
* 🧠 AI memory
* 📦 Inventory prediction

---

# 🌟 Project Highlights

✔ AI-driven Admin Dashboard
✔ Natural Language Control
✔ Dynamic UI Rendering
✔ Modular Architecture
✔ Modern React Stack

---

# 📜 License

MIT License

---

# 👨‍💻 Author

Developed by **Phuc Vo**

---

<p align="center">
⭐ If you like this project, consider giving it a star!
</p>
