function formatYMD(date) {
  return date.toISOString().split('T')[0];
}

function getDateNDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

module.exports = {
  formatYMD,
  getDateNDaysAgo
};
