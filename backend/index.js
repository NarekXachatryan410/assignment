import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";

import typeDefs from "./src/schema/typeDefs.js";
import resolvers from "./src/schema/resolvers.js";
import cookieParser from "cookie-parser";
import env from "./src/config/env.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(cookieParser());

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use(
  "/api",
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      const token = req.cookies.token;

      let user = null;

      if (token) {
        try {
          user = jwt.verify(token, env.JWT_SECRET);
        } catch {}
      }

      return {
        req,
        res,
        user,
      };
    },
  }),
);

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
