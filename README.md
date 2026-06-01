
# Brgy.Tanos-SoS (Replit Version) 🚨🇵🇭

**Experimental Replit Version** of the Barangay Tanod Emergency Response System.

This is a **lightweight, web-based** prototype of the main [Brgy.Tanod-S.O.S](https://github.com/MiB1968/Brgy.Tanod-S.O.S) project, built and tested on **Replit**.

---

## 📌 About This Project

This Replit version serves as a **rapid prototyping and development environment** for the full Barangay Tanod SOS system.

It allows quick testing of core features without complex local setup. Ideal for experimentation, feature development, and demonstrations.

**Main Project**: [Brgy.Tanod-S.O.S](https://github.com/MiB1968/Brgy.Tanod-S.O.S) (Full version with PWA, Capacitor, Local AI, etc.)

---

## ✨ Core Features (Implemented in this version)

- **Hold-to-Activate SOS Button** — Long press (2 seconds) emergency alert
- **Real-time Live Map** — Shows available Tanods on patrol
- **Role-Based Access**:
  - Resident / Citizen
  - Barangay Tanod
  - Admin / Super Admin
- **Incident Management** — Report, respond, and track emergencies
- **Tanod On/Off Duty Toggle**
- **Broadcast System** — Send announcements to all users
- **Responsive Dark Tactical UI**
- **User Approval Workflow** (Tanods need admin approval)

---

## 🛠️ Tech Stack

- **Monorepo**: pnpm Workspaces
- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: JWT + bcrypt
- **API**: OpenAPI Specification + Orval (code generation)
- **Maps**: React Leaflet
- **State Management**: TanStack Query
- **UI Components**: shadcn/ui + Radix

---

## 🚀 Quick Start on Replit

1. **Open in Replit**:
   - Click the green **"Run on Replit"** button (if available), or
   - Import this repo directly into Replit

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Setup Environment**:
   - Copy `.env.example` to `.env`
   - Update your database URL and JWT secret

4. **Run Development**:
   ```bash
   pnpm run dev
   ```

   The app will run on the default Replit port.

---

## 📁 Project Structure

```
├── apps/
│   ├── frontend/          # React + Vite app
│   └── backend/           # Express API
├── packages/
│   ├── api-spec/          # OpenAPI definition
│   ├── api-zod/           # Generated Zod schemas
│   ├── db/                # Drizzle schema & client
│   └── shared/            # Common utilities
├── artifacts/             # Built/deployable outputs
└── replit.md              # Replit-specific notes
```

---

## 🔄 Relationship with Main Project

This Replit version is **for experimentation only**.

**Best Practice**:
- Develop and test new ideas here
- Merge stable features back to the **[main project](https://github.com/MiB1968/Brgy.Tanod-S.O.S)**

---

## 📋 Todo / Future Improvements

- [ ] Add WebSocket real-time updates
- [ ] Implement offline SOS queuing
- [ ] Add PWA support
- [ ] Integrate SMS fallback
- [ ] Improve mobile responsiveness
- [ ] Add unit & integration tests

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0** — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built for Philippine Barangays to improve community safety and emergency response.

**Made with ❤️ for safer communities**

---
