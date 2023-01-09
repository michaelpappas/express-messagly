"use strict";

const db = require("../db");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone)
         VALUES
           ($1, $2, $3, $4, $5)
         RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]);

    return res.json(result.rows[0]);
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
         FROM users
         WHERE username = $1`,
      [username]);
  const user = result.rows[0];

  return await bcrypt.compare(password, user.password) === true;
  // if (user) {
  //   if (await bcrypt.compare(password, user.password) === true) {
  //     return res.json({ message: "Logged in!" });
  //   }
  // }
  // throw new UnauthorizedError("Invalid user/password");
  }


  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
       SET last_login_at = current_timestamp
         WHERE username = $1
         RETURNING username, last_login_at`,
    [username]);
  const user = result.rows[0];

  if (!user) throw new NotFoundError(`No such user: ${username}`);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name
       FROM users
       RETURNING username, first_name, last_name`
    )
    return results.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username,first_name,last_name,phone,join_at,last_login_at
       FROM users
       WHERE username = $1
       RETURNING username,first_name,last_name,phone,join_at,last_login_at`,
       [username])

       const user = results.rows[0]

       if (!user) throw new NotFoundError(`No such user: ${username}`);

       return user
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT m.id,
              m.to_username AS to_user,
              m.body,
              m.sent_at,
              m.read_at
       FROM messages AS m
       JOIN users AS t ON m.to_username = t.username
       WHERE t.username = $1`,
      [username]
    )
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
  }
}


module.exports = User;