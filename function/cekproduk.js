const axios = require("axios");
const crypto = require("crypto");

const cekProdukDigi = async (digiuser, digiapi, code) => {
  const signature = crypto
    .createHash("md5")
    .update(digiuser + digiapi + "pricelist")
    .digest("hex");

  try {
    const response = await axios.post(
      "https://api.digiflazz.com/v1/price-list",
      {
        cmd: "prepaid",
        username: digiuser,
        code: code,
        sign: signature,
      }
    );

    const data = response.data;
    return data;
  } catch (error) {
    return error.message;
  }
};

module.exports = cekProdukDigi;
