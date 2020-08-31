const request = require('supertest')
const app = require('../src/app')
const {userOne, userOneId, setupDatabase} = require('./fixtures/db')
const User = require('../src/models/user')


beforeEach(setupDatabase)


test('Should Sign Up an user', async () => {
   const response = await request(app).post('/users').send({
        name: 'Itshak',
        email: 'Itshakbar@gmail.com',
        password: '123456789'
    }).expect(201)

    // Assert that the database was changes correctly.
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Itshak',
            email: 'itshakbar@gmail.com'
        },
        token: user.tokens[0].token
    })

    expect(user.password).not.toBe('123456789')
})

test('Should Login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not Login non-existing user', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: 'blablabla'
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar','tests/fixtures/profile-pic.jpg')
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async () => {
    const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Shlomi'
        })
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.name).toEqual('Shlomi')
})

test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            fname: 'Itshak'
        })
        .expect(400)
})