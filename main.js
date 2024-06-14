const {
  default: WADefault,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  PHONENUMBER_MCC,
  makeInMemoryStore,
  jidDecode,
  proto,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const axios = require("axios");
const FileType = require("file-type");
const chalk = require("chalk");
const PhoneNumber = require("awesome-phonenumber");
const readline = require("readline");
const { smsg, getBuffer, fetchJson } = require("./function/simple");
let db_respon_list = JSON.parse(fs.readFileSync("./libs/list.json"));
let set_proses = JSON.parse(fs.readFileSync("./libs/set_proses.json"));
let set_done = JSON.parse(fs.readFileSync("./libs/set_done.json"));

const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

const usePairingCode = process.argv.includes("--pairing");
const pairingNumber = "";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const {
  isSetDone,
  addSetDone,
  removeSetDone,
  changeSetDone,
  getTextSetDone,
  isSetProses,
  addSetProses,
  removeSetProses,
  changeSetProses,
  getTextSetProses,
} = require("./function/store");

async function lutzStartedBot() {
  const { state, saveCreds } = await useMultiFileAuthState(`./session`);

  const lutz = WADefault({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !usePairingCode,
    browser: ["Chrome (Linux)"],
    patchMessageBeforeSending: (message) => {
      const requiresPatch = !!(
        message.buttonsMessage ||
        message.templateMessage ||
        message.listMessage
      );
      if (requiresPatch) {
        message = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...message,
            },
          },
        };
      }
      return message;
    },
    auth: state,
  });

  store.bind(lutz.ev);

  if (!lutz.authState.creds.registered) {
    let phoneNumber;
    if (!!pairingNumber) {
      phoneNumber = pairingNumber.replace(/[^0-9]/g, "");

      if (
        !Object.keys(PHONENUMBER_MCC).some((v) => phoneNumber.startsWith(v))
      ) {
        console.log(
          chalk.bgBlack(
            chalk.redBright(
              "Mulailah dengan kode WhatsApp negara Anda, Contoh : 62xxx"
            )
          )
        );
        process.exit(0);
      }
    } else {
      phoneNumber = await question(
        chalk.bgBlack(chalk.greenBright(`silakan ketik nomor whatsapp Anda : `))
      );
      phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

      // Ask again when entering the wrong number
      if (
        !Object.keys(PHONENUMBER_MCC).some((v) => phoneNumber.startsWith(v))
      ) {
        console.log(
          chalk.bgWhitelack(
            chalk.redBright(
              "Mulailah dengan kode WhatsApp negara Anda, Contoh : 62xxx"
            )
          )
        );

        phoneNumber = await question(
          chalk.bgBlack(
            chalk.greenBright(`Silakan ketik nomor WhatsApp Anda : `)
          )
        );
        phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
        rl.close();
      }
    }

    setTimeout(async () => {
      let code = await lutz.requestPairingCode(phoneNumber);
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      console.log(
        chalk.yellow(chalk.bgGreen(`Your Pairing Code : `)),
        chalk.black(chalk.white(code))
      );
    }, 3000);
  }

  lutz.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message =
        Object.keys(mek.message)[0] === "ephemeralMessage"
          ? mek.message.ephemeralMessage.message
          : mek.message;
      if (mek.key && mek.key.remoteJid === "status@broadcast") return;
      if (!lutz.public && !mek.key.fromMe && chatUpdate.type === "notify")
        return;
      if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;
      m = smsg(lutz, mek, store);
      require("./handler/lutz")(
        lutz,
        m,
        chatUpdate,
        store,
        db_respon_list,
        set_done,
        set_proses
      );
    } catch (err) {
      console.log(err);
    }
  });

  lutz.ev.on("group-participants.update", async (anu) => {
    console.log(anu);
  });

  // Setting
  lutz.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (
        (decode.user && decode.server && decode.user + "@" + decode.server) ||
        jid
      );
    } else return jid;
  };

  lutz.ev.on("contacts.update", (update) => {
    for (let contact of update) {
      let id = lutz.decodeJid(contact.id);
      if (store && store.contacts)
        store.contacts[id] = { id, name: contact.notify };
    }
  });

  lutz.getName = (jid, withoutContact = false) => {
    id = lutz.decodeJid(jid);
    withoutContact = lutz.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = lutz.groupMetadata(id) || {};
        resolve(
          v.name ||
            v.subject ||
            PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber(
              "international"
            )
        );
      });
    else
      v =
        id === "0@s.whatsapp.net"
          ? {
              id,
              name: "WhatsApp",
            }
          : id === lutz.decodeJid(lutz.user.id)
          ? lutz.user
          : store.contacts[id] || {};
    return (
      (withoutContact ? "" : v.name) ||
      v.subject ||
      v.verifiedName ||
      PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber(
        "international"
      )
    );
  };

  lutz.sendContact = async (jid, kon, quoted = "", opts = {}) => {
    let list = [];
    for (let i of kon) {
      list.push({
        displayName: await lutz.getName(i + "@s.whatsapp.net"),
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await lutz.getName(
          i + "@s.whatsapp.net"
        )}\nFN:${await lutz.getName(
          i + "@s.whatsapp.net"
        )}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
      });
    }
    lutz.sendMessage(
      jid,
      {
        contacts: { displayName: `${list.length} Kontak`, contacts: list },
        ...opts,
      },
      { quoted }
    );
  };

  lutz.public = true;

  lutz.serializeM = (m) => smsg(lutz, m, store);

  lutz.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.badSession) {
        console.log(`Bad Session File, Please Delete Session and Scan Again`);
        lutz.logout();
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log("Connection closed, reconnecting....");
        lutzStartedBot();
      } else if (reason === DisconnectReason.connectionLost) {
        console.log("Connection Lost from Server, reconnecting...");
        lutzStartedBot();
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log(
          "Connection Replaced, Another New Session Opened, reconnecting..."
        );
        lutzStartedBot();
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(`Device Logged Out, Please Scan Again And Run.`);
        lutz.logout();
      } else if (reason === DisconnectReason.restartRequired) {
        console.log("Restart Required, Restarting...");
        lutzStartedBot();
      } else if (reason === DisconnectReason.timedOut) {
        console.log("Connection TimedOut, Reconnecting...");
        lutzStartedBot();
      } else if (reason === DisconnectReason.Multidevicemismatch) {
        console.log("Multi device mismatch, please scan again");
        lutz.logout();
      } else lutz.end(`Unknown DisconnectReason: ${reason}|${connection}`);
    }
    if (
      update.connection == "open" ||
      update.receivedPendingNotifications == "true"
    ) {
      await store.chats.all();
      console.log();
      console.log(
        `\x1b[32mConnected to =\x1b[0m ` + JSON.stringify(lutz.user, null, 2)
      );
    }
  });

  lutz.ev.on("creds.update", saveCreds);

  lutz.sendText = (jid, text, quoted = "", options) =>
    lutz.sendMessage(jid, { text: text, ...options }, { quoted, ...options });

  lutz.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || "";
    let messageType = message.mtype
      ? message.mtype.replace(/Message/gi, "")
      : mime.split("/")[0];
    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    return buffer;
  };

  lutz.downloadAndSaveMediaMessage = async (
    message,
    filename,
    attachExtension = true
  ) => {
    let quoted = message.msg ? message.msg : message;

    let mime = (message.msg || message).mimetype || "";
    let messageType = message.mtype
      ? message.mtype.replace(/Message/gi, "")
      : mime.split("/")[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    let type = await FileType.fromBuffer(buffer);
    trueFileName = attachExtension ? filename + "." + type.ext : filename;
    // save to file
    await fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
  };

  lutz.sendTextWithMentions = async (jid, text, quoted, options = {}) =>
    lutz.sendMessage(
      jid,
      {
        text: text,
        mentions: [...text.matchAll(/@(\d{0,16})/g)].map(
          (v) => v[1] + "@s.whatsapp.net"
        ),
        ...options,
      },
      {
        quoted,
      }
    );

  /**
   *
   * @param {*} jid
   * @param {*} path
   * @param {*} quoted
   * @param {*} options
   * @returns
   */

  return lutz;
}

lutzStartedBot();
