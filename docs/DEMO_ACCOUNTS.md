# 🔐 Demo Login Accounts

## Quick Access Credentials

### 1️⃣ Regular User
**Email:** `user@monithq.com`  
**Password:** `user123`  
**Role:** `USER`

**Access:**
- ✅ Dashboard
- ✅ Sites
- ✅ Incidents
- ✅ Insights
- ❌ Billing (hidden)
- ❌ Settings (hidden)
- ❌ Organization/Admin sections

---

### 2️⃣ Organization Admin
**Email:** `admin@monithq.com`  
**Password:** `admin123`  
**Role:** `ORG_ADMIN`

**Access:**
- ✅ Dashboard
- ✅ Sites
- ✅ Incidents
- ✅ Insights
- ✅ **Billing** (organization billing)
- ✅ **Subscriptions** (manage org plan)
- ✅ **Team Management** (invite/remove users)
- ✅ **Settings** (org-wide settings)
- ❌ Platform admin features

**Badge:** Green "Org Admin" with green shield

---

### 3️⃣ Super Admin (Platform Maintainer)
**Email:** `super@monithq.com`  
**Password:** `super123`  
**Role:** `SUPER_ADMIN`

**Access:**
- ✅ **Everything Org Admin has**
- ✅ **Admin Dashboard** (`/admin/dashboard`)
- ✅ **User Management** (`/admin/users`)
- ✅ **Subscriptions** (`/admin/subscriptions`)
- ✅ **System Monitoring** (`/admin/monitoring`)

**Badge:** Red "Super Admin" with red shield

---

## 🚀 How to Test

### Method 1: Quick Login Buttons
1. Go to: `http://localhost:3000/auth/login`
2. Click one of the three demo account cards
3. Automatically logged in and redirected to dashboard

### Method 2: Manual Login
1. Go to: `http://localhost:3000/auth/login`
2. Enter email and password from above
3. Click "Sign In"

---

## 📍 What You'll See

### As Regular User:
```
Sidebar:
├── Dashboard
├── Sites
├── Incidents
└── Insights
```

### As Org Admin:
```
Sidebar:
├── Dashboard
├── Sites
├── Incidents
├── Insights
├── Billing
├── Settings
├── ─────────────── ORGANIZATION
├── Billing
├── Subscriptions
├── Team Management
└── Settings
```

### As Super Admin:
```
Sidebar:
├── Dashboard
├── Sites
├── Incidents
├── Insights
├── Billing
├── Settings
├── ─────────────── PLATFORM ADMIN
├── Admin Dashboard
├── User Management
├── Subscriptions
└── System Monitoring
```

---

## 🎨 Visual Indicators

**User Info Badge (Top Right):**
- Shows current logged-in user
- Shows role badge
- Logout button

**Sidebar Avatar:**
- Regular User: Blue avatar, no badge
- Org Admin: Blue avatar, green shield badge
- Super Admin: Blue avatar, red shield badge

**Menu Item Colors:**
- User links: Blue glow when active
- Organization links: Green glow when active
- Platform Admin links: Orange glow when active

---

## 🔄 Switching Accounts

1. Click logout button (top right user info)
2. Select different demo account on login page
3. Sidebar menu updates automatically
4. Different pages become available/hidden

---

## 💾 How It Works

**Frontend Only (No Backend Yet):**
- User info stored in `localStorage`
- Key: `currentUser`
- Value: `{ name, email, role }`

**Sidebar reads from localStorage:**
```javascript
const user = localStorage.getItem('currentUser');
const userRole = JSON.parse(user).role;
```

**Login sets localStorage:**
```javascript
localStorage.setItem('currentUser', JSON.stringify({
  name: 'John Doe',
  email: 'user@monithq.com',
  role: 'user'
}));
```

---

## 🧪 Testing Checklist

- [ ] Login as Regular User → See only Dashboard, Sites, Incidents, Insights
- [ ] Login as Org Admin → See user pages + Organization section
- [ ] Login as Super Admin → See everything + Platform Admin section
- [ ] Logout works and returns to login page
- [ ] User info displays correctly in top-right
- [ ] Avatar shows correct initials
- [ ] Badge colors match role (green/red)
- [ ] Active page highlights with correct color
- [ ] Switching accounts updates sidebar menu

---

## 🔒 Security Note

**This is FRONTEND ONLY for demo purposes!**

In production, you must:
1. Validate credentials on backend
2. Use JWT tokens or sessions
3. Protect admin routes with middleware
4. Never trust localStorage for auth
5. Implement proper role-based access control (RBAC)

---

**Ready to test!** 🎉

Visit: `http://localhost:3000/auth/login`
