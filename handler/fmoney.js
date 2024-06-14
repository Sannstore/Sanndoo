function formatmoney(n, opt = {}) {
  if (!opt.current) opt.current = "Rp";
  return opt.current + " " + Math.ceil(n).toLocaleString("id");
}

module.exports = { formatmoney };
