export default angular
    .module('app.constant.vnmessages', [])
    .constant('VNMessages', {
        confirmDelete: 'Bạn có chắc chắn xóa <b>{0}</b>?',
        actionConfirm: 'Bạn có chắc chắn {0} {1}?',
        confirmInvalidCampaign: 'Bạn có chắc chắn xóa <b>{0}</b>? \n Điều này sẽ thay đổi trạng thái của campaign <b>{1}</b> thành invalid! \n',
        cancel: 'Hủy bỏ',
        createSuccess: 'Tạo thành công!',
        updateSuccess: 'Cập nhật thành công!',
        deleteSuccess: 'Xóa thành công!',
        refreshSuccess: 'Refresh thành công!',
        changePasswordSuccess: 'Mật khẩu đã được thay đổi!',
        actionSuccess: '{0} thành công!',
        createFailed: 'Lỗi khi tạo!',
        updateFailed: 'Lỗi khi cập nhật!',
        deleteFailed: 'Lỗi khi xóa!',
        changePasswordFailed: 'Thay đổi mật khẩu không thành công!',
        actionFailed: '{0} thất bại!',
        copyToClipboardSuccess: 'Đã sao chép!',
        copyToClipboardFailed: 'Lỗi khi copy! Vui lòng copy bằng tay!',
        chartNoData: 'Không có data được hiển thị',
        tooManyRecords: [
            'Exceed maximum records (can only export 100.000 records),',
            'please select some appropriate fields',
        ].join(' '),
        popupBlocked:
            'Your browser is blocking popups. Please disable for this page.',

        INVALID_PASSWORD: 'Mật khẩu không chính xác',
    });
