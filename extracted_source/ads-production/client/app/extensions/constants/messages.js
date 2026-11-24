export default angular
  .module('app.constant.messages', [])
  .constant('Messages', {
    confirmDelete: 'Are you sure to delete {0}?',
    actionConfirm: 'Are you sure to {0} {1}?',
    confirmInvalidCampaign: 'Are you sure to delete {0}? \n Will make campaign {1} invalid! \n',
    cancel: 'Canceled',
    createSuccess: 'Created successfully!',
    updateSuccess: 'Updated successfully!',
    deleteSuccess: 'Deleted successfully!',
    refreshSuccess: 'Refreshed successfully!',
    changePasswordSuccess: 'Password changed successfully!',
    actionSuccess: '{0} successfully!',
    createFailed: 'Create failed!',
    updateFailed: 'Update failed!',
    deleteFailed: 'Delete failed!',
    changePasswordFailed: 'Change password failed!',
    actionFailed: '{0} failed!',
    copyToClipboardSuccess: 'Copied to clipboard!',
    copyToClipboardFailed: 'Failed to copy! Please do it by hand!',
    chartNoData: 'No data to display',
    tooManyRecords: [
      'Exceed maximum records (can only export 100.000 records),',
      'please select some appropriate fields',
    ].join(' '),
    popupBlocked:
      'Your browser is blocking popups. Please disable for this page.',

    INVALID_PASSWORD: 'Password is incorrect',
  });
