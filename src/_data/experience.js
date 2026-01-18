module.exports = function() {
  const startYear = 2001;
  const currentYear = new Date().getFullYear();
  const years = currentYear - startYear;
  return {
    years: years,
    display: years
  };
};
