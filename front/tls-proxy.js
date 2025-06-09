import { spawn } from "child_process";
import fs from "fs";
import https from "https";
import { createProxyServer } from "http-proxy";
import path from "path";

const certPath = path.join(process.cwd(), "certs");
const keyFile = path.join(certPath, "key.pem");
const certFile = path.join(certPath, "cert.pem");

function generateSelfSignedCert() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(certPath)) {
      fs.mkdirSync(certPath);
    }

    if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
      console.log("Certificate already exists.");
      return resolve();
    }

    console.log("Generating self-signed certificate...");

    const subj = "/CN=localhost";
    const args = [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      keyFile,
      "-out",
      certFile,
      "-days",
      "365",
      "-subj",
      subj,
    ];

    const openssl = spawn("openssl", args);

    openssl.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    openssl.on("exit", (code) => {
      if (code === 0) {
        console.log("Self-signed certificate generated.");
        resolve();
      } else {
        console.error("OpenSSL certificate generation failed. Exiting...");
        reject(new Error("OpenSSL failed"));
      }
    });
  });
}

function startNextApp() {
  console.log("Starting Next.js server...");
  const next = spawn("pnpm", ["start"], {
    env: process.env,
    stdio: "inherit",
  });

  next.on("exit", (code) => process.exit(code));
}

function startProxy() {
  const targetPort = 3000;
  const proxy = createProxyServer({ target: `http://localhost:${targetPort}` });

  const options = {
    key: fs.readFileSync(keyFile),
    cert: fs.readFileSync(certFile),
  };

  const server = https.createServer(options, (req, res) => {
    proxy.web(req, res);
  });

  server.listen(443, () => {
    console.log("HTTPS proxy listening on port 443");
  });
}

async function main() {
  try {
    await generateSelfSignedCert();
    startNextApp();
    startProxy();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
