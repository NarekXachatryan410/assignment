import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/index.tsx";
import { client } from "./graphql/client.ts"
import { ApolloProvider } from "@apollo/client/react";

createRoot(document.getElementById("root")!).render(
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>
);
