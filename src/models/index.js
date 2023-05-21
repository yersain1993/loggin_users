const EmailCode = require("./EmaillCode");
const User = require("./User");

EmailCode.belongsTo(User);
User.hasOne(EmailCode);
