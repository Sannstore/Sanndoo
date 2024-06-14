const fs = require("fs");
global.d = new Date();
global.calender = d.toLocaleDateString("id");

global.namabot = "Lutz Store"; // Nama bot
global.namaowner = "Vladimir Lutz"; // Nama owner
global.owner = ["6283129196077"]; // Nomor owner
global.invo = "LSD" + "-"; // LSD nya aja yang diganti
global.pp_bot = "https://telegra.ph/file/5f22e175f5b4e1d1659db.jpg"; // upload di telegra.ph
global.web = "https://instagram.com/ntlutz"; // Bebas mau link gc ataupun apa

// Digiflazz
const digiuser = ""; // Username
const digiapi = ""; // Production key

// Keuntungan role
/*
RUMUS:
(Nilai persentase - 1) * 100
*/
const bronze = 1.015; // 1.5% (1.015 - 1 * 100 = 0.015 * 100 = 1.5%)
const silver = 1.01; // 1% (1.01 - 1 * 100 = 0.01 * 100 = 1%)
const gold = 1.005; // 0.5% (1.005 - 1 * 100 = 0.005 * 100 = 0.5%)

module.exports = {
  digiuser,
  digiapi,
  bronze,
  silver,
  gold,
};

let file = require.resolve(__filename);
const chalk = require("chalk");
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.greenBright(`Lutz Store Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
