import Promise from 'bluebird';

export default function(app) {
  const selectOptions = require('./select_options.json');
  return Promise
    .each(selectOptions, item => {
      return app.models.SelectOption.create(item);
    })
    .catch(err => {
      console.log(err);
    });
}
