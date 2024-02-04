const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
const databasePath = path.join(__dirname, 'userData.db')
let db = null

const intializeDbAndServer = async (request, response) => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

intializeDbAndServer()

const validatePassword = password => {
  return password.length < 4
}

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(selectQuery)
  if (dbUser === undefined) {
    const createUserQuery = `INSERT INTO user(username,name,password,gender,location) VALUES ('${username}','${name}'.'${hashedPassword}'.'${gender}','${location}');`

    if (validatePassword(password)) {
      await db.run(createUserQuery)
      response.send('User Created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exits')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPaswordChanged = await bcrypt.compare(password, dbUser.password)
    if (isPaswordChanged == true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid Password!')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPaswordChanged = await bcrypt.compare(password, dbUser.password)
    if (isPaswordChanged == true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `UPDATE user SET password='${hashedPassword}' WHERE username='${username}';`
        const user = await db.run(updatePasswordQuery)
        response.send('Password udated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
