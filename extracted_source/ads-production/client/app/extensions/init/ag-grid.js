import angular from 'angular';

export default Promise
  .all([
    import(/* webpackChunkName: "ag-grid" */ 'ag-grid-enterprise/dist/ag-grid-enterprise.noStyle'),
    import(/* webpackChunkName: "ag-grid" */ 'ag-grid/dist/styles/ag-grid.css'),
    import(/* webpackChunkName: "ag-grid" */ 'ag-grid/dist/styles/theme-material.css'),
    import(/* webpackChunkName: "ag-grid" */ 'assets/styles/custom/ag-grid.less')
  ])
  .spread((agGrid) => {
    agGrid.initialiseAgGridWithAngular1(angular);
    agGrid.LicenseManager.setLicenseKey('NDEwMjMzMzIwMDAwMA==4776ae9eddc069aad222a64b09b9e834');
    return 'agGrid';
  });
