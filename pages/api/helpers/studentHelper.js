const Student = require("../models/studentModel");
const sendMail = require("../utils/sentMail");
const config = require("../config/default");
const {
    verifyActivationToken,
    verifyResetToken,
} = require("../utils/verifyJwtToken");

const REFERRAL_ID = "REFERRAL";
const { CLIENT_HOST } = config.CLIENT;

/**
 * Create a account with some credentials for students
 * @param {Object} data - { name, email, role, universityId, semester, collegeName, graduationYear, mobile, password, referralId }
 **/
const signup = (data) => {
    const {
        name,
        email,
        universityId,
        referralId,
        semester,
        collegeName,
        graduationYear,
        mobile,
        password,
    } = data;
    return new Promise(async (resolve, reject) => {
        if (
            !name ||
            !email ||
            !semester ||
            !mobile ||
            !password ||
            !universityId ||
            !collegeName
        ) {
            return reject({
                message: "Please provide all the required fields",
            });
        }
        try {
            // To find a data using the current credentials
            const studentFound = await Student.find({
                $and: [{ $or: [{ email }, { mobile }, { universityId }] }],
            });

            if (studentFound.length <= 0) {
                const student = new Student({
                    name,
                    email,
                    semester,
                    mobile,
                    password,
                    universityId,
                    collegeName,
                });
                if (referralId) {
                    if (referralId === REFERRAL_ID) {
                        student.role = "Indoor Student";
                        student.referralId = referralId;
                        student.graduationYear = graduationYear;
                    } else {
                        return reject({
                            message: "Invalid ReferralId",
                        });
                    }
                }
                await student.save();
                const token = await student.generateActivationToken();
                data = {
                    email: student.email,
                    userName: student.name,
                    type: "Activation",
                    URL: `${CLIENT_HOST}/student/activation-token/${token}`,
                };
                await sendMail(data);
                resolve({
                    message:
                        "A link to activate your account has been emailed to the address provided",
                });
            } else {
                reject({
                    message: "Account already exists",
                });
            }
        } catch (error) {
            reject({
                message: error.message,
                code: error.code || error.name,
            });
        }
    });
};