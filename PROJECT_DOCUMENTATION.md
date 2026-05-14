# Equipment Borrowing and Returning System

**Project Title:** Platform-Based Equipment Management System  
**Technology Stack:** Next.js 14, React, Firebase (Firestore + Authentication), Tailwind CSS  
**Deployment:** Vercel  
**Live Demo:** https://midtermproject-two-beryl.vercel.app

---

## 📋 Project Overview

This is a comprehensive **web-based Equipment Borrowing and Returning Management System** that allows users to borrow equipment and track their borrowing history. The system provides real-time database integration, user authentication, and a responsive user interface.

The platform is designed for organizations (schools, offices, labs) to efficiently manage equipment inventory and borrowing records.

---

## ✨ Key Features

### 1. **User Authentication**
- User Registration with email and password
- Secure Login/Logout functionality
- Firebase Authentication integration
- Protected routes requiring login

### 2. **Dashboard**
- Welcome section with user name
- Quick statistics (Total Equipment, Available, Currently Borrowed)
- Quick action buttons for easy navigation
- Equipment preview table with recent items

### 3. **Equipment Management**
- View complete equipment inventory
- Search and filter equipment by name and status
- Display equipment details (name, category, description, status)
- Real-time equipment availability status
- Borrow button for available equipment

### 4. **Borrowing System**
- Browse and select equipment to borrow
- Auto-populated borrow date (current date)
- Set custom expected return dates
- Add notes/purpose for borrowing
- Form validation before submission
- Success confirmation with redirect

### 5. **My Borrowed Items**
- View all currently borrowed equipment
- Display borrow date, due date, and days left
- Color-coded status indicators (On Time/Overdue)
- View all returned equipment history
- Quick "Return Equipment" action

### 6. **Return Management**
- Pre-filled equipment information
- Select return date
- Equipment condition tracking (Good, Minor Damage, Damaged, Lost)
- Add damage notes if applicable
- Return confirmation and history update

### 7. **Transaction History**
- Complete history of all borrowings and returns
- View borrow dates, expected return dates, actual return dates
- Track equipment condition at return
- Calculate days borrowed
- Status indicators (Returned/Borrowed)

### 8. **Admin Equipment Management** (Bonus Feature)
- Add new equipment to inventory
- Edit existing equipment details
- Delete equipment from system
- Update equipment status (Available, Borrowed, Maintenance)
- Manage equipment quantity

### 9. **Responsive Design**
- Mobile-friendly interface
- Adaptive layouts for all screen sizes
- Touch-friendly buttons and forms
- Responsive navigation menu

---

## 🗄️ Database Schema (Firestore)

### Collections Structure:

#### **equipment**
```json
{
  "id": "auto-generated",
  "name": "Laptop ASUS VivoBook",
  "category": "Electronics",
  "description": "Dell XPS 13 Laptop",
  "quantity": 5,
  "status": "available",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### **borrowRecords**
```json
{
  "id": "auto-generated",
  "userId": "user_uid",
  "userEmail": "user@example.com",
  "equipmentId": "equipment_id",
  "equipmentName": "Laptop ASUS VivoBook",
  "borrowDate": "timestamp",
  "expectedReturnDate": "timestamp",
  "actualReturnDate": "timestamp (null if not returned)",
  "status": "borrowed/returned",
  "notes": "Purpose of borrowing",
  "createdAt": "timestamp"
}
```

---

## 🚀 Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Redirect | Auto-redirects to login or dashboard |
| `/login` | Login | User login page |
| `/register` | Register | User registration page |
| `/dashboard` | Dashboard | Main dashboard with statistics |
| `/equipment` | Equipment List | Browse all equipment |
| `/borrow` | Borrow Form | Borrow equipment form |
| `/my-borrows` | My Borrows | View active and returned borrows |
| `/return` | Return Form | Return equipment form |
| `/history` | History | Transaction history |
| `/admin/equipment` | Admin Panel | Equipment management (add/edit/delete) |

---

## 📦 Project Structure

```
midtermproject/
├── app/
│   ├── layout.js              # Root layout with AuthProvider
│   ├── page.js                # Home redirect page
│   ├── globals.css            # Global styles
│   ├── login/
│   │   └── page.js            # Login page
│   ├── register/
│   │   └── page.js            # Registration page
│   ├── dashboard/
│   │   └── page.js            # Dashboard
│   ├── equipment/
│   │   └── page.js            # Equipment listing
│   ├── borrow/
│   │   └── page.js            # Borrow form
│   ├── my-borrows/
│   │   └── page.js            # My borrowed items
│   ├── return/
│   │   └── page.js            # Return equipment
│   ├── history/
│   │   └── page.js            # Transaction history
│   └── admin/
│       └── equipment/
│           └── page.js        # Admin equipment management
├── components/
│   ├── Navigation.js          # Navigation bar
│   └── ProtectedLayout.js     # Auth protected layout wrapper
├── contexts/
│   └── AuthContext.js         # Auth context provider
├── lib/
│   ├── firebase.js            # Firebase initialization
│   ├── useAuth.js             # Auth hook
│   ├── useFirebase.js         # Data fetching hooks
│   └── firebaseCollections.md # Schema documentation
├── public/                    # Static assets
├── .env.local                 # Environment variables (not committed)
├── .env.local.example         # Environment template
├── package.json               # Dependencies
├── next.config.mjs            # Next.js config
└── README.md                  # This file
```

---

## 🛠️ Technologies Used

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript (ES6+)** - Programming language

### Backend & Database
- **Firebase Firestore** - Cloud database
- **Firebase Authentication** - User authentication
- **Firebase Storage** - File storage (optional)

### Deployment
- **Vercel** - Hosting platform
- **GitHub** - Version control

### Development Tools
- **npm** - Package manager
- **Git** - Version control

---

## 📝 How to Run Locally

### Prerequisites
- Node.js 16+ installed
- npm or yarn
- Firebase project setup
- .env.local file with Firebase credentials

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/jonalynquimiguingresit-max/Barrowing-and-Returning-of-Equipment-System.git
   cd midtermproject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the template
   cp .env.local.example .env.local
   
   # Edit .env.local with your Firebase credentials
   # Get credentials from: https://console.firebase.google.com
   ```

4. **Set up Firebase**
   - Create Firestore database
   - Enable Email/Password authentication
   - Create initial collections (equipment, borrowRecords)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 🔐 Firebase Security Rules

Set these Firestore security rules to protect your data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Allow everyone to read equipment
    match /equipment/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid != null;
    }
    
    // Allow users to read/write their own borrow records
    match /borrowRecords/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## 🧪 Test Credentials (for demo)

You can use any email and password to register. The system uses Firebase Authentication, so you'll need valid credentials.

**Demo Account:**
- Email: `demo@example.com`
- Password: `Demo@123` (create your own during testing)

---

## ✅ Implemented Requirements

### Core Requirements ✓
- [x] **Interactive User Interface** - Forms, dashboards, navigation
- [x] **Data Management** - Create, Read, Update, Delete operations
- [x] **Cloud Backend Integration** - Firebase Firestore
- [x] **Responsive Design** - Mobile-friendly layout
- [x] **Clean UI/UX** - Professional design with Tailwind CSS

### CRUD Operations ✓
- [x] **Create** - Borrow equipment, add new equipment (admin)
- [x] **Read** - View equipment, view borrows, view history
- [x] **Update** - Return equipment, edit equipment (admin)
- [x] **Delete** - Delete equipment (admin)

### Bonus Features ✓
- [x] **User Authentication** - Login/Register with Firebase
- [x] **Real-time Updates** - Firestore real-time listeners
- [x] **Admin Dashboard** - Equipment management
- [x] **Transaction History** - Complete borrowing records
- [x] **Form Validation** - Input validation and error handling
- [x] **Status Tracking** - Equipment availability and return status

---

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🚢 Deployment

The project is deployed on **Vercel** at: https://midtermproject-two-beryl.vercel.app

### To Deploy Your Own Copy:

1. Push code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Click Deploy

---

## 🐛 Troubleshooting

### Firebase Connection Issues
- Verify .env.local has correct credentials
- Check Firebase project settings
- Ensure Firestore database is created
- Check Firestore security rules

### Authentication Errors
- Clear browser cookies/cache
- Verify email/password are correct
- Check Firebase Authentication enabled
- Ensure user role has permission

### Page Not Loading
- Check browser console for errors
- Verify route exists in app directory
- Check ProtectedLayout wrapper
- Verify user is authenticated

---

## 📚 References & Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

---

## 👨‍💼 Project Details

- **Course:** Platform-Based Management System
- **Student:** Avegail Lorainne P. Almirante
- **GitHub Repository:** https://github.com/jonalynquimiguingresit-max/Barrowing-and-Returning-of-Equipment-System
- **Deployment:** https://midtermproject-two-beryl.vercel.app
- **Submission Date:** May 20-23, 2026

---

## 📄 License

This project is created for educational purposes.

---

## ✉️ Support

For issues or questions, please contact the development team or create an issue in the GitHub repository.

---

**Last Updated:** May 14, 2026
