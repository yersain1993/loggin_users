const catchError = require('../utils/catchError');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');
const EmailCode = require('../models/EmaillCode');
const jwt = require('jsonwebtoken');

const getAll = catchError(async(req, res) => {
    const results = await User.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({...req.body, password: hashedPassword});
    const code = require('crypto').randomBytes(32).toString('hex');
    const link = `${req.body.frontBaseUrl}/verify_email/${code}`
    await sendEmail({
        to:`${req.body.email}`,
        subject: "Email validation",
        html: `
        <h1> Hi, ${req.body.firstName} ${req.body.lastName} </h1>
        <p> Thanks for sign up our app, please verify you email: </p>
        <a href="${link}"> cick here to verify your email </a>

        `
    });
    await EmailCode.create({ code, userId: user.id })
    return res.status(201).json(user);
});

const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await User.findByPk(id);
    if(!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    await User.destroy({ where: {id} });
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await User.update(
        req.body,
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});

const verify = catchError(async(req, res) => {
    const { code } = req.params;
    const codeFound = await EmailCode.findOne({where: {code}});
    if(!codeFound) return res.status(401).json({message: "Invalid Code"});
    const user = await User.update(
        { isVerified: true },
        { where: { id: codeFound.userId }, returning: true }
    );
    await codeFound.destroy();
    return res.json(user);
})

const login = catchError(async(req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({where: {email}});
    if(!user) return res.status(401).json({message: "Invalid credentials"});
    const isValid = await bcrypt.compare(password, user.password);
    if(!isValid) return res.status(401).json({message: "Invalid credentials"});
    if(!user.isVerified) return res.status(401).json({message: "Verify your email first"});
    const token = jwt.sign(
        { user },
        process.env.TOKEN_SECRET,
        { expiresIn: '1d' }
    );
    return res.json({user, token});
});

const getLoggedUser = catchError(async(req, res) => {
    const user = req.user;
    return res.json(user);
})

const resetPassword = catchError(async(req, res) => {
    const { email } = req.body;
    const user = await User.findOne({where: {email}});
    console.log(user);
    if(!user) return res.status(401).json({ message: "User doesn´t exist" });
    const code = require('crypto').randomBytes(32).toString('hex');
    const link = `${req.body.frontBaseUrl}/reset_password/${code}`
    await sendEmail({
        to:`${email}`,
        subject: "Password reset",
        html: `
        <h1> Hi, ${user.firstName} ${user.lastName} </h1>
        <p> Please click in the following link to reset password: </p>
        <a href="${link}"> cick here to reset your password </a>

        `
    });
    await EmailCode.create({ code, userId: user.id });
    return res.status(201).json({message: "email sent"});
});

const verifyResetPassword = catchError(async(req, res) => {
    const { code } = req.params;
    console.log(req.body.password);
    const codeFound = await EmailCode.findOne({where: {code}});
    if(!codeFound) return res.status(401).json({message: "Invalid Code"});
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.update(
        { password: hashedPassword },
        { where: { id: codeFound.userId }, returning: true }
    );
    await codeFound.destroy();
    return res.status(201).json(user);
});

module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update,
    verify,
    login,
    getLoggedUser,
    resetPassword,
    verifyResetPassword
}