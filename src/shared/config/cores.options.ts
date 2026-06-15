const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS === "*"
    ? true
    : process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
      ],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400,
};



export default corsOptions;
