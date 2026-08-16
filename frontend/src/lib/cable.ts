import { createConsumer } from "@rails/actioncable";

export const getCableConsumer = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("token") ||
    "";

  const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
  const wsUrl = `ws://localhost:3000/cable?token=${encodeURIComponent(cleanToken)}`;

  return createConsumer(wsUrl);
};