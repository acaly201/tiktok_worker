const getCurrentTimeAsString = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Thêm 0 đằng trước nếu cần
  const day = String(currentDate.getDate()).padStart(2, '0'); // Thêm 0 đằng trước nếu cần
  const hours = String(currentDate.getHours()).padStart(2, '0'); // Thêm 0 đằng trước nếu cần
  const minutes = String(currentDate.getMinutes()).padStart(2, '0'); // Thêm 0 đằng trước nếu cần
  const seconds = String(currentDate.getSeconds()).padStart(2, '0'); // Thêm 0 đằng trước nếu cần

  const currentTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  return currentTimeString;
}

const printLog = (str) => {
  console.log(`${getCurrentTimeAsString()} | [INFO] ${str}`);
}

const printErrLog = (str) => {
  console.log(`${getCurrentTimeAsString()} | [ERROR] ${str}`);
}

module.exports = {
  getCurrentTimeAsString, printLog, printErrLog
};