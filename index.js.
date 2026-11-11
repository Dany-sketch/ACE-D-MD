const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const express = require("express");
const pino = require("pino");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("ACE D MD is running!");
});

app.get("/health", (req, res) => {
    res.json({
        bot: "ACE D MD",
        status: "running"
    });
});

app.listen(PORT, () => {
    console.log("ACE D MD server running on port " + PORT);
});

const PHONE_NUMBER = "254797555742";

async function startBot() {

    const { state, saveCreds } =
        await useMultiFileAuthState("./session");

    const { version } =
        await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["ACE D MD", "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {

        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("ACE D MD CONNECTED!");
        }

        if (connection === "close") {

            const status =
                lastDisconnect?.error?.output?.statusCode;

            if (status !== DisconnectReason.loggedOut) {
                console.log("Reconnecting...");
                setTimeout(startBot, 5000);
            } else {
                console.log("WhatsApp logged out.");
            }
        }
    });

    if (!state.creds.registered) {
        setTimeout(async () => {
            try {
                const code =
                    await sock.requestPairingCode(PHONE_NUMBER);

                console.log("ACE D MD PAIR CODE:", code);
            } catch (error) {
                console.log("Pairing error:", error.message);
            }
        }, 3000);
    }

    sock.ev.on("messages.upsert", async ({ messages }) => {

        const msg = messages[0];

        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

        const command = text.trim().toLowerCase();

        if (command === ".ping") {
            await sock.sendMessage(from, {
                text: "Pong! ACE D MD is online! 🏓"
            });
        }

        if (command === ".menu") {
            await sock.sendMessage(from, {
                text: `╭━━━『 ACE D MD 』━━━
┃
┃ .ping
┃ .menu
┃ .owner
┃ .about
┃
╰━━━━━━━━━━━━━━`
            });
        }

        if (command === ".owner") {
            await sock.sendMessage(from, {
                text: "ACE D MD Owner"
            });
        }

        if (command === ".about") {
            await sock.sendMessage(from, {
                text: "ACE D MD powered by Baileys."
            });
        }
    });
}

startBot().catch(console.error);
