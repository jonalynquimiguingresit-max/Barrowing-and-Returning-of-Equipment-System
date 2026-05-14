"use client";

import { useMemo, useState, useEffect } from "react";

const initialUsers = [
  { id: 1, name: "Admin", email: "admin@school.local", role: "admin", password: "Admin@123" },
  { id: 2, name: "Avegail Lorainne P. Almirante", email: "ave@student.local", role: "borrower", password: "Password1" },
];

const initialEquipment = [
  { id: 1, name: "Laptop ASUS VivoBook", category: "Laptop", status: "Available", condition: "Good" },
  { id: 2, name: "Projector Epson X50", category: "Projector", status: "Available", condition: "Good" },
  { id: 3, name: "Camera Canon EOS R", category: "Camera", status: "Borrowed", condition: "Good" },
];

const initialTransactions = [
  {
    id: 1,
    userId: 2,
    equipmentId: 3,
    type: "borrow",
    date: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
    approval: "approved",
    status: "active",
    condition: "Good",
  },
];

function formatDate(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function Home() {
  const [users, setUsers] = useState(initialUsers);
  const [equipment, setEquipment] = useState(initialEquipment);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const stats = useMemo(() => {
    const total = equipment.length;
    const borrowed = equipment.filter((item) => item.status === "Borrowed").length;
    const available = equipment.filter((item) => item.status === "Available").length;
    const damaged = equipment.filter((item) => item.status === "Damaged").length;
    const pending = transactions.filter((tx) => tx.type === "borrow" && tx.status === "pending").length;
    const late = transactions.filter(
      (tx) => tx.type === "borrow" && tx.status === "active" && new Date(tx.dueDate) < new Date()
    ).length;
    return { total, borrowed, available, damaged, pending, late };
  }, [equipment, transactions]);

  const visibleEquipment = useMemo(() => {
    return equipment.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" ? true : item.status === filterStatus;
      const matchesCategory = filterCategory === "all" ? true : item.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [equipment, searchTerm, filterStatus, filterCategory]);

  function notify(text, type = "success") {
    setMessage({ text, type });
  }

  function handleLogin(e) {
    e.preventDefault();
    const found = users.find((u) => u.email === authForm.email && u.password === authForm.password);
    if (found) {
      setCurrentUser(found);
      setAuthForm({ name: "", email: "", password: "" });
      notify(`Welcome ${found.name}!`, "success");
      setActiveTab("dashboard");
      return;
    }
    notify("Email/Password incorrect", "error");
  }

  function handleRegister(e) {
    e.preventDefault();
    if (!authForm.name || !authForm.email || !authForm.password) {
      notify("Please fill all fields", "error");
      return;
    }
    if (users.some((u) => u.email === authForm.email)) {
      notify("Email already exists", "error");
      return;
    }
    const newUser = {
      id: Date.now(),
      name: authForm.name,
      email: authForm.email,
      password: authForm.password,
      role: "borrower",
    };
    setUsers([...users, newUser]);
    setAuthMode("login");
    setAuthForm({ name: "", email: "", password: "" });
    notify("Registered. Please login.", "success");
  }

  function handleLogout() {
    setCurrentUser(null);
    setActiveTab("dashboard");
    notify("Logged out", "success");
  }

  function addOrUpdateUser(user) {
    if (user.id) {
      setUsers(users.map((u) => (u.id === user.id ? user : u)));
      notify("User updated", "success");
    } else {
      setUsers([...users, { ...user, id: Date.now() }]);
      notify("New user added", "success");
    }
  }

  function removeUser(userId) {
    setUsers(users.filter((user) => user.id !== userId));
    notify("User deleted", "success");
  }

  function addOrUpdateEquipment(item) {
    if (item.id) {
      setEquipment(equipment.map((eq) => (eq.id === item.id ? item : eq)));
      notify("Equipment updated", "success");
    } else {
      setEquipment([...equipment, { ...item, id: Date.now(), status: "Available", condition: "Good" }]);
      notify("Equipment added", "success");
    }
  }

  function removeEquipment(itemId) {
    setEquipment(equipment.filter((item) => item.id !== itemId));
    notify("Equipment removed", "success");
  }

  function requestBorrow(equipmentId) {
    if (!currentUser) return;
    const item = equipment.find((eq) => eq.id === equipmentId);
    if (!item || item.status !== "Available") {
      notify("Item not available", "error");
      return;
    }
    const dueDate = addDays(new Date(), 7);
    const newTx = {
      id: Date.now(),
      userId: currentUser.id,
      equipmentId,
      type: "borrow",
      date: new Date().toISOString(),
      dueDate,
      approval: currentUser.role === "admin" ? "approved" : "pending",
      status: currentUser.role === "admin" ? "active" : "pending",
      condition: item.condition,
    };
    setTransactions([...transactions, newTx]);
    if (currentUser.role === "admin") {
      setEquipment(equipment.map((eq) => (eq.id === equipmentId ? { ...eq, status: "Borrowed" } : eq)));
      notify("Borrow recorded and approved", "success");
    } else {
      const admins = users.filter((u) => u.role === "admin");
      admins.forEach((admin) =>
        sendNotificationToUser(
          admin.id,
          `${currentUser.name} requested ${item.name}. Approval required.`
        )
      );
      notify("Borrow request sent (pending admin approval)", "success");
    }
  }

  function approveBorrow(transactionId) {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return;
    setTransactions(
      transactions.map((t) =>
        t.id === transactionId ? { ...t, approval: "approved", status: "active" } : t
      )
    );
    setEquipment(equipment.map((eq) => (eq.id === tx.equipmentId ? { ...eq, status: "Borrowed" } : eq)));
    sendNotificationToUser(tx.userId, `Your borrow request for ${equipment.find((eq) => eq.id === tx.equipmentId)?.name} has been approved.`);
    notify("Borrow request approved", "success");
  }

  function returnEquipment(transactionId, condition) {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return;
    setTransactions(
      transactions.map((t) =>
        t.id === transactionId ? { ...t, type: "return", date: new Date().toISOString(), status: "completed", condition } : t
      )
    );
    setEquipment(
      equipment.map((eq) =>
        eq.id === tx.equipmentId
          ? { ...eq, status: condition === "Damaged" ? "Damaged" : "Available", condition }
          : eq
      )
    );
    notify("Returned and status updated", "success");
  }

  function sendNotificationToUser(userId, text) {
    const recipient = users.find((u) => u.id === userId);
    if (!recipient) {
      notify("User not found for notification", "error");
      return;
    }
    const newAlert = {
      id: Date.now(),
      userId,
      text,
      date: new Date().toISOString(),
      read: false,
    };
    setNotifications([...notifications, newAlert]);
    notify(`Notification sent to ${recipient.name}`, "success");
  }

  function markNotificationAsRead(notificationId) {
    setNotifications(
      notifications.map((note) => (note.id === notificationId ? { ...note, read: true } : note))
    );
  }

  const borrowRequests = transactions.filter((tx) => tx.type === "borrow" && tx.status === "pending");
  const activeBorrows = transactions.filter((tx) => tx.type === "borrow" && tx.status === "active");
  const pendingBorrows = borrowRequests;
  const returnEntries = transactions.filter((tx) => tx.type === "return" || tx.status === "completed");

  const dueAlerts = activeBorrows
    .map((tx) => ({ ...tx, daysLeft: Math.ceil((new Date(tx.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) }))
    .filter((tx) => tx.daysLeft <= 2);

  const reportBorrowed = equipment.filter((eq) => eq.status === "Borrowed");
  const userNotifications = currentUser ? notifications.filter((note) => note.userId === currentUser.id) : [];
  const unreadCount = userNotifications.filter((note) => !note.read).length;
  const historyTransactions = transactions.filter((tx) => tx.status !== "pending");

  const uniqueCategories = [...new Set(equipment.map((item) => item.category))].filter(Boolean);

  if (!currentUser) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-sky-100 to-purple-100 p-4 ${theme === "dark" ? "bg-slate-900 text-white" : "text-slate-800"}`}>
        <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-lg dark:bg-slate-800/75">
          <h1 className="text-2xl font-bold text-center">EquipTrack System</h1>
          <p className="text-sm text-center">Digital Borrowing and Returning System for Education Institutions</p>

          <div className="flex justify-center gap-3">
            <button onClick={() => setAuthMode("login")} className={`rounded-lg px-4 py-2 font-semibold ${authMode === "login" ? "bg-violet-600 text-white" : "bg-gray-200"}`}>
              Login
            </button>
            <button onClick={() => setAuthMode("register")} className={`rounded-lg px-4 py-2 font-semibold ${authMode === "register" ? "bg-violet-600 text-white" : "bg-gray-200"}`}>
              Register
            </button>
          </div>

          {authMode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full rounded-lg border p-2"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full rounded-lg border p-2"
                required
              />
              <button className="w-full rounded-lg bg-indigo-600 py-2 text-white">Login</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                className="w-full rounded-lg border p-2"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full rounded-lg border p-2"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full rounded-lg border p-2"
                required
              />
              <button className="w-full rounded-lg bg-teal-600 py-2 text-white">Register</button>
            </form>
          )}

          <div className="text-center text-xs text-slate-600">Default Admin: admin@school.local / Admin@123</div>

          {message ? (
            <div className={`rounded-md p-3 text-sm ${message.type === "error" ? "bg-red-200 text-red-700" : "bg-green-200 text-green-700"}`}>
              {message.text}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${theme === "dark" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-800"}`}>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
        <img src="/logo-transparent.png" alt="EquipTrack logo" className="h-72 w-72 object-contain" />
      </span>
      <header className={`sticky top-0 z-30 border-b ${theme === "dark" ? "border-slate-700" : "border-slate-200"} bg-white/90 p-4 backdrop-blur-md dark:bg-slate-900/90`}>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">EquipTrack System</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300">{currentUser.role === "admin" ? "Admin Dashboard" : "Borrower Dashboard"}</p>
          </div>
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
            >
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg border px-2 py-1 text-xs"
            >
              🔔 {unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-10 z-20 w-80 rounded-lg border bg-white p-3 text-xs shadow-lg dark:bg-slate-800">
                <h4 className="mb-2 font-semibold">Notifications</h4>
                {userNotifications.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400">No notifications</p>
                ) : (
                  <ul className="space-y-2">
                    {userNotifications.map((note) => (
                      <li key={note.id} className={`rounded-md p-2 ${note.read ? "bg-slate-100" : "bg-emerald-100"}`}>
                        <p>{note.text}</p>
                        <p className="text-[10px] text-slate-500">{formatDate(note.date)}</p>
                        {!note.read && (
                          <button onClick={() => markNotificationAsRead(note.id)} className="text-blue-600 underline">
                            Mark read
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <span className="text-sm">👤 {currentUser.name}</span>
            <button onClick={handleLogout} className="rounded-lg bg-rose-500 px-3 py-1 text-xs text-white">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:flex-row">
        <aside className="w-full rounded-xl border p-3 md:w-80 md:shrink-0">
          <div className="mb-4 text-sm font-semibold">Menu</div>
          <nav className="space-y-2 text-sm">
            {[
              { key: "dashboard", label: "Overview" },
              { key: "users", label: "User Management" },
              { key: "equipment", label: "Equipment" },
              { key: "borrow", label: "Borrow/Return" },
              { key: "history", label: "Transactions" },
              { key: "about", label: "About / Help" },
            ].map((item) => (
              <button
                key={item.key}
                className={`w-full text-left rounded-lg px-2 py-2 ${activeTab === item.key ? "bg-violet-100 text-violet-900" : "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                onClick={() => setActiveTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1 space-y-4">
          {message && (
            <div className={`rounded-lg p-3 text-sm ${message.type === "error" ? "bg-red-200 text-red-700" : "bg-emerald-200 text-emerald-800"}`}>
              {message.text}
            </div>
          )}

          {activeTab === "dashboard" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card title="Total Equipment" value={stats.total} />
                <Card title="Available" value={stats.available} color="green" />
                <Card title="Borrowed" value={stats.borrowed} color="yellow" />
                <Card title="Pending Requests" value={stats.pending} color="blue" />
                <Card title="Damaged" value={stats.damaged} color="red" />
                <Card title="Late Returns" value={stats.late} color="rose" />
              </div>

              <div className="rounded-xl border p-4">
                <h2 className="text-lg font-semibold">Active Borrowed Items</h2>
                <div className="mt-2 space-y-2 overflow-x-auto">
                  {activeBorrows.length === 0 ? (
                    <p className="text-sm text-slate-500">No active borrow records.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="text-slate-500">
                        <tr>
                          <th className="p-2">Equipment</th>
                          <th className="p-2">Borrower</th>
                          <th className="p-2">Due</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeBorrows.map((tx) => {
                          const eq = equipment.find((e) => e.id === tx.equipmentId);
                          const user = users.find((u) => u.id === tx.userId);
                          return (
                            <tr key={tx.id} className="border-y border-slate-200 dark:border-slate-700">
                              <td className="p-2">{eq?.name || "-"}</td>
                              <td className="p-2">{user?.name || "-"}</td>
                              <td className="p-2">{formatDate(tx.dueDate)}</td>
                              <td className="p-2">{tx.approval}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {pendingBorrows.length > 0 && (
                <div className="rounded-xl border bg-blue-50 p-4">
                  <h3 className="font-semibold">Pending Requests</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm text-blue-700">
                    {pendingBorrows.map((tx) => {
                      const eq = equipment.find((e) => e.id === tx.equipmentId);
                      const user = users.find((u) => u.id === tx.userId);
                      return (
                        <li key={tx.id} className="mb-2">
                          {user?.name} requested {eq?.name} (due {formatDate(tx.dueDate)}).
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {dueAlerts.length > 0 && (
                <div className="rounded-xl border bg-rose-50 p-4">
                  <h3 className="font-semibold">Due soon / Overdue</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm text-rose-700">
                    {dueAlerts.map((tx) => {
                      const eq = equipment.find((e) => e.id === tx.equipmentId);
                      const user = users.find((u) => u.id === tx.userId);
                      return (
                        <li key={tx.id} className="mb-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>
                              {eq?.name} borrowed by {user?.name} is {tx.daysLeft < 0 ? "overdue" : `${tx.daysLeft} day(s)`}.
                            </span>
                            {currentUser.role === "admin" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    sendNotificationToUser(
                                      user.id,
                                      tx.daysLeft < 0
                                        ? `Your borrowed item ${eq?.name} is overdue. Please return immediately.`
                                        : `Your borrowed item ${eq?.name} is due in ${tx.daysLeft} day(s). Please return on time.`
                                    )
                                  }
                                  className="rounded-md bg-violet-500 px-2 py-1 text-white"
                                >
                                  Send Reminder
                                </button>
                                {tx.daysLeft < 0 && (
                                  <button
                                    onClick={() => sendNotificationToUser(user.id, `Your borrowed item ${eq?.name} is overdue. Late penalty may apply.`)}
                                    className="rounded-md bg-rose-500 px-2 py-1 text-white"
                                  >
                                    Send Late Alert
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}

          {activeTab === "users" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">User Management</h2>
              {currentUser.role !== "admin" ? (
                <p className="text-sm text-slate-500">Only admin can manage users.</p>
              ) : (
                <UserManager users={users} onSave={addOrUpdateUser} onDelete={removeUser} />
              )}
            </div>
          )}

          {activeTab === "equipment" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Equipment Management</h2>
              <EquipmentManager
                equipment={equipment}
                onSave={addOrUpdateEquipment}
                onDelete={removeEquipment}
                viewerRole={currentUser.role}
              />
            </div>
          )}

          {activeTab === "borrow" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Borrowing / Returning</h2>

              <div className="rounded-xl border p-3">
                <h3 className="font-semibold">Find Equipment</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    className="w-full rounded-lg border p-2 md:w-1/3"
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select className="rounded-lg border p-2 md:w-1/5" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All status</option>
                    <option value="Available">Available</option>
                    <option value="Borrowed">Borrowed</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                  <select className="rounded-lg border p-2 md:w-1/5" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="all">All categories</option>
                    {uniqueCategories.map((category) => (
                      <option key={category} value={category}> {category}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-500">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Condition</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleEquipment.map((item) => (
                        <tr key={item.id} className="border-y border-slate-200 dark:border-slate-700">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2">{item.category}</td>
                          <td className="p-2">{item.status}</td>
                          <td className="p-2">{item.condition}</td>
                          <td className="p-2">
                            {item.status === "Available" ? (
                              <button
                                onClick={() => requestBorrow(item.id)}
                                className="rounded-lg bg-cyan-500 px-2 py-1 text-xs text-white"
                              >
                                Borrow
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">Not available</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {currentUser.role === "admin" && borrowRequests.length > 0 && (
                <div className="rounded-xl border p-3">
                  <h3 className="font-semibold">Pending Approvals</h3>
                  <ul className="mt-2 space-y-2">
                    {borrowRequests.map((tx) => {
                      const user = users.find((u) => u.id === tx.userId);
                      const eq = equipment.find((e) => e.id === tx.equipmentId);
                      return (
                        <li key={tx.id} className="flex items-center justify-between rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                          <div className="text-sm">
                            {user?.name} requested {eq?.name}
                          </div>
                          <button onClick={() => approveBorrow(tx.id)} className="rounded-lg bg-emerald-500 px-2 py-1 text-xs text-white">
                            Approve
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border p-3">
                <h3 className="font-semibold">Return Item</h3>
                <div className="mt-2 space-y-2">
                  {activeBorrows.length === 0 ? (
                    <p className="text-sm text-slate-500">No items currently borrowed.</p>
                  ) : (
                    <ul className="space-y-2">
                      {activeBorrows.map((tx) => {
                        const eq = equipment.find((e) => e.id === tx.equipmentId);
                        const user = users.find((u) => u.id === tx.userId);
                        return (
                          <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2">
                            <div>
                              <p className="text-sm">{eq?.name} (Borrowed by {user?.name})</p>
                              <p className="text-xs text-slate-500">Due: {formatDate(tx.dueDate)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => returnEquipment(tx.id, "Good")} className="rounded-lg bg-lime-500 px-2 py-1 text-xs text-white">
                                Return Good
                              </button>
                              <button onClick={() => returnEquipment(tx.id, "Damaged")} className="rounded-lg bg-rose-500 px-2 py-1 text-xs text-white">
                                Return Damaged
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Transaction History</h2>
              <div className="rounded-xl border p-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">User</th>
                      <th className="p-2">Equipment</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Due Date</th>
                      <th className="p-2">Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyTransactions.map((tx) => {
                      const eq = equipment.find((e) => e.id === tx.equipmentId);
                      const user = users.find((u) => u.id === tx.userId);
                      return (
                        <tr key={tx.id} className="border-y border-slate-200 dark:border-slate-700">
                          <td className="p-2">{formatDate(tx.date)}</td>
                          <td className="p-2">{user?.name || "-"}</td>
                          <td className="p-2">{eq?.name || "-"}</td>
                          <td className="p-2">{tx.type}</td>
                          <td className="p-2">{tx.status}</td>
                          <td className="p-2">{tx.dueDate ? formatDate(tx.dueDate) : "-"}</td>
                          <td className="p-2">{tx.condition || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-4 rounded-xl border p-4">
              <h2 className="text-xl font-semibold">About the Borrowing and Returning System</h2>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                This project is a web-based equipment borrowing and returning system for schools and organizations. It helps
                track equipment usage, manage users, and create borrowing reports. Responsive design ensures usability on desktop
                and mobile devices.
              </p>
              <h3 className="font-semibold">Features included:</h3>
              <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300">
                <li>User authentication (login/register)</li>
                <li>Admin/user roles with access control</li>
                <li>Equipment CRUD operations</li>
                <li>Borrow & return flows</li>
                <li>Dashboard metrics, search, filters, and history logs</li>
              </ul>
              <h3 className="font-semibold">Contact / Help</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                For support, email: support@equiptrack.local | Instructions included in the “Borrowing / Returning” tab.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t p-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Designed with responsive Next.js + Tailwind for laptop and mobile. 2026 EquipTrack System.
      </footer>
    </div>
  );
}

function Card({ title, value, color }) {
  const colorMap = {
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    rose: "bg-fuchsia-100 text-fuchsia-700",
    blue: "bg-sky-100 text-sky-700",
  };
  const className = color ? colorMap[color] : "bg-sky-100 text-sky-700";

  return (
    <div className={`rounded-xl p-4 ${className}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function UserManager({ users, onSave, onDelete }) {
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", role: "borrower", password: "" });

  useEffect(() => {
    if (!editTarget) return;
    setForm(editTarget);
  }, [editTarget]);

  function reset() {
    setEditTarget(null);
    setForm({ name: "", email: "", role: "borrower", password: "" });
  }

  function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;
    onSave({ ...form, id: editTarget?.id || undefined });
    reset();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
        <input className="rounded-lg border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="rounded-lg border p-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="rounded-lg border p-2" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="rounded-lg border p-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="borrower">Borrower</option>
          <option value="admin">Admin</option>
        </select>
        <div className="sm:col-span-2 flex gap-2">
          <button className="rounded-lg bg-indigo-500 px-3 py-2 text-white">{editTarget ? "Update" : "Add"} User</button>
          <button type="button" onClick={reset} className="rounded-lg border px-3 py-2">
            Cancel
          </button>
        </div>
      </form>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.role}</td>
                <td className="p-2 space-x-1">
                  <button onClick={() => setEditTarget(user)} className="rounded-lg bg-amber-300 px-2 py-1 text-xs">
                    Edit
                  </button>
                  <button onClick={() => onDelete(user.id)} className="rounded-lg bg-rose-300 px-2 py-1 text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EquipmentManager({ equipment, onSave, onDelete, viewerRole }) {
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Laptop", status: "Available", condition: "Good" });

  useEffect(() => {
    if (editTarget) setForm(editTarget);
  }, [editTarget]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.category) return;
    onSave({ ...form, id: editTarget?.id });
    setForm({ name: "", category: "Laptop", status: "Available", condition: "Good" });
    setEditTarget(null);
  };

  return (
    <div className="space-y-4">
      {viewerRole === "admin" && (
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
          <input className="rounded-lg border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="rounded-lg border p-2" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <select className="rounded-lg border p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Available</option>
            <option>Borrowed</option>
            <option>Damaged</option>
          </select>
          <select className="rounded-lg border p-2" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
            <option>Good</option>
            <option>Damaged</option>
          </select>
          <div className="sm:col-span-2 flex gap-2">
            <button className="rounded-lg bg-cyan-500 px-3 py-2 text-white">{editTarget ? "Update" : "Add"} Equipment</button>
            <button type="button" onClick={() => { setEditTarget(null); setForm({ name: "", category: "Laptop", status: "Available", condition: "Good" }); }} className="rounded-lg border px-3 py-2">
              Clear
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Status</th>
              <th className="p-2">Condition</th>
              {viewerRole === "admin" ? <th className="p-2">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {equipment.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-2">{item.name}</td>
                <td className="p-2">{item.category}</td>
                <td className="p-2">{item.status}</td>
                <td className="p-2">{item.condition}</td>
                {viewerRole === "admin" ? (
                  <td className="p-2 space-x-1">
                    <button onClick={() => setEditTarget(item)} className="rounded-lg bg-amber-300 px-2 py-1 text-xs">
                      Edit
                    </button>
                    <button onClick={() => onDelete(item.id)} className="rounded-lg bg-rose-300 px-2 py-1 text-xs">
                      Delete
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
