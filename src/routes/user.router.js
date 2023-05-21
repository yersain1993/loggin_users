const { getAll, create, getOne, remove, update, verify, login, getLoggedUser, resetPassword, verifyResetPassword } = require('../controllers/user.controllers');
const express = require('express');
const verifyJWT = require('../utils/verifyJWT');

const userRouter = express.Router();

userRouter.route('/')
    .get(verifyJWT, getAll)
    .post(create);

userRouter.route('/login')
    .post(login);

userRouter.route('/me')
    .get(verifyJWT, getLoggedUser);

userRouter.route('/reset_password')
    .post(resetPassword);

userRouter.route('/reset_password/:code')
    .post(verifyResetPassword);

userRouter.route('/:id')
    .get(verifyJWT, getOne)
    .delete(verifyJWT, remove)
    .put(verifyJWT, update);

userRouter.route('/verify/:code')
    .get(verify)

module.exports = userRouter;