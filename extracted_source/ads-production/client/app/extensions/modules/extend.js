/* eslint no-extend-native: 0 */

String.prototype.format = function format(...args) {
  return this.replace(/{(\d+)}/g, (match, number) => (typeof args[number] !== 'undefined' ? args[number] : match));
};

Number.prototype.format = function format(c, d, t) {
  c = Math.abs(c);
  c = isNaN(c) ? 2 : c;
  d = d === undefined ? '.' : d;
  t = t === undefined ? ',' : t;

  const s = this < 0 ? '-' : '';
  const n = Math.abs(Number(this) || 0).toFixed(c);
  const i = parseInt(n, 10).toString();
  let j = i.length;
  j = j > 3 ? j % 3 : 0;

  return s + (j ? i.substr(0, j) + t : '') + i.substr(j)
    .replace(/(\d{3})(?=\d)/g, `$1${t}`) + (c ? d + Math.abs(this - i).toFixed(c).slice(2) : '');
};
Number.prototype.pad = function () {
    return (this < 10) ? '0' + this.toString() : this.toString();
}

String.prototype.capitalize = function capitalize() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

const latinMap = {
  // a
  á: 'a',
  Á: 'A',
  à: 'a',
  À: 'A',
  ả: 'a',
  Ả: 'A',
  ã: 'a',
  Ã: 'A',
  ạ: 'a',
  Ạ: 'A',
  // ă
  ă: 'a',
  Ă: 'A',
  ắ: 'a',
  Ắ: 'A',
  ằ: 'a',
  Ằ: 'A',
  ẳ: 'a',
  Ẳ: 'A',
  ẵ: 'a',
  Ẵ: 'A',
  ặ: 'a',
  Ặ: 'A',
  // â
  â: 'a',
  Â: 'A',
  ấ: 'a',
  Ấ: 'A',
  ầ: 'a',
  Ầ: 'A',
  ẩ: 'a',
  Ẩ: 'A',
  ẫ: 'a',
  Ẫ: 'A',
  ậ: 'a',
  Ậ: 'A',
  // đ
  đ: 'd',
  Đ: 'D',
  // e
  é: 'e',
  É: 'E',
  è: 'e',
  È: 'E',
  ẻ: 'e',
  Ẻ: 'E',
  ẽ: 'e',
  Ẽ: 'E',
  ẹ: 'e',
  Ẹ: 'E',
  // ê
  ê: 'e',
  Ê: 'E',
  ế: 'e',
  Ế: 'E',
  ề: 'e',
  Ề: 'E',
  ể: 'e',
  Ể: 'E',
  ễ: 'e',
  Ễ: 'E',
  ệ: 'e',
  Ệ: 'E',
  // i
  í: 'i',
  Í: 'I',
  ì: 'i',
  Ì: 'I',
  ỉ: 'i',
  Ỉ: 'I',
  ĩ: 'i',
  Ĩ: 'I',
  ị: 'i',
  Ị: 'I',
  // o
  ó: 'o',
  Ó: 'O',
  ò: 'o',
  Ò: 'O',
  ỏ: 'o',
  Ỏ: 'O',
  õ: 'o',
  Õ: 'O',
  ọ: 'o',
  Ọ: 'O',
  // ô
  ô: 'o',
  Ô: 'O',
  ố: 'o',
  Ố: 'O',
  ồ: 'o',
  Ồ: 'O',
  ổ: 'o',
  Ổ: 'O',
  ỗ: 'o',
  Ỗ: 'O',
  ộ: 'o',
  Ộ: 'O',
  // ơ
  ơ: 'o',
  Ơ: 'O',
  ớ: 'o',
  Ớ: 'O',
  ờ: 'o',
  Ờ: 'O',
  ở: 'o',
  Ở: 'O',
  ỡ: 'o',
  Ỡ: 'O',
  ợ: 'o',
  Ợ: 'O',
  // u
  ú: 'u',
  Ú: 'U',
  ù: 'u',
  Ù: 'U',
  ủ: 'u',
  Ủ: 'U',
  ũ: 'u',
  Ũ: 'U',
  ụ: 'u',
  Ụ: 'U',
  // ư
  ư: 'u',
  Ư: 'U',
  ứ: 'u',
  Ứ: 'U',
  ừ: 'u',
  Ừ: 'U',
  ử: 'u',
  Ử: 'U',
  ữ: 'u',
  Ữ: 'U',
  ự: 'u',
  Ự: 'U',
  // y
  ý: 'y',
  Ý: 'Y',
  ỳ: 'y',
  Ỳ: 'Y',
  ỷ: 'y',
  Ỷ: 'Y',
  ỹ: 'y',
  Ỹ: 'Y',
  ỵ: 'y',
  Ỵ: 'Y',
};

String.prototype.latinise = function latinise() {
  return this.replace(/[^A-Za-z0-9[\] ]/g, x => latinMap[x] || x);
};
String.prototype.latinize = String.prototype.latinise;

String.prototype.isLatin = function isLatin() {
  return (this === this.latinise());
};
