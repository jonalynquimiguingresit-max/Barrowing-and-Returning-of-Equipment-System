# Equipment Borrowing and Returning System 📦

A modern web-based platform for managing equipment inventory and borrowing records. Built with Next.js, Firebase, and Tailwind CSS.

**🌐 Live Demo:** https://midtermproject-two-beryl.vercel.app

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Firebase account

### Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/jonalynquimiguingresit-max/Barrowing-and-Returning-of-Equipment-System.git
   cd midtermproject
   npm install
   ```

2. **Setup Firebase**
   - Go to https://console.firebase.google.com
   - Create a new project
   - Enable Firestore Database
   - Enable Email/Password Authentication
   - Copy your Firebase config

3. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Firebase credentials
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   ```
   http://localhost:3000
   ```

---

## ✨ Features

- ✅ **User Authentication** - Secure login/register with Firebase
- ✅ **Dashboard** - Statistics and quick actions
- ✅ **Equipment Inventory** - Browse and search equipment
- ✅ **Borrow System** - Request to borrow equipment
- ✅ **Return Management** - Track equipment returns and condition
- ✅ **History** - View borrowing transaction history
- ✅ **Admin Panel** - Manage equipment (add/edit/delete)
- ✅ **Responsive Design** - Works on mobile, tablet, desktop
- ✅ **Real-time Updates** - Live data from Firestore

---

## 📋 Main Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User authentication |
| Dashboard | `/dashboard` | Main overview & statistics |
| Equipment | `/equipment` | Browse all equipment |
| Borrow | `/borrow` | Borrow equipment form |
| My Borrows | `/my-borrows` | Active & returned items |
| Return | `/return` | Return equipment form |
| History | `/history` | Transaction history |
| Admin | `/admin/equipment` | Equipment management |

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Backend:** Firebase Firestore, Firebase Authentication
- **Deployment:** Vercel
- **Version Control:** GitHub

---

## 📚 Documentation

For comprehensive documentation, see [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)

Topics covered:
- Project overview
- Database schema
- All features explained
- How to run locally
- Firebase setup
- Troubleshooting

---

## 🔐 Environment Setup

Create `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 🎯 Project Requirements Met

✅ Interactive user interface (forms, dashboards, navigation)  
✅ Data management (CRUD operations)  
✅ Cloud backend integration (Firebase)  
✅ User authentication and access control  
✅ Responsive and user-friendly design  
✅ Clean, organized code  
✅ Deployed on Vercel  
✅ GitHub repository with version control  

---

## 📝 Build & Deploy

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel deploy
```

Or connect your GitHub repo to Vercel for automatic deployments.

---

## 🧪 Testing

1. Register a new account
2. Navigate to equipment list
3. Borrow an item
4. View in "My Borrows"
5. Return the equipment
6. Check transaction history

---

## 📞 Support

For issues, questions, or suggestions:
1. Check [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) troubleshooting section
2. Review Firebase security rules
3. Check browser console for errors
4. Create an issue on GitHub

---

## 📄 License

Educational project - May 2026

---

**Project by:** Avegail Lorainne P. Almirante  
**GitHub:** https://github.com/jonalynquimiguingresit-max/Barrowing-and-Returning-of-Equipment-System  
**Live Demo:** https://midtermproject-two-beryl.vercel.app

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
