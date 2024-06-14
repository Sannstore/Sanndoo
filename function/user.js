const fs = require("fs");
const { formatmoney } = require("../handler/fmoney");
const formattedBalance = formatmoney;

const addUser = (nomor, nama) => {
  let userData = [];
  try {
    userData = JSON.parse(fs.readFileSync("./libs/users.json", "utf8"));
  } catch (error) {
    console.log(error);
    return;
  }
  const existingUserIndex = userData.findIndex((user) => user.nomor === nomor);

  if (existingUserIndex !== -1) {
    userData[existingUserIndex].nama = nama;
  } else {
    const newUser = {
      nomor: nomor,
      nama: nama,
      role: "BRONZE",
      saldo: 0,
    };

    userData.push(newUser);
  }
  fs.writeFileSync("./libs/users.json", JSON.stringify(userData, null, 2));
};

const setRole = (targetNumber, newRole) => {
  try {
    const usersData = JSON.parse(fs.readFileSync("./libs/users.json"));
    const userIndex = usersData.findIndex(
      (user) => user.nomor === targetNumber
    );

    if (userIndex !== -1) {
      const userData = usersData[userIndex];
      userData.role = newRole;
      fs.writeFileSync("./libs/users.json", JSON.stringify(usersData, null, 2));
      return `*» Note* : Success Set Role\n*» Nomor* : ${targetNumber}\n*» Role* : ${newRole}`;
    } else {
      const newUserData = {
        nomor: targetNumber,
        nama: "No Name",
        saldo: 0,
        role: newRole,
      };

      usersData.push(newUserData);
      fs.writeFileSync("./libs/users.json", JSON.stringify(usersData, null, 2));
      return `*» Note* : Success Set Role\n*» Nomor* : ${targetNumber}\n*» Role* : ${newRole}`;
    }
  } catch (err) {
    console.log(err);
  }
};

const addSaldo = (targetNumber, amount) => {
  try {
    const usersData = JSON.parse(fs.readFileSync("./libs/users.json"));
    const userIndex = usersData.findIndex(
      (user) => user.nomor === targetNumber
    );

    if (userIndex !== -1) {
      const userData = usersData[userIndex];
      const currentSaldo = userData.saldo || 0;
      const newSaldo = currentSaldo + amount;

      userData.saldo = newSaldo;
      fs.writeFileSync("./libs/users.json", JSON.stringify(usersData, null, 2));
      return `*» Note* : Deposit Berhasil\n*» Nomor* : ${targetNumber}\n*» Jumlah* : ${formattedBalance(
        amount
      )}\n*» Total Saldo* : ${formattedBalance(newSaldo)}`;
    } else {
      const newUserData = {
        nomor: targetNumber,
        nama: "No Name",
        saldo: amount,
      };

      usersData.push(newUserData);
      fs.writeFileSync("./libs/users.json", JSON.stringify(usersData, null, 2));
      return `*» Note* : Deposit Berhasil\n*» Nomor* : ${targetNumber}\n*» Jumlah* : ${formattedBalance(
        amount
      )}\n*» Total Saldo* : ${formattedBalance(amount)}`;
    }
  } catch (err) {
    console.log(err);
  }
};

const lessSaldo = (targetNumber, amount) => {
  try {
    const usersData = JSON.parse(fs.readFileSync("./libs/users.json"));
    const userIndex = usersData.findIndex(
      (user) => user.nomor === targetNumber
    );

    if (userIndex !== -1) {
      const userData = usersData[userIndex];
      const currentSaldo = userData.saldo || 0;

      if (currentSaldo >= amount) {
        const newSaldo = currentSaldo - amount;

        userData.saldo = newSaldo;
        fs.writeFileSync(
          "./libs/users.json",
          JSON.stringify(usersData, null, 2)
        );
      } else {
        console.log("Gabisa");
      }
    } else {
      return "Nomor tidak ditemukan dalam database.";
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  addUser,
  setRole,
  addSaldo,
  lessSaldo,
};
