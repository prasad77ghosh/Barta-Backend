export const corsInfo = {
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

export const cookieInfo = {
  name: "io",
  path: "/",
  httpOnly: true,
  sameSite: "lax",
};
