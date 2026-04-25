import http from "http";
import fs from "fs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "rudy_assignment2_secret_X9kL42pQ7vM18zBn";

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

http
  .createServer((req, res) => {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Hello Apache!\n");
      return;
    }

    if (req.method === "POST") {
      if (req.url === "/login" || req.url === "/node/login") {
        let body = "";

        req.on("data", (chunk) => {
          body += chunk;
        });

        req.on("end", () => {
          try {
            const data = JSON.parse(body);

            if (!data.username || !data.password) {
              sendJson(res, 400, { error: "Username and password are required" });
              return;
            }

            const usersFile = fs.readFileSync("./users.txt", "utf8");
            const lines = usersFile.trim().split(/\r?\n/);

            let foundUser = null;

            for (const line of lines) {
              const [userId, username, password, role] = line.split(",");

              if (username === data.username) {
                foundUser = {
                  userId: Number(userId),
                  username,
                  password,
                  role
                };
                break;
              }
            }

            if (!foundUser) {
              sendJson(res, 404, { error: `${data.username} not found` });
              return;
            }

            if (foundUser.password !== data.password) {
              sendJson(res, 401, { error: "Invalid password" });
              return;
            }

            const token = jwt.sign(
              {
                userId: foundUser.userId,
                role: foundUser.role
              },
              JWT_SECRET,
              { expiresIn: "1h" }
            );

            sendJson(res, 200, { token });
          } catch (err) {
            console.log(err);
            sendJson(res, 500, { error: "Server error" });
          }
        });

        return;
      }
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found\n");
  })
  .listen(8000);

console.log("listening on port 8000");