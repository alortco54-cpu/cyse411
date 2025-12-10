const express = require("express");
const app = express();

app.use(express.json());

// Fake "database"
const users = [
  { id: 1, name: "Alice", role: "customer", department: "north" },
  { id: 2, name: "Bob", role: "customer", department: "south" },
  { id: 3, name: "Charlie", role: "support", department: "north" },
];

const orders = [
  { id: 1, userId: 1, item: "Laptop", region: "north", total: 2000 },
  { id: 2, userId: 1, item: "Mouse", region: "north", total: 40 },
  { id: 3, userId: 2, item: "Monitor", region: "south", total: 300 },
  { id: 4, userId: 2, item: "Keyboard", region: "south", total: 60 },
];

// Simple fake "authentication" via headers:
//   X-User-Id: <user id>
// (Pretend real auth already happened)
function fakeAuth(req, res, next) {
  const idHeader = req.header("X-User-Id");
  const id = idHeader ? parseInt(idHeader, 10) : null;

  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(401).json({ error: "Unauthenticated: set X-User-Id header" });
  }

  req.user = user; // Attach authenticated user
  next();
}

// Apply authentication to all routes
app.use(fakeAuth);

// SECURE: FIXED ENDPOINT WITH PROPER ACCESS CONTROL
app.get("/orders/:id", (req, res) => {
  const orderId = parseInt(req.params.id, 10);

  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const user = req.user;

  // Customers must ONLY access their own orders
  if (user.role === "customer" && order.userId !== user.id) {
    return res.status(403).json({ error: "Access denied: you do not own this order" });
  }

  // Support users can view orders ONLY in their own region
  if (user.role === "support" && order.region !== user.department) {
    return res.status(403).json({ error: "Access denied: region mismatch" });
  }

  // OK: return order safely
  return res.json(order);
});

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Access Control Tutorial API",
    currentUser: req.user,
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
