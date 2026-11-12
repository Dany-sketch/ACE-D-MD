const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
    res.send("ACE D MD is running!");
});

app.get("/health", (req, res) => {
    res.send("OK");
});

app.listen(PORT, () => {
    console.log(`ACE D MD server running on port ${PORT}`);
});

let isStarting = false;

async function startBot() {
    if (isStarting) return;
    isStarting = true;

    try {
        const { state, saveCreds } =
            await useMultiFileAuthState("./session");

        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: "silent" }),
            browser: Browsers.macOS("Desktop"),
            markOnlineOnConnect: false
        });

        let pairingRequested = false;

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !sock.authState.creds.registered && !pairingRequested) {
                pairingRequested = true;

                try {
                    const number = process.env.PHONE_NUMBER;

                    if (!number || !/^\d+$/.test(number)) {
                        console.log("ERROR: Check your PHONE_NUMBER environment variable.");
                        return;
                    }

                    const code = await sock.requestPairingCode(number);
                    console.log("ACE D MD PAIR CODE:", code);
                } catch (error) {
                    console.log("Pairing error:", error.message);
                }
            }

            if (connection === "open") {
                console.log("ACE D MD connected to WhatsApp!");
                isStarting = false;
            }

            if (connection === "close") {
                isStarting = false;

                const statusCode =
                    lastDisconnect?.error?.output?.statusCode;

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log("WhatsApp logged out. Please link again.");
                } else {
                    console.log("Connection closed. Reconnecting...");
                    setTimeout(startBot, 5000);
                }
            }
        });

        sock.ev.on("messages.upsert", async ({ messages }) => {
            for (const msg of messages) {
                if (!msg.message || msg.key.fromMe) continue;

                const jid = msg.key.remoteJid;

                const text =
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    "";

                const command = text.trim().toLowerCase();

                if (command === ".ping") {
                    await sock.sendMessage(jid, {
                        text: "Pong! ACE D MD is online."
                    });
                }

                if (command === ".menu") {
                    await sock.sendMessage(jid, {
                        text:
                            "╭━━━〔 ACE D MD 〕━━━╮\n" +
                            "┃ .ping\n" +
                            "┃ .menu\n" +
                            "┃ .owner\n" +
                            "┃ .about\n" +
                            "╰━━━━━━━━━━━━━━━━╯"
                    });
                }

                if (command === ".owner") {
                    await sock.sendMessage(jid, {
                        text: "ACE D MD Bot Owner"
                    });
                }

                if (command === ".about") {
                    await sock.sendMessage(jid, {
                        text: "ACE D MD WhatsApp Bot\nPowered by Baileys."
                    });
                }
            }
        });

    } catch (error) {
        isStarting = false;
        console.log("Bot startup error:", error.message);
        setTimeout(startBot, 10000);
    }
}

startBot();
