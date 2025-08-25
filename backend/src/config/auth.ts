export default {
  secret: process.env.JWT_SECRET || "mysecret",
  expiresIn: "2h", // Aumentado de 15m para 2 horas
  refreshSecret: process.env.JWT_REFRESH_SECRET || "myanothersecret",
  refreshExpiresIn: "7d"
};
