"use client"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Users, Settings, BarChart2, FileText, X, AlertTriangle, History } from "lucide-react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function AdminPanel() {
  const router = useRouter()

  // Add this at the top of your component, after the router declaration and before the initialEditingUser
  // Modified checkAuth function
  const checkAuth = async () => {
    try {
      // First check if we have the email in localStorage
      const userEmail = localStorage.getItem("userEmail")
      if (!userEmail) {
        setIsAuthorized(false)
        router.push("/login")
        setIsLoading(false)
        return
      }

      const response = await fetch("https://edu.largifysolutions.com/auth.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "checkAuth",
          email: userEmail,
        }),
      })

      const data = await response.json()

      if (data.success && data.user?.role === "admin") {
        setIsAuthorized(true)
        setCurrentUser(data.user)
        setIsAuthenticated(true)
        await fetchUsers() // Fetch users after successful authentication
      } else {
        setIsAuthorized(false)
        router.push("/login")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setIsAuthorized(false)
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  // Add this at the beginning of your component, after the router declaration
  const initialEditingUser = {
    name: "",
    email: "",
    role: "user",
    package: "basic",
    expiryDate: "",
    schoolName: "",
    status: "active",
  }

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState([])

  // Add these state variables
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    status: "",
    package: "",
  })
  const [userHistory, setUserHistory] = useState([])
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    expiringIn30Days: 0,
    addedThisMonth: 0,
    packageDistribution: {},
  })

  // Replace the existing newUser state declaration with this
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    package: "basic",
    expiryDate: "",
    schoolName: "",
    status: "active",
  })

  // Add activity tracking
  const [userActivity, setUserActivity] = useState({
    lastLogin: new Date().toISOString(),
    activeSession: true,
    loginHistory: [],
  })

  // Add error handling state
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Define tabs array that was missing
  const tabs = [
    { id: "users", label: "Users", icon: <Users className="w-5 h-5" /> },
    { id: "stats", label: "Statistics", icon: <BarChart2 className="w-5 h-5" /> },
    { id: "logs", label: "System Logs", icon: <FileText className="w-5 h-5" /> },
    { id: "system", label: "System", icon: <Settings className="w-5 h-5" /> },
    {
      id: "history",
      label: "User History",
      icon: <History className="w-5 h-5" />,
    },
  ]

  // Define systemStats object that was missing
  const [systemStats, setSystemStats] = useState({
    routes: {
      total: 24,
      active: ["dashboard", "users", "papers", "settings", "profile"],
    },
    features: {
      paperGeneration: true,
      userManagement: true,
      authentication: true,
      paymentSystem: true,
    },
    components: {
      core: ["PaperGenerator", "UserManager", "AuthProvider", "PaymentGateway"],
    },
  })

  // Add these new states
  const [stats, setStats] = useState({
    papers: {
      total: 1287,
      today: 45,
      thisWeek: 312,
      thisMonth: 892,
      bySubject: {
        Physics: 428,
        Chemistry: 389,
        Biology: 470,
      },
    },
    questions: {
      total: 5000,
      mcqs: 2500,
      shortQuestions: 1500,
      longQuestions: 1000,
      bySubject: {
        Physics: 1800,
        Chemistry: 1600,
        Biology: 1600,
      },
    },
    system: {
      uptime: "99.9%",
      lastBackup: "2024-01-20 03:00 AM",
      storageUsed: "45%",
      activeUsers: 28,
    },
  })

  const [logs, setLogs] = useState([
    { id: 1, type: "user", action: "Paper Generated", user: "John Doe", timestamp: "2024-01-20 14:30" },
    { id: 2, type: "system", action: "Backup Completed", user: "System", timestamp: "2024-01-20 03:00" },
    { id: 3, type: "error", action: "Failed Login Attempt", user: "Unknown", timestamp: "2024-01-19 22:15" },
  ])

  // Replace the existing editingUser state declaration with this
  const [editingUser, setEditingUser] = useState(initialEditingUser)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")
  const modalRef = useRef(null)

  // Add function to check for expired users
  const checkExpiredUsers = async () => {
    try {
      const response = await fetch("https://edu.largifysolutions.com/auth.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "checkExpiredUsers",
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Refresh users list after deletion
        fetchUsers()
      }
    } catch (err) {
      console.error("Error checking expired users:", err)
    }
  }

  // Add function to fetch user history
  const fetchUserHistory = async () => {
    try {
      const response = await fetch("https://edu.largifysolutions.com/auth.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "getUserHistory",
          filters: filters,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setUserHistory(data.history)
        setUserStats(data.stats)
      }
    } catch (err) {
      console.error("Error fetching user history:", err)
    }
  }

  // Add useEffect to check for expired users periodically
  useEffect(() => {
    // Only run if authenticated
    if (isAuthenticated) {
      // Check for expired users every hour
      checkExpiredUsers()
      const interval = setInterval(checkExpiredUsers, 3600000) // 1 hour in milliseconds

      return () => clearInterval(interval)
    }
  }, [isAuthenticated]) // Run when authentication status changes

  // Add useEffect for user history
  useEffect(() => {
    if (activeTab === "history") {
      fetchUserHistory()
    }
  }, [activeTab, filters])

  // Replace the existing authentication useEffect with this updated one
  // Find the useEffect that starts with "const checkAuth = async () => {" and replace it with:
  useEffect(() => {
    checkAuth()
  }, [])

  // Add function to fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch("https://edu.largifysolutions.com/auth.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getAllUsers",
        }),
      })

      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (err) {
      console.error("Error fetching users:", err)
    }
  }

  // Modify handleCreateUser to connect with backend
  const handleCreateUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Add validation
      if (!newUser.name || !newUser.email || !newUser.password) {
        throw new Error("Please fill in all required fields")
      }

      // Add email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUser.email)) {
        throw new Error("Please enter a valid email address")
      }

      // Add password validation
      if (newUser.password.length < 6) {
        throw new Error("Password must be at least 6 characters long")
      }

      const response = await fetch("https://edu.largifysolutions.com/auth.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "createUser",
          ...newUser,
        }),
      })

      const data = await response.json()
      if (data.success) {
        fetchUsers() // Refresh user list
        setNewUser({
          name: "",
          email: "",
          password: "",
          role: "user",
          package: "basic",
          expiryDate: "",
          schoolName: "",
          status: "active",
        })
        setSuccessMessage("User created successfully!")
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch (err) {
      setError(err.message || "An error occurred while creating the user")
    } finally {
      setLoading(false)
    }
  }

  // Add user deletion handler
  const handleDeleteUser = async (userId) => {
    try {
      setUsers(users.filter((user) => user.id !== userId))
      // Add success notification here if needed
    } catch (err) {
      setError(err.message)
    }
  }

  // Add user edit handler
  const handleEditUser = async (userId, updatedData) => {
    try {
      setUsers(users.map((user) => (user.id === userId ? { ...user, ...updatedData } : user)))
      // Add success notification here if needed
    } catch (err) {
      setError(err.message)
    }
  }

  // Add useEffect for initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        await fetchUsers() // Fetch users when component mounts
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      loadInitialData()
    }
  }, [isAuthenticated]) // Run when authentication status changes

  // Replace the existing handleEditClick function with this
  const handleEditClick = (user) => {
    setEditingUser({
      ...initialEditingUser,
      ...user,
      // Ensure all required fields have default values
      package: user.package || "basic",
      expiryDate: user.expiryDate || user.expiry_date || "",
      schoolName: user.schoolName || user.school_name || "",
      status: user.status || "active",
    })
    setIsEditModalOpen(true)
  }

  // Modify handleSaveEdit to connect with backend
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editingUser.email)) {
        setError("Please enter a valid email address")
        return
      }

      const response = await fetch("https://edu.largifysolutions.com/auth.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "updateUser",
          ...editingUser,
        }),
      })

      const data = await response.json()
      if (data.success) {
        fetchUsers() // Refresh user list
        setIsEditModalOpen(false)
        setSuccessMessage(`${editingUser.name}'s information has been updated successfully.`)

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("")
        }, 3000)
      } else {
        setError(data.error || "Failed to update user")
      }
    } catch (err) {
      setError("An error occurred while updating the user")
    }
  }

  // Handle opening delete confirmation modal
  const handleDeleteClick = (user) => {
    setUserToDelete(user)
    setIsDeleteModalOpen(true)
  }

  // Modify handleConfirmDelete to connect with backend
  const handleConfirmDelete = async () => {
    try {
      const response = await fetch("https://edu.largifysolutions.com/auth.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deleteUser",
          userId: userToDelete.id,
        }),
      })

      const data = await response.json()
      if (data.success) {
        fetchUsers() // Refresh user list
        setIsDeleteModalOpen(false)
        setSuccessMessage(`${userToDelete.name} has been deleted successfully.`)

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("")
        }, 3000)
      } else {
        setError(data.error || "Failed to delete user")
      }
    } catch (err) {
      setError("An error occurred while deleting the user")
    }
  }

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsEditModalOpen(false)
        setIsDeleteModalOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [modalRef])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : isAuthenticated && isAuthorized ? (
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
                  <p className="text-gray-600 mt-2">Manage your application and users</p>
                </div>
                {/* User info */}
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {currentUser?.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                    <p className="text-xs text-gray-500">{currentUser?.schoolName}</p>
                    {currentUser?.package && (
                      <p className="text-xs text-blue-600">
                        {currentUser?.package} Plan • Expires: {currentUser?.expiryDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-all ${
                    activeTab === tab.id ? "bg-white shadow-lg text-blue-600" : "hover:bg-white/50 text-gray-600"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 gap-8">
              {/* Keep the rest of your content here */}
              {/* User Creation Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Create New User</h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => {
                        const newRole = e.target.value
                        setNewUser({
                          ...newUser,
                          role: newRole,
                          // Reset package and expiry date if switching to admin
                          ...(newRole === "admin" && { package: "N/A", expiryDate: "N/A" }),
                        })
                      }}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newUser.role === "user" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
                          <select
                            value={newUser.package}
                            onChange={(e) => setNewUser({ ...newUser, package: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="basic">Basic</option>
                            <option value="pro">Professional</option>
                            <option value="business">Business</option>
                            <option value="exceptional">Exceptional</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input
                            type="date"
                            value={newUser.expiryDate}
                            onChange={(e) => setNewUser({ ...newUser, expiryDate: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <input
                      type="text"
                      value={newUser.schoolName}
                      onChange={(e) => setNewUser({ ...newUser, schoolName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                  >
                    Create User
                  </button>
                </form>
              </motion.div>

              {/* Admins List */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Super Admin</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-6 py-3 text-left">Name</th>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((user) => user.role === "admin")
                        .map((admin) => (
                          <tr key={admin.id} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-4">{admin.name}</td>
                            <td className="px-6 py-4">{admin.email}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${
                                  admin.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}
                              >
                                {admin.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleEditClick(admin)}
                                className="text-blue-600 hover:text-blue-800 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(admin)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Teachers/Users List */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Admin</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-6 py-3 text-left">Name</th>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-left">School</th>
                        <th className="px-6 py-3 text-left">Package</th>
                        <th className="px-6 py-3 text-left">Expiry Date</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((user) => user.role === "user")
                        .map((user) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-4">{user.name}</td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4">{user.school_name || user.schoolName}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${
                                  user.package === "pro"
                                    ? "bg-blue-100 text-blue-700"
                                    : user.package === "business"
                                      ? "bg-amber-100 text-amber-700"
                                      : user.package === "exceptional"
                                        ? "bg-purple-100 text-purple-700"
                                        : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {user.package}
                                {user.package === "pro" && " (Limited)"}
                                {user.package === "business" && " (Full)"}
                                {user.package === "exceptional" && " (Full+)"}
                              </span>
                            </td>
                            <td className="px-6 py-4">{user.expiry_date || user.expiryDate}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${
                                  user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}
                              >
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleEditClick(user)}
                                className="text-blue-600 hover:text-blue-800 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(user)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please log in to access this page.</p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Keep all your conditional tab content and modals */}
        {isAuthorized && activeTab === "system" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
          >
            {/* App Structure */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">App Structure</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Routes</span>
                  <span className="font-semibold text-blue-600">{systemStats.routes.total}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Key Directories:</span>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500">📁</span> app
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500">📁</span> components
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500">📁</span> contexts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500">📁</span> hooks
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Core Features */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Core Features</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${systemStats.features.paperGeneration ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>Paper Generation System</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${systemStats.features.userManagement ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>User Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${systemStats.features.authentication ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>Authentication System</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${systemStats.features.paymentSystem ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>Payment Integration</span>
                </div>
              </div>
            </div>

            {/* Active Routes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Active Routes</h3>
              <div className="space-y-2">
                {systemStats.routes.active.map((route, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">●</span>
                    <span className="text-gray-600">/{route}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Components */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Core Components</h3>
              <div className="space-y-3">
                {systemStats.components.core.map((component, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">{component}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Active</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Files */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">System Files</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-500">📄</span>
                  <span className="text-gray-600">globals.css</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-500">📄</span>
                  <span className="text-gray-600">fonts.js</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-500">📄</span>
                  <span className="text-gray-600">layout.jsx</span>
                </div>
              </div>
            </div>

            {/* App Features */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">App Features</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <span className="block font-medium">Paper Generation</span>
                  <span className="text-xs text-gray-500">Active Module</span>
                </div>
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <span className="block font-medium">User Authentication</span>
                  <span className="text-xs text-gray-500">Active Module</span>
                </div>
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <span className="block font-medium">Paper History</span>
                  <span className="text-xs text-gray-500">Active Module</span>
                </div>
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <span className="block font-medium">Teacher Management</span>
                  <span className="text-xs text-gray-500">Active Module</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isAuthorized && activeTab === "stats" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
          >
            {/* Paper Generation Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Paper Generation</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Papers</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.papers.total}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-sm text-gray-600">Today</div>
                    <div className="font-semibold text-blue-700">{stats.papers.today}</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-sm text-gray-600">Week</div>
                    <div className="font-semibold text-blue-700">{stats.papers.thisWeek}</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-sm text-gray-600">Month</div>
                    <div className="font-semibold text-blue-700">{stats.papers.thisMonth}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Bank Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Question Bank</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Questions</span>
                  <span className="text-2xl font-bold text-green-600">{stats.questions.total}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">MCQs</span>
                    <span className="font-semibold text-green-600">{stats.questions.mcqs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Short Questions</span>
                    <span className="font-semibold text-green-600">{stats.questions.shortQuestions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Long Questions</span>
                    <span className="font-semibold text-green-600">{stats.questions.longQuestions}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Uptime</span>
                  <span className="text-green-600 font-semibold">{stats.system.uptime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Storage Used</span>
                  <span className="text-amber-600 font-semibold">{stats.system.storageUsed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Users</span>
                  <span className="text-blue-600 font-semibold">{stats.system.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Backup</span>
                  <span className="text-gray-600 text-sm">{stats.system.lastBackup}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isAuthorized && activeTab === "logs" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-6 mt-8"
          >
            <h3 className="text-xl font-semibold mb-6">System Logs</h3>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border-b">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        log.type === "error" ? "bg-red-500" : log.type === "system" ? "bg-blue-500" : "bg-green-500"
                      }`}
                    ></span>
                    <span className="font-medium">{log.action}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{log.user}</span>
                    <span className="text-sm text-gray-500">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {isAuthorized && activeTab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 mt-8">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="pending">Pending Expiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setFilters((prev) => ({ ...prev, package: e.target.value }))}
                  >
                    <option value="">All</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Professional</option>
                    <option value="business">Business</option>
                    <option value="exceptional">Exceptional</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold mb-2">Total Users</h4>
                <div className="text-3xl font-bold text-blue-600">{userStats.totalUsers}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold mb-2">Active Users</h4>
                <div className="text-3xl font-bold text-green-600">{userStats.activeUsers}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold mb-2">Expired Users</h4>
                <div className="text-3xl font-bold text-red-600">{userStats.expiredUsers}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold mb-2">Expiring Soon</h4>
                <div className="text-3xl font-bold text-amber-600">{userStats.expiringIn30Days}</div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-6">User History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-6 py-3 text-left">User</th>
                      <th className="px-6 py-3 text-left">Action</th>
                      <th className="px-6 py-3 text-left">Package</th>
                      <th className="px-6 py-3 text-left">Expiry Date</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userHistory.map((history) => (
                      <tr key={history.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{history.name}</div>
                            <div className="text-sm text-gray-500">{history.email}</div>
                            <div className="text-xs text-gray-400">{history.school_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              history.action === "created"
                                ? "bg-green-100 text-green-700"
                                : history.action === "updated"
                                  ? "bg-blue-100 text-blue-700"
                                  : history.action === "deleted"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {history.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              history.package === "pro"
                                ? "bg-blue-100 text-blue-700"
                                : history.package === "business"
                                  ? "bg-purple-100 text-purple-700"
                                  : history.package === "exceptional"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {history.package}
                          </span>
                        </td>
                        <td className="px-6 py-4">{new Date(history.expiry_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              history.status === "active"
                                ? "bg-green-100 text-green-700"
                                : history.status === "expired"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {history.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(history.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success Message Toast */}
        {successMessage && (
          <div className="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50 animate-fade-in-up">
            {successMessage}
          </div>
        )}

        {/* Edit User Modal */}
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              ref={modalRef}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  Edit {editingUser.role === "admin" ? "Administrator" : "User"}
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">{error}</div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {editingUser.role === "user" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
                      <select
                        value={editingUser.package}
                        onChange={(e) => setEditingUser({ ...editingUser, package: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="basic">Basic</option>
                        <option value="pro">Professional</option>
                        <option value="business">Business</option>
                        <option value="exceptional">Exceptional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={editingUser.expiryDate}
                        onChange={(e) => setEditingUser({ ...editingUser, expiryDate: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input
                    type="text"
                    value={editingUser.schoolName}
                    onChange={(e) => setEditingUser({ ...editingUser, schoolName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              ref={modalRef}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center mb-4 text-red-600">
                <AlertTriangle className="w-6 h-6 mr-2" />
                <h3 className="text-xl font-semibold">Confirm Deletion</h3>
              </div>

              <p className="mb-6">
                Are you sure you want to delete <span className="font-semibold">{userToDelete.name}</span>? This action
                cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
