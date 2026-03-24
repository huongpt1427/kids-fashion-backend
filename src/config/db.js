const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,       // thêm dòng này
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const promisePool = pool.promise();

// Hỗ trợ transaction
promisePool.getConnection = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) reject(err);
      else {
        const promiseConn = conn.promise();
        promiseConn.release = () => conn.release();
        resolve(promiseConn);
      }
    });
  });
};

module.exports = promisePool;