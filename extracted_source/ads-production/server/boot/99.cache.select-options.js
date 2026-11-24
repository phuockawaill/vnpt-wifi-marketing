const lodash = require('lodash');

module.exports = (app, next) => {
  // if (!app.shouldStart) return next();

  const SelectOption = app.models.SelectOption;
  return SelectOption
    .find({ fields: { text: 1, value: 1, options: 1, type: 1 } })
    .then((data) => {
      const types = lodash.groupBy(data, row => row.type);
      Object.keys(types).forEach((type) => {
        app.set(`op:${type}`, types[type]);
        const hash = {};
        types[type].forEach((row) => {
          hash[row.value] = row.text;
        });
        app.set(`op:h:${type}`, hash);
      });
      next();
    })
    .catch(next);
};
